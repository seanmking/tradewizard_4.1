# src/mcps/website_analysis.py

import json
import logging
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
import pytz

# Import base classes and types
from .base import BaseMCP, MCPOutput, MCPProduct, MCPCertification, MCPContact, StandardizedMCPData
from utils.logging_config import setup_logging # Changed to absolute import

# Setup logging
setup_logging()

# --- LLM & Environment ---
from dotenv import load_dotenv
import openai # Keep for types if needed, but import client explicitly
from openai import OpenAI # Import the client class
from openai import OpenAIError, RateLimitError, APITimeoutError, APIConnectionError, APIStatusError
from openai.types.chat import ChatCompletion # For type hinting
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, retry_if_exception, retry_any
import httpx # Import httpx

logger = logging.getLogger(__name__)

# --- Retry Configuration ---
# Retry on specific transient OpenAI errors.
# Wait exponentially starting at 1 second, maxing out at 10 seconds, for up to 3 attempts.
RETRYABLE_ERRORS = (RateLimitError, APITimeoutError, APIConnectionError, APIStatusError) # Define retryable errors
# Check if status code is 5xx for APIStatusError
def is_retryable_status(exception: BaseException) -> bool:
    return isinstance(exception, APIStatusError) and exception.status_code >= 500

retry_config = retry(
    wait=wait_exponential(multiplier=1, min=1, max=10),
    stop=stop_after_attempt(3),
    # Use retry_any to combine type check and function predicate
    retry=retry_any(
        retry_if_exception_type(RETRYABLE_ERRORS),
        retry_if_exception(is_retryable_status)
    ),
    reraise=True # Reraise the exception if all retries fail
)

class WebsiteAnalysisMCP(BaseMCP):
    """
    MCP responsible for analyzing raw scraped website data using an LLM
    (e.g., OpenAI) to extract and structure key business information according
    to the StandardizedMCPData format.
    """
    name = "website_analysis"
    version = "1.0.1" # Incremented version for LLM integration

    def build_payload(self, classification: Dict[str, Any], products: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Builds the payload by parsing the raw scraped content from the classification record.

        Args:
            classification: The assessment record, expected to have 'raw_content'.
            products: Associated product records (likely not used directly by this MCP).

        Returns:
            A dictionary containing the parsed scraper data or an error indication.
        """
        raw_content_str = classification.get("raw_content")
        payload = {"scraper_data": None, "error": None}

        if not raw_content_str:
            payload["error"] = "Assessment record is missing 'raw_content'."
            logger.warning(f"Assessment {classification.get('id')} missing raw_content for {self.name}.")
            return payload

        try:
            # raw_content should contain the JSON string output from scraper.ts
            scraper_data = json.loads(raw_content_str)
            payload["scraper_data"] = scraper_data
            logger.info(f"Successfully parsed scraper_data for assessment {classification.get('id')}.")
        except json.JSONDecodeError as e:
            payload["error"] = f"Failed to parse raw_content JSON: {e}"
            logger.error(f"JSON parsing error for assessment {classification.get('id')}: {e}", exc_info=True)
        except Exception as e:
            payload["error"] = f"Unexpected error parsing raw_content: {e}"
            logger.error(f"Unexpected error parsing raw_content for assessment {classification.get('id')}: {e}", exc_info=True)

        return payload

    def _construct_system_prompt(self) -> str:
        """Constructs the system prompt for the LLM call."""
        # Define the desired output structure within the prompt
        # This helps guide the LLM to return JSON in the correct format.
        # We reference the fields defined in StandardizedMCPData.
        return f"""
You are an expert business analyst specializing in international trade readiness.
Your task is to analyze the provided website scrape data (metadata, main content, extracted products, contacts)
and return a structured JSON object summarizing the company and its offerings.

The JSON output MUST conform strictly to the following structure:
{{
  \"summary\": \"string | null // A brief overview of the company and its primary business based on the scraped content.\",
  \"products\": [ // List of products identified or inferred. Focus on physical goods if distinguishable.
    {{
      \"name\": \"string | null // Product name\",
      \"description\": \"string | null // Product description\",
      \"category\": \"string | null // Suggested product category (e.g., 'Apparel', 'Electronics', 'Food & Beverage')\",
      \"estimated_hs_code\": \"string | null // If possible, suggest a plausible 4-6 digit HS code prefix based on name/category. Leave null if unsure.\",
      \"source_url\": \"string | null // URL where the product was found (from scraper_data)\",
      \"image_url\": \"string | null // Image URL (from scraper_data)\"
    }}
  ],
  \"certifications\": [ // List any certifications mentioned (e.g., ISO, HACCP, Organic).
    {{
      \"name\": \"string | null // Name of the certification mentioned\",
      \"required_for\": [\"string\"] | null // If context suggests scope (e.g., 'EU market', 'organic products'), list here. Use [\"*\"] if general. Leave null if scope is unclear.
    }}
  ],
  \"contacts\": {{ // Contact details found.
    \"emails\": [\"string\"] | null,
    \"phones\": [\"string\"] | null,
    \"social_links\": [ {{ \"platform\": \"string\", \"url\": \"string\" }} ] | null // Mirror the input social links.
  }} | null,
  \"confidence_score\": \"float // Your confidence (0.0 to 1.0) in the accuracy and completeness of this analysis.\",
  \"fallback_reason\": \"string | null // If confidence is low (< 0.6), briefly explain why (e.g., 'Limited content', 'Ambiguous product descriptions').\",
  \"next_best_action\": \"string | null // Suggest the most logical next step for a human reviewing this analysis (e.g., 'Verify product categories', 'Manually search for certifications', 'Confirm contact details').\"
}}

Analyze the provided text and structure your findings into this JSON format.
Prioritize information clearly stated on the website. Infer categories or HS codes cautiously.
If crucial information (like product details) is missing or very ambiguous, reflect this in the confidence score and fallback reason.
Return ONLY the JSON object, without any introductory text or explanations outside the JSON structure itself.
"""

    def _construct_user_prompt(self, scraper_data: Dict[str, Any]) -> str:
        """Constructs the user prompt containing the scraped data."""
        # Select relevant parts of scraper_data to minimize token usage
        prompt_parts = []
        metadata = scraper_data.get('metadata', {}) # Get the metadata dict safely
        prompt_parts.append("### Website Metadata ###")
        prompt_parts.append(f"Title: {scraper_data.get('title', 'N/A')}")
        # Corrected: Access description from the nested metadata dictionary
        prompt_parts.append(f"Description: {metadata.get('description', 'N/A')}")
        # Corrected: Access keywords from the nested metadata dictionary
        prompt_parts.append(f"Keywords: {metadata.get('keywords', 'N/A')}")

        prompt_parts.append("\\n### Main Website Content (Excerpt) ###")
        # Truncate main content to avoid excessive tokens, focus on first ~2000 chars
        main_content = scraper_data.get('mainContent', '')
        prompt_parts.append(main_content[:2000] + ('...' if len(main_content) > 2000 else ''))

        # Added: Include general links found on the page
        prompt_parts.append("\\n### Other Links (Excerpt) ###")
        other_links = scraper_data.get('links', [])
        if other_links:
            for i, link in enumerate(other_links[:10]): # Limit to first 10 links
                link_text = link.get('text', 'N/A')
                link_href = link.get('href', 'N/A')
                prompt_parts.append(f"- Text: {link_text[:100]}..., Href: {link_href}") # Limit text length
        else:
            prompt_parts.append("No other general links found.")

        prompt_parts.append("\\n### Extracted Products (from Scraper) ###")
        extracted_products = scraper_data.get('extractedProducts', [])
        if extracted_products:
            for i, prod in enumerate(extracted_products[:10]): # Limit initial products sent
                 prompt_parts.append(f"- Product {i+1}:")
                 prompt_parts.append(f"  Name: {prod.get('name', 'N/A')}")
                 prompt_parts.append(f"  Description: {prod.get('description', 'N/A')[:200]}...") # Limit description length
                 prompt_parts.append(f"  Price: {prod.get('price', 'N/A')}")
                 prompt_parts.append(f"  URL: {prod.get('productUrl', 'N/A')}")
                 prompt_parts.append(f"  Image URL: {prod.get('imageUrl', 'N/A')}")
        else:
            prompt_parts.append("No products explicitly extracted by the scraper.")

        prompt_parts.append("\\n### Contact Information (from Scraper) ###")
        contacts = scraper_data.get('contacts', {})
        social = scraper_data.get('socialLinks', [])
        prompt_parts.append(f"Emails: {contacts.get('emails', [])}")
        prompt_parts.append(f"Phones: {contacts.get('phones', [])}")
        prompt_parts.append(f"Social Links: {json.dumps(social)}") # Send as JSON string

        prompt_parts.append("\\n### Analysis Task ###")
        prompt_parts.append("Based on ALL the information above, generate the structured JSON output as described in the system prompt.")

        return "\\n".join(prompt_parts)

    def run(self, payload: Dict[str, Any]) -> MCPOutput:
        """
        Executes the website analysis using an LLM.

        Takes the parsed scraper data from the payload, constructs prompts,
        calls the OpenAI API, parses the response, and returns the structured
        StandardizedMCPData within an MCPOutput object.

        Args:
            payload: The dictionary returned by build_payload, containing 'scraper_data'.

        Returns:
            An MCPOutput containing the StandardizedMCPData in the 'result' field,
            along with confidence, errors, and LLM interaction details.
        """
        started_at = datetime.now(pytz.utc) # Use pytz for timezone
        scraper_data = payload.get("scraper_data")
        build_error = payload.get("error")
        llm_input_prompt = None # Store prompts for logging
        llm_raw_output = None   # Store raw LLM output for logging

        if build_error or not scraper_data:
            # Add status='error' here as well
            return MCPOutput(status='error', result={}, confidence=0.0, error=build_error or "Scraper data not available.", _db_patch=None, llm_input_prompt=None, llm_raw_output=None, started_at=started_at, completed_at=datetime.now(pytz.utc)) # Use pytz

        load_dotenv()
        OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        if not OPENAI_API_KEY:
             return MCPOutput(status='error', result={}, confidence=0.0, error="OpenAI API key is not configured.", _db_patch=None, llm_input_prompt=None, llm_raw_output=None, started_at=started_at, completed_at=datetime.now(pytz.utc)) # Use pytz

        try:
            logger.info(f"Preparing LLM call for assessment using scraper data...")
            system_prompt = self._construct_system_prompt()
            user_prompt = self._construct_user_prompt(scraper_data)
            llm_input_prompt = f"SYSTEM:\\n{system_prompt}\\n\\nUSER:\\n{user_prompt}" # Combine for logging

            logger.info(f"Calling OpenAI API (model: gpt-3.5-turbo) with retry logic...")

            # Explicitly create an httpx client without proxies
            http_client = httpx.Client(
                transport=httpx.HTTPTransport(local_address="0.0.0.0"),
                # proxies=None # This might not be needed if transport is set correctly
            )
            client = OpenAI(
                api_key=OPENAI_API_KEY,
                http_client=http_client
            )
            
            # Apply the retry decorator directly to the API call via a nested function
            @retry_config
            def call_openai_api() -> ChatCompletion:
                logger.debug("Attempting OpenAI API call...")
                # Use the explicit client instance
                completion: ChatCompletion = client.chat.completions.create(
                    model="gpt-3.5-turbo", #"gpt-4-turbo-preview", # Or other suitable model
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.2, # Lower temperature for more factual, less creative output
                    max_tokens=2048, # Adjust based on expected output size
                )
                logger.debug("OpenAI API call successful.")
                return completion

            completion: ChatCompletion = call_openai_api() # Execute the decorated call

            llm_raw_output = completion.choices[0].message.content
            logger.info(f"Received response from OpenAI API.")

            if not llm_raw_output:
                 raise ValueError("LLM returned an empty response.")

            # Attempt to parse the LLM's response as JSON
            try:
                 # Find the start and end of the JSON object within the response
                 json_start = llm_raw_output.find('{')
                 json_end = llm_raw_output.rfind('}') + 1
                 if json_start == -1 or json_end == 0:
                      raise ValueError("Could not find JSON object delimiters '{}' in LLM response.")
                 json_string = llm_raw_output[json_start:json_end]
                 parsed_result = json.loads(json_string)

                 # Basic validation: Check if it looks like our target structure (has 'summary' key?)
                 if not isinstance(parsed_result, dict) or 'summary' not in parsed_result:
                      raise ValueError("LLM response is not a valid JSON object matching the expected structure.")
                 logger.info(f"Successfully parsed LLM JSON response.")
            except json.JSONDecodeError as json_err:
                 logger.error(f"Failed to parse LLM JSON response: {json_err}", exc_info=True)
                 logger.error(f"LLM Raw Output was:\\n{llm_raw_output}")
                 raise ValueError(f"LLM response was not valid JSON: {json_err}")


            # --- Map parsed result to StandardizedMCPData ---
            # Perform type checking/casting if necessary, handle potential missing keys gracefully
            standardized_result: StandardizedMCPData = {
                "summary": parsed_result.get("summary"),
                "products": parsed_result.get("products", []), # Default to empty list
                "certifications": parsed_result.get("certifications", []), # Default to empty list
                "contacts": parsed_result.get("contacts"),
                # Handle potential float conversion error
                "confidence_score": 0.0,
                "fallback_reason": parsed_result.get("fallback_reason"),
                "next_best_action": parsed_result.get("next_best_action")
            }
            try:
                confidence_val = parsed_result.get("confidence_score")
                if confidence_val is not None:
                    standardized_result["confidence_score"] = float(confidence_val)
            except (ValueError, TypeError):
                logger.warning(f"Could not convert confidence score '{confidence_val}' to float. Defaulting to 0.0.")
                standardized_result["fallback_reason"] = standardized_result.get("fallback_reason", "") + " (Could not parse confidence score from LLM)"

            # TODO: Add more robust validation/parsing for nested structures (products, certs, contacts)

            # Derive overall MCP confidence
            mcp_confidence = standardized_result.get("confidence_score", 0.0)

            # --- Optional: Evaluate confidence further if needed ---
            # Example: Check if confidence is below a threshold and update fallback reason
            confidence_threshold = 0.7 # Example threshold
            if mcp_confidence < confidence_threshold: # Use mcp_confidence
                # Use fallback reason if provided by LLM, otherwise create a generic one
                if not standardized_result.get("fallback_reason"):
                     standardized_result["fallback_reason"] = f"Confidence score ({mcp_confidence:.2f}) is below threshold ({confidence_threshold})."
                     logger.warning(f"Low confidence ({mcp_confidence:.2f}) from LLM analysis, reason: {standardized_result['fallback_reason']}")
                # Note: We are still returning status='success' but with low confidence info

            # --- Prepare the database patch (Ensure this runs before return) ---
            _db_patch = {
                key: value for key, value in standardized_result.items()
                if key in StandardizedMCPData.__annotations__ and value is not None # Filter by defined fields and non-None values
            }
            # Add/overwrite essential metadata fields for processing status
            _db_patch["llm_processed_at"] = datetime.now(pytz.utc).isoformat() # Use pytz
            _db_patch["llm_ready"] = False # Mark as processed
            _db_patch["llm_status"] = 'processed' # Update status

            logger.info("Website analysis MCP completed successfully.")

            # Return the structured data including the calculated patch
            return MCPOutput(
                status='success',
                result=standardized_result,
                confidence=mcp_confidence,
                error=None, # Explicitly None for success
                _db_patch=_db_patch, # Use the calculated patch
                llm_input_prompt=llm_input_prompt,
                llm_raw_output=llm_raw_output,
                started_at=started_at,
                completed_at=datetime.now(pytz.utc) # Use pytz
            )

        except OpenAIError as api_err:
             logger.error(f"OpenAI API error: {api_err}", exc_info=True)
             error_msg = f"OpenAI API error: {api_err}"
        except Exception as e:
            logger.error(f"Error during LLM processing: {e}", exc_info=True)
            error_msg = f"Error during LLM transformation: {e}"

        # Return error state
        return MCPOutput(
            result={},
            confidence=0.0,
            error=error_msg,
            _db_patch=None,
            llm_input_prompt=llm_input_prompt, # Log prompt even on error
            llm_raw_output=llm_raw_output, # Log raw output even on error
            started_at=started_at,
            completed_at=datetime.now(pytz.utc) # Use pytz
        )
