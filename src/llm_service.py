import time
import json
import logging
from typing import List, Optional, Any
from tenacity import retry, stop_after_attempt, wait_fixed
from src.prompts.manager import PromptManager
from src.models.product import Product, validate_product_set, HttpUrl
from src.config import LLM_CONFIG
from src.clients.openai_client import OpenAIClient

logger = logging.getLogger(__name__)

class LLMCache:
    def __init__(self, ttl_seconds=3600):
        self.cache = {}
        self.ttl = ttl_seconds

    def get(self, key):
        entry = self.cache.get(key)
        if entry:
            value, timestamp = entry
            if time.time() - timestamp < self.ttl:
                logger.debug(f"Cache hit for key: {key}")
                return value
            else:
                logger.debug(f"Cache expired for key: {key}")
                del self.cache[key] # Remove expired entry
        logger.debug(f"Cache miss for key: {key}")
        return None

    def set(self, key, value):
        logger.debug(f"Caching result for key: {key}")
        self.cache[key] = (value, time.time())

cache = LLMCache() # Simple in-memory cache for now

class LLMService:
    # Placeholder for LLM client (e.g., OpenAI, Anthropic)
    # This will be properly initialized later
    def __init__(self, client: Optional[Any] = None):
        """Initializes the LLMService.

        Args:
            client: An optional LLM client instance. If None, OpenAIClient is used.
        """
        # Use provided client or default to OpenAIClient
        self.client = client if client is not None else OpenAIClient()
        # Remove version argument as PromptManager no longer accepts it
        self.prompt_manager = PromptManager()
        self.config = LLM_CONFIG # Store the loaded config
        logger.info("LLMService initialized.")

    @retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
    def extract_products(self, page_html: str, url: str) -> List[Product]:
        """Extracts products from page text using the configured LLM and prompt."""

        # Generate cache key (use hash of first 1k chars + URL for efficiency)
        cache_key = hash((page_html[:1000], url))
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result

        # Build the prompt using PromptManager
        prompt = self.prompt_manager.build_prompt(
            prompt_id="product_extraction_v1", 
            page_content=page_html, 
            website_url=url
        )

        logger.info(f"Sending request to LLM for URL: {url}")
        # Use the injected client (real or mock) to get the response
        try:
            # Pass the centrally loaded config to the client's chat method
            response = self.client.chat(prompt=prompt, config=self.config)
            # Assuming the response object has a .json() method returning the data
            llm_output_content = response.json()
        except AttributeError:
            # Handle cases where the client might be None or doesn't have .chat()
            logger.error("LLM client is not configured or does not have a 'chat' method.", exc_info=True)
            llm_output_content = [] # Default to empty list on client error
        except Exception as e:
            logger.error(f"An unexpected error occurred in OpenAIClient.chat: {e}", exc_info=True)
            raise # Re-raise the exception after logging

        # Check if the response is a string that needs parsing, or already parsed JSON
        if isinstance(llm_output_content, str):
            logger.debug(f"Raw LLM Output (string): {llm_output_content[:500]}...")
            try:
                parsed_content = json.loads(llm_output_content)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to decode JSON string from LLM response for URL {url}: {e}", exc_info=True)
                parsed_content = [] # Fallback to empty list
        elif isinstance(llm_output_content, (list, dict)): # Accept list or dict if already parsed
            logger.debug(f"Raw LLM Output (pre-parsed {type(llm_output_content).__name__}): {str(llm_output_content)[:500]}...")
            parsed_content = llm_output_content
        else:
            logger.error(f"Unexpected LLM output type {type(llm_output_content).__name__} for URL {url}. Expected str, list, or dict.")
            parsed_content = []

        # Parse and validate the LLM response
        validated_products_list = []
        try:
            # Ensure we have a list before proceeding
            if not isinstance(parsed_content, list):
                raise ValueError(f"LLM response, after parsing, is not a JSON list as expected by the schema (got {type(parsed_content).__name__}).")
            
            # Validate the list of dictionaries using the Product model and business rules
            validated_products_list, validation_warnings = validate_product_set(parsed_content)
        
            # Log warnings if any
            if validation_warnings:
                logger.warning(f"Validation warnings/errors for {url}: {'; '.join(validation_warnings)}")
                
            # Set the source_url for each validated product
            for product in validated_products_list:
                product.source_url = url
                
        except ValueError as e:
            logger.error(f"Validation error processing LLM response for URL {url}: {e}")
            validated_products_list = [] # Ensure it's defined on error
        except Exception as e:
            logger.error(f"Unexpected error processing LLM response for URL {url}: {e}", exc_info=True)
            validated_products_list = [] # Ensure it's defined on error
            # Return empty list on other errors
        
        # Cache the validated result (even if empty or partial)
        cache.set(cache_key, validated_products_list)
        return validated_products_list

# Example usage (assuming a Product model exists):
# if __name__ == "__main__":
#     logging.basicConfig(level=logging.INFO)
#     # Requires a mock or real LLM client
#     llm_service = LLMService(client=None) # Replace None with actual client
#     sample_html = "<html><body>Check out our new Super Widget! It's amazing.</body></html>"
#     sample_url = "https://example.com/products"
#     extracted_products = llm_service.extract_products(sample_html, sample_url)
#     print(f"Extracted: {extracted_products}")
