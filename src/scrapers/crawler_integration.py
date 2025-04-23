"""
Integration module for connecting the Playwright crawler with the WebsiteAnalysisMCP.
This module provides functions to trigger crawls and format the results for the MCP pipeline.
Includes robust error handling, standardized output formats, and enhanced product extraction.
"""

import asyncio
import json
import logging
import os
import re
import sys
import time
from typing import Dict, Any, Optional, List, Tuple, Set
from urllib.parse import urlparse, urljoin

from bs4 import BeautifulSoup, Tag

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import setup_logging from src.utils.logging_config and call setup_logging(logging.DEBUG)
from src.utils.logging_config import setup_logging
setup_logging(logging.DEBUG)

# --- Constants for Contact Extraction ---
PHONE_REGEX = re.compile(r'(?:(?:\+|00)[1-9]\d{0,2}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}')
EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
STREET_REGEX = re.compile(r'\d{1,5}\s+[A-Za-z0-9\s\.\,\-\#]{4,60}')
ZIP_CODE_REGEX = re.compile(r'\b\d{4,10}\b')
SOCIAL_MEDIA_REGEX = re.compile(r'(?:https?://)?(?:www\.)?(?:facebook|instagram|twitter|linkedin|youtube|whatsapp|wa\.me|t\.me|tiktok)\.(?:com|me|org|net)/[\w\.-]+', re.IGNORECASE)
# TODO: Load known cities/countries from config for better address matching
CONTACT_SELECTORS = ['footer', 'address', '[class*="contact"]', '[id*="contact"]', '[class*="location"]', '[id*="location"]', '[class*="info"]', '[id*="info"]']
# --- End Constants ---

async def crawl_and_prepare_content(url: str, max_pages: int = 20, retry_count: int = 1) -> Dict[str, Any]:
    """
    Crawls a website using SimpleCrawler, extracts content and products,
    enhances with contact info, calculates confidence, and formats the output.
    Handles retries and returns a specific error structure on final failure.
    """
    # Ensure URL has a scheme
    parsed_original = urlparse(url)
    if not parsed_original.scheme:
        url = f"http://{url}" # Default to http, crawler might handle https redirect

    result: Dict[str, Any] = {
        "metadata": {
            "start_url": url,
            "max_pages_limit": max_pages,
            "crawl_status": "pending",
            "error": None,
            "confidence_score": 0.0, # Task 2: Initialize confidence
            "contact_info": { # Initialize contact structure
                "emails": [],
                "phones": [],
                "addresses": [],
                "social_links": []
            },
        },
        "pages": [],
        "aggregated_products": [], # Keep aggregated products top-level
        "detected_pdf_urls": [] # New field for detected PDF URLs
    }

    for attempt in range(retry_count + 1):
        try:
            logger.info(f"Starting crawl attempt {attempt + 1} for {url}")
            # --- IMPORTANT: Adjust SimpleCrawler instantiation and method call --- 
            # Make sure 'SimpleCrawler' is imported and the method name ('run_async') is correct.
            from .simple_crawler import SimpleCrawler # Ensure import
            crawler = SimpleCrawler(max_pages=max_pages)
            crawled_data = await crawler.crawl(url) # Use the correct 'crawl' method
            logger.debug(f"Raw crawl_results received: {crawled_data}") # Log the entire result

            if not crawled_data or not crawled_data.get(url):
                 # Check if any data returned at all, even if start URL failed but others worked
                 if not crawled_data:
                     raise ValueError("Crawler returned no data at all.")
                 else: # Data exists, but maybe not for the exact start URL - proceed if other pages found
                     logger.warning(f"Crawler did not return data specifically for the start URL {url}, but other pages might exist.")

            # Process successful crawl (even if start URL itself failed but others were found)
            result["metadata"]["crawl_status"] = "partial" # Assume partial until verified complete

            successful_pages_count = 0
            aggregated_contacts: Dict[str, Set[str]] = {
                 "emails": set(), "phones": set(), "addresses": set(), "social_links": set()
            }
            all_products = [] # Collect products from all pages
            detected_pdfs_in_loop = [] # Use a temporary list

            pages_list = crawled_data.get('pages', [])
            logger.debug(f"Processing {len(pages_list)} pages found in crawl results.")

            for page_data in pages_list:
                # page_data is now guaranteed to be a dictionary from the list

                logger.debug(f"--- Loop Iteration Start ---")
                page_url_from_data = page_data.get('url', 'Unknown URL')
                logger.debug(f"Processing page_url from data: {page_url_from_data}")
                logger.debug(f"Full page_data for this iteration: {page_data}")

                # Initialize page summary dict
                page_summary = {
                    "url": page_url_from_data,
                    "title": page_data.get("title", ""),
                    "status": 'success' if page_data.get("text") else 'processed_no_text', # Simplified status based on text presence
                    "error": None # Assume no error if we got this far, SimpleCrawler logs errors internally
                }
                
                # Check page status and content (using the correct keys from SimpleCrawler's page_data)
                if page_data.get("text"):
                    successful_pages_count += 1
                    page_url_for_check = page_data.get("url", "")
                    is_contact = "contact" in page_url_for_check.lower() # Simple check based on URL

                    logger.debug(f"--- Loop Iteration Start ---")
                    logger.debug(f"Processing page_url in loop: {page_url_for_check}")
                    logger.debug(f"Full page_data for this iteration: {page_data}")

                    # --- Task 1: Extract contacts per page --- 
                    page_contacts = extract_contact_info(
                        page_data["text"],
                        page_url_for_check,
                        is_contact_page=is_contact
                    )
                    for key in aggregated_contacts:
                        aggregated_contacts[key].update(page_contacts.get(key, []))
                    # --- End Task 1 --- 

                    page_products = page_data.get("products_found", [])
                    all_products.extend(page_products)
                    # Add page-specific details if needed for debugging/analysis
                    page_summary["products_found_on_page"] = len(page_products)
                    page_summary["contacts_found_on_page"] = {k: len(v) for k, v in page_contacts.items()}
                    # Avoid storing full text/HTML unless necessary due to size
                    # page_summary["text_content_preview"] = BeautifulSoup(page_data["content"], 'html.parser').get_text(separator=' ', strip=True)[:500] + "..."
                
                result["pages"].append(page_summary)

                # --- ADDED HTML LOGGING (MODIFIED FOR BODY HTML DEBUG) ---
                page_url = page_data.get('url', 'N/A')
                page_body_html_snippet = page_data.get('body_html_debug', '')[:5000] # Log first 5000 chars of body
                logger.info(f"Body HTML Snippet for {page_url}:\n{page_body_html_snippet}\n---")
                # --- END ADDED HTML LOGGING ---
                
                # --- Add PDF Link Detection --- 
                if page_data.get("text"):
                     try:
                         page_soup = BeautifulSoup(page_data["text"], 'html.parser')
                         pdf_links = page_soup.find_all('a', href=re.compile(r'\.pdf$', re.IGNORECASE))
                         
                         for link in pdf_links:
                             href = link.get('href')
                             if href:
                                 pdf_url = urljoin(page_url_for_check, href)
                                 anchor_text = link.get_text(strip=True)
                                 if not anchor_text:
                                     # Use filename as fallback anchor text
                                     try:
                                         anchor_text = pdf_url.split('/')[-1]
                                     except Exception:
                                         anchor_text = "Unnamed PDF"
                                 
                                 pdf_info = {
                                     "pdf_url": pdf_url,
                                     "anchor_text": anchor_text,
                                     "source_page_url": page_url_for_check,
                                     "source_page_title": page_data.get("title", "")
                                 }
                                 detected_pdfs_in_loop.append(pdf_info)
                     except Exception as pdf_err:
                          logger.warning(f"Error detecting PDF links on {page_url_for_check}: {pdf_err}")
                # --- End PDF Link Detection ---
                
                # --- PDF Detection --- 
                logger.debug(f"Checking links found on page: {page_url_from_data}") # Uses key from iterator
                page_found_links = page_data.get('found_links', []) # CORRECT KEY: found_links
                logger.debug(f"Found links data using .get('found_links'): {page_found_links}")
 
                for link in page_found_links:
                    href = link.get('href', '')
                    text = link.get('text', '')
                    href_lower = href.lower()
                    # Aggressively remove all whitespace before checking
                    cleaned_href = re.sub(r'\s+', '', href_lower)
                    last_chars = cleaned_href[-4:] if len(cleaned_href) >= 4 else ""
                    is_pdf = cleaned_href.endswith('.pdf')
                    if is_pdf:
                        pdf_info = {
                            'url': href, # Store original href
                            'text': text,
                            'source_page': page_url_from_data
                        }
                        detected_pdfs_in_loop.append(pdf_info)
                # --- End PDF Detection ---
                
            # Assign the collected PDFs after the loop
            result["detected_pdf_urls"] = detected_pdfs_in_loop

            if successful_pages_count > 0:
                result["metadata"]["crawl_status"] = "completed"
            else:
                # If crawler ran but we didn't successfully process text from any page
                result["metadata"]["crawl_status"] = "processed_no_content"

            # Simple deduplication of products based on name (can be enhanced)
            seen_products = set()
            unique_products = []
            for product in all_products:
                prod_name = product.get('name', '').strip().lower()
                if prod_name and prod_name not in seen_products:
                    unique_products.append(product)
                    seen_products.add(prod_name)
            result["aggregated_products"] = unique_products

            # --- Task 1: Add aggregated contacts to metadata --- 
            result["metadata"]["contact_info"] = {k: list(v) for k, v in aggregated_contacts.items()}
            # --- End Task 1 --- 

            # --- Task 2: Calculate Confidence Score --- 
            # Base confidence on successful pages vs. max target
            if max_pages > 0:
                 result["metadata"]["confidence_score"] = round(successful_pages_count / max_pages, 2)
            else: # Avoid division by zero if max_pages is 0 or less
                 result["metadata"]["confidence_score"] = 1.0 if successful_pages_count > 0 else 0.0
            # --- End Task 2 --- 

            logger.info(f"Detected {len(detected_pdfs_in_loop)} PDF links during crawl.")

            logger.info(f"Crawl successful for {url} after attempt {attempt + 1}. Found {len(unique_products)} unique products across {successful_pages_count} successful pages.")
            return result # Success 

        except Exception as e:
            logger.error(f"Crawl attempt {attempt + 1} failed for {url}: {e}", exc_info=True)
            result["metadata"]["error"] = f"Attempt {attempt + 1}: {type(e).__name__}: {e}"
            result["metadata"]["crawl_status"] = "failed"
            if attempt == retry_count:
                logger.error(f"Final crawl attempt failed for {url}. Returning error structure.")
                # --- Task 2: Return specific error structure on final failure --- 
                return {
                    "metadata": {
                        "start_url": result["metadata"]["start_url"], # Use original start URL
                        "max_pages_limit": max_pages,
                        "crawl_status": "failed",
                        "error": result["metadata"]["error"], # Keep last error
                        "confidence_score": 0.0,
                        "contact_info": { # Ensure empty contacts on failure
                            "emails": [],
                            "phones": [],
                            "addresses": [],
                            "social_links": []
                        },
                    },
                    "pages": [] # Ensure pages is empty on full failure 
                 }
                # --- End Task 2 --- 

        # Wait before retrying
        if attempt < retry_count:
            wait_time = 2 ** attempt # Exponential backoff
            logger.info(f"Waiting {wait_time} seconds before retry {attempt + 2}...")
            await asyncio.sleep(wait_time)

    # Fallback return (should theoretically not be reached if retry logic is correct)
    logger.error(f"Crawl process completed loop unexpectedly for {url}. Returning last state.")
    result["metadata"]["crawl_status"] = "failed"
    result["metadata"]["error"] = result["metadata"].get("error", "Unknown error after retries")
    result["pages"] = [] # Ensure pages is empty
    result["aggregated_products"] = [] # Ensure products is empty
    result["metadata"]["contact_info"] = { "emails": [], "phones": [], "addresses": [], "social_links": [] } # Ensure contacts are empty
    result["metadata"]["confidence_score"] = 0.0
    return result


def extract_contact_info(page_content: str, url: str, is_contact_page: bool = False) -> Dict[str, Any]:
    """
    Extracts contact information (emails, phones, addresses, social links)
    from HTML content, prioritizing specific tags and Schema.org data.
    """
    soup = BeautifulSoup(page_content, 'html.parser')
    contacts: Dict[str, Set[str]] = {
        "emails": set(),
        "phones": set(),
        "addresses": set(),
        "social_links": set(),
    }
    all_text = ""

    # 1. Prioritize Schema.org (ld+json) - Placeholder for now
    # try:
    #     schema_tags = soup.find_all('script', type='application/ld+json')
    #     for tag in schema_tags:
    #         # Add Schema.org parsing logic here
    #         pass 
    # except Exception as e:
    #     logger.error(f"Error processing schema tags on {url}: {e}")

    # 2. Prioritize specific HTML sections
    relevant_text_sections = []
    for selector in CONTACT_SELECTORS:
        elements = soup.select(selector)
        for element in elements:
            hidden = False
            curr = element
            while curr and curr.name != 'body': # Check ancestors up to body
                style = curr.attrs.get('style', '').lower()
                classes = curr.attrs.get('class', [])
                if 'display: none' in style or 'visibility: hidden' in style or \
                   any(cls in ['hidden', 'sr-only', 'visually-hidden'] for cls in classes):
                    hidden = True
                    break
                curr = curr.parent
            
            if not hidden:
                 relevant_text_sections.append(element.get_text(separator=' ', strip=True))

    prioritized_text = " ".join(relevant_text_sections) if relevant_text_sections else ""

    # 3. Extract from prioritized text first, then from all text if needed
    search_texts = [prioritized_text]
    if not prioritized_text or is_contact_page: # Always search full page if contact page
         all_text = soup.get_text(separator=' ', strip=True)
         search_texts.append(all_text)

    for text in search_texts:
        if not text: continue

        contacts["emails"].update(email.strip() for email in re.findall(EMAIL_REGEX, text))
        contacts["phones"].update(phone.strip() for phone in re.findall(PHONE_REGEX, text))
        contacts["social_links"].update(link.strip() for link in re.findall(SOCIAL_MEDIA_REGEX, text))
        contacts["addresses"].update(addr.strip() for addr in re.findall(STREET_REGEX, text)) # Basic street address for now
        # TODO: Add ZIP, City, Country extraction and combine into structured addresses

    # Convert sets back to lists for JSON serialization
    return {k: list(v) for k, v in contacts.items()}


async def crawl_url_for_assessment(url: str, max_pages: int = 20) -> Dict[str, Any]:
    """
    Main entry point: Crawl a URL and prepare the content for an assessment.
    This might just call crawl_and_prepare_content directly now.
    """
    logger.info(f"Triggering crawl_and_prepare_content for assessment of {url}")
    # Ensure any specific assessment logic (e.g., saving state) happens here
    structured_content = await crawl_and_prepare_content(url, max_pages=max_pages)
    # Potentially add assessment-specific metadata before returning
    return structured_content


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python crawler_integration.py <url> [max_pages]")
        sys.exit(1)
        
    url = sys.argv[1]
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    
    async def main():
        result = await crawl_url_for_assessment(url, max_pages)
        print("=== RAW CONTENT STRUCTURE ===")
        print(json.dumps(result, indent=2)[:1000] + "... (truncated)")
        
    asyncio.run(main())
