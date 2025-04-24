import logging
from typing import List, Tuple
from bs4 import BeautifulSoup
from src.llm_service import LLMService
from src.models.product import Product
from src.extractors.html_utils import (
    extract_main_content,
    chunk_html,
    extract_text_with_context,
    estimate_tokens,
    deduplicate_products
)

logger = logging.getLogger(__name__)


def clean_html(html_content: str, aggressive: bool = False) -> str:
    """Removes script and style tags (minimal), or optionally more tags (aggressive)."""
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, "html.parser")
    
    tags_to_remove = ["script", "style"]
    if aggressive:
        # Add tags typically not containing core product info for aggressive cleaning
        tags_to_remove.extend(["nav", "header", "footer", "aside", "form", "noscript", "link", "meta"])

    for tag in soup.find_all(tags_to_remove):
        tag.decompose()

    # Optional: Remove comments
    # for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
    #     comment.extract()

    # Optional: Basic whitespace cleanup (might affect formatting LLM relies on)
    # return ' '.join(soup.stripped_strings)
    
    return str(soup)


def extract_products_adaptively(
    page_html: str, 
    url: str, 
    llm_service: LLMService
) -> Tuple[List[Product], str]:
    """Implements the adaptive extraction pipeline based on the directive.

    Tries strategies in order: minimal cleaning -> structure filtering -> chunking -> text fallback.
    Returns the extracted products and the name of the stage that succeeded.
    """
    if not page_html:
        return [], "empty_input"

    # --- Stage 1: Minimal Cleaning --- (Original approach)
    logger.info(f"Adaptive Stage 1: Minimal Cleaning for {url}")
    minimally_cleaned_html = clean_html(page_html, aggressive=False)
    if minimally_cleaned_html:
        logger.debug(f"Stage 1: Sending minimally cleaned HTML (tokens: ~{estimate_tokens(minimally_cleaned_html)}) to LLM.")
        products = llm_service.extract_products(page_html=minimally_cleaned_html, url=url)
        if products:
            logger.info(f"Adaptive Stage 1 SUCCESS: Found {len(products)} products using minimal cleaning.")
            return products, "minimal_cleaning"
        logger.info("Adaptive Stage 1: No products found with minimal cleaning. Proceeding to Stage 2.")
    else:
        logger.warning("Adaptive Stage 1: Minimal cleaning resulted in empty HTML. Skipping to Stage 2.")

    # --- Stage 2: Structure-Aware Filtering --- 
    logger.info(f"Adaptive Stage 2: Structure-Aware Filtering for {url}")
    # Use the already minimally cleaned HTML as input for filtering
    filtered_html = extract_main_content(minimally_cleaned_html if minimally_cleaned_html else page_html)
    if filtered_html:
        logger.debug(f"Stage 2: Sending structure-filtered HTML (tokens: ~{estimate_tokens(filtered_html)}) to LLM.")
        products = llm_service.extract_products(page_html=filtered_html, url=url)
        if products:
            logger.info(f"Adaptive Stage 2 SUCCESS: Found {len(products)} products using structure filtering.")
            return products, "structure_filtered"
        logger.info("Adaptive Stage 2: No products found with structure filtering. Proceeding to Stage 3.")
    else:
        logger.warning("Adaptive Stage 2: Structure filtering resulted in empty HTML. Skipping to Stage 3.")
        # Ensure filtered_html is defined for Stage 3 input, fallback to minimally cleaned
        filtered_html = minimally_cleaned_html if minimally_cleaned_html else page_html

    # --- Stage 3: Chunking --- 
    logger.info(f"Adaptive Stage 3: Chunking for {url}")
    # Use the output of Stage 2 (filtered_html) as input for chunking
    # Retrieve max_tokens setting from config if available, else default
    # TODO: Get max_tokens from LLM_CONFIG or pass it in
    max_chunk_tokens = 8000 # Default, align with chunk_html default
    chunks = chunk_html(filtered_html, max_tokens=max_chunk_tokens)
    if chunks:
        logger.debug(f"Stage 3: Processing {len(chunks)} chunks (max_tokens per chunk: {max_chunk_tokens}).")
        all_products_from_chunks = []
        for i, chunk in enumerate(chunks):
            logger.debug(f"Stage 3: Sending chunk {i+1}/{len(chunks)} (tokens: ~{estimate_tokens(chunk)}) to LLM.")
            chunk_products = llm_service.extract_products(page_html=chunk, url=f"{url}#chunk={i+1}") # Append chunk info to URL for context/logging
            if chunk_products:
                logger.debug(f"Stage 3: Found {len(chunk_products)} products in chunk {i+1}.")
                all_products_from_chunks.extend(chunk_products)
            else:
                 logger.debug(f"Stage 3: No products found in chunk {i+1}.")
        
        if all_products_from_chunks:
            # TODO: Add de-duplication logic here if needed?
            logger.info(f"Adaptive Stage 3: Found {len(all_products_from_chunks)} raw products total using chunking.")
            deduped_products = deduplicate_products(all_products_from_chunks)
            logger.info(f"Adaptive Stage 3 SUCCESS: Found {len(deduped_products)} unique products after deduplication.")
            return deduped_products, "chunked"
        logger.info("Adaptive Stage 3: No products found across all chunks. Proceeding to Stage 4.")
    else:
        logger.warning("Adaptive Stage 3: Chunking resulted in no chunks. Skipping to Stage 4.")

    # --- Stage 4: Text Only Fallback --- 
    logger.info(f"Adaptive Stage 4: Text Only Fallback for {url}")
    # Use the original page_html for text extraction to capture everything
    text_only_content = extract_text_with_context(page_html)
    if text_only_content:
        logger.debug(f"Stage 4: Sending text-only content (tokens: ~{estimate_tokens(text_only_content)}) to LLM.")
        products = llm_service.extract_products(page_html=text_only_content, url=url) # Send as page_html, let LLM handle it
        if products:
            logger.info(f"Adaptive Stage 4 SUCCESS: Found {len(products)} products using text-only fallback.")
            return products, "text_only"
        logger.info("Adaptive Stage 4: No products found with text-only fallback. Exhausted all strategies.")
    else:
        logger.warning("Adaptive Stage 4: Text extraction resulted in empty content. Cannot proceed.")

    # --- Final Fallback --- 
    logger.warning(f"All adaptive extraction stages failed for {url}. Returning empty list.")
    return [], "failed_all_stages"


class LLMProductExtractor:
    """Uses an LLMService to extract product information from text via an adaptive pipeline."""
    def __init__(self, llm_service: LLMService):
        self.llm_service = llm_service
        logger.info("LLMProductExtractor initialized.")

    def extract(self, page_html: str, url: str) -> List[Product]:
        """Extracts products from HTML content using the adaptive LLM pipeline.

        Args:
            page_html: The raw HTML content of the page.
            url: The URL of the page (for context).

        Returns:
            A list of extracted Product objects.
        """
        logger.info(f"Starting adaptive product extraction for URL: {url}")
        
        try:
            # Call the adaptive pipeline orchestrator
            # Explicitly unpack the returned tuple
            result_tuple = extract_products_adaptively(
                page_html=page_html, 
                url=url, 
                llm_service=self.llm_service
            )
            products_list: List[Product] = result_tuple[0]
            stage_used: str = result_tuple[1]
            
            logger.info(f"Adaptive extraction for {url} finished. Stage used: '{stage_used}'. Found {len(products_list)} products.")
            # Explicitly return only the products list from the tuple
            return products_list

        except Exception as e:
            logger.error(f"Adaptive extraction process failed catastrophically for {url}: {e}", exc_info=True)
            # Return empty list on major failure in the orchestrator
            return []

# Example Usage (requires LLMService instance and Product model):
# if __name__ == "__main__":
#     from src.llm_service import LLMService # Assuming LLMService is set up
#     # llm_service = LLMService() # Initialize your service
#     # extractor = LLMProductExtractor(llm_service)
#     # sample_url = "your_test_url_here"
#     # sample_html = "<html>...</html>" # Fetch or load HTML
#     # extracted = extractor.extract(page_html=sample_html, url=sample_url)
#     # print("Extracted Products:", extracted)
