# src/mcps/website_analysis.py

import json
import logging
import os
from typing import Dict, Any, Optional, List
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from datetime import datetime, timezone
from dotenv import load_dotenv 
from uuid import uuid4 # Added for generating IDs

from src.modules.base import BaseModule, ModuleOutput
from src.llm_interpreter.llm_client import call_llm 
from src.llm_interpreter.taxo_engine import classify_products 
# Import crawler function if Module triggers it directly (otherwise remove)
# from src.scrapers.crawler_integration import crawl_and_prepare_content

logger = logging.getLogger(__name__)

class WebsiteAnalysisModule(BaseModule):
    NAME = "website_analysis"
    VERSION = "1.1.0" 

    async def build_payload(self, assessment_data: Dict[str, Any], products: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Prepares payload, primarily ensuring necessary data like url and raw_content exist."""
        print("DEBUG: Entering build_payload...", flush=True) # Cascade ADD
        payload = {
            "assessment_id": assessment_data.get("id"),
            "raw_content": assessment_data.get("raw_content")
        }
        print("DEBUG: Exiting build_payload.", flush=True) # Cascade ADD
        return payload

    async def run(self, payload: Dict[str, Any]) -> ModuleOutput:
        """Analyzes website content, cleans it, and uses an LLM."""
        print("DEBUG: Entering WebsiteAnalysisModule.run...", flush=True) # Cascade ADD
        load_dotenv()

        assessment_id = payload.get("assessment_id")
        raw_content_html = payload.get("raw_content") # Rename to indicate it's HTML

        # --- Log incoming content length --- 
        received_content_length = len(raw_content_html) if raw_content_html else 0
        logger.info(f"[{self.NAME}] Received raw_content_html for assessment {assessment_id}. Length: {received_content_length}")
        print(f"DEBUG: Received raw_content_html for assessment {assessment_id}. Length: {received_content_length}", flush=True) # Cascade ADD
        # --- End logging ---

        logger.debug(f"[{self.NAME}] Received payload keys: {list(payload.keys())}")

        if not assessment_id:
            logger.error(f"[{self.NAME}] Missing assessment_id in payload.")
            print("DEBUG: Missing assessment_id in payload.", flush=True) # Cascade ADD
            return self._generate_error_output("Missing assessment_id")

        if not raw_content_html:
            logger.warning(f"[{self.NAME}] No raw_content provided for assessment {assessment_id}. Skipping analysis.")
            print(f"DEBUG: No raw_content provided for assessment {assessment_id}. Skipping analysis.", flush=True) # Cascade ADD
            return {
                "_module_output": { # Keep the nested structure for consistency
                    "status": "skipped",
                    "message": "No raw_content available",
                    "confidence": 0.0,
                    "results": {},
                    "debug_info": {}
                },
                "_db_patch": None
            }

        logger.info(f"[{self.NAME}] Starting analysis for assessment {assessment_id}. Original raw content length: {len(raw_content_html)}")
        print(f"DEBUG: Starting analysis for assessment {assessment_id}. Original raw content length: {len(raw_content_html)}", flush=True) # Cascade ADD

        # --- Start of Cleaning Logic ---
        # Assume crawler provides reasonably cleaned content.
        # Use raw_content_html directly for prompt generation.
        cleaned_content = raw_content_html
        if not cleaned_content or not cleaned_content.strip():
            logger.warning(f"[{self.NAME}] Provided raw_content_html is empty or whitespace for assessment {assessment_id}. Skipping LLM analysis.")
            print(f"DEBUG: Provided raw_content_html is empty or whitespace for assessment {assessment_id}. Skipping LLM analysis.", flush=True) # Cascade ADD
            return self._generate_error_output(
                "Provided raw_content is empty",
                debug_info={"original_content_length": len(raw_content_html) if raw_content_html else 0}
            )
        logger.info(f"[{self.NAME}] Using provided raw_content_html (length: {len(cleaned_content)}) directly for LLM prompt.")
        print(f"DEBUG: Using provided raw_content_html (length: {len(cleaned_content)}) directly for LLM prompt.", flush=True) # Cascade ADD
        # --- End of Cleaning Logic ---

        # --- Log the cleaned content for inspection ---
        logger.info(f"[{self.NAME}] Cleaned content preview (first 1000 chars) for assessment {assessment_id}:\n{cleaned_content[:1000]}")
        print(f"DEBUG: Cleaned content preview (first 1000 chars) for assessment {assessment_id}:\n{cleaned_content[:1000]}", flush=True) # Cascade ADD
        # --- End Logging ---

        output_results = {
            "module_name": self.NAME,
            "module_version": self.VERSION,
            "status": "pending",
            "message": "",
            "confidence": 0.0,
            "results": {},
            "debug_info": {}
        }

        try:
            # Generate the prompt using the CLEANED content
            prompt = WebsiteAnalysisModule.get_website_analysis_prompt(cleaned_content)
            output_results["debug_info"]["llm_input_prompt"] = prompt # Store prompt
            print(f"DEBUG: Generated LLM prompt (first 500 chars):\n{prompt[:500]}...", flush=True) # Cascade MOD

            # Call the LLM
            logger.info(f"[{self.NAME}] Calling LLM for assessment {assessment_id}.")
            print(f"DEBUG: Calling LLM for assessment {assessment_id}.", flush=True) # Cascade ADD
            llm_response_raw = await call_llm(prompt)
            output_results["debug_info"]["llm_raw_output"] = llm_response_raw # Store raw response
            logger.debug(f"[{self.NAME}] LLM raw response snippet for {assessment_id}: {llm_response_raw[:200]}...")
            print(f"DEBUG: LLM raw response snippet for {assessment_id}: {llm_response_raw[:200]}...", flush=True) # Cascade ADD

            # Parse the LLM response
            llm_analysis_data = self._parse_llm_response(llm_response_raw)
            output_results["debug_info"]["parsed_llm_output"] = llm_analysis_data # Store parsed output (or None)

            if llm_analysis_data is None:
                # Parsing failed, error logged in _parse_llm_response
                output_results["status"] = "error"
                output_results["message"] = "Failed to parse LLM response"
                output_results["confidence"] = 0.1 # Low confidence
                # No db_patch if parsing failed
                return {"_module_output": output_results, "_db_patch": None}
            
            # LLM call and parsing succeeded
            output_results["status"] = "success"
            output_results["message"] = "Analysis completed successfully."
            output_results["results"] = llm_analysis_data
            # TODO: Implement better confidence scoring based on parsed data
            output_results["confidence"] = 0.75 # Placeholder confidence for success
            logger.info(f"[{self.NAME}] Successfully processed Assessment ID: {assessment_id} with confidence {output_results['confidence']:.2f}")
            print(f"DEBUG: Successfully processed Assessment ID: {assessment_id} with confidence {output_results['confidence']:.2f}", flush=True) # Cascade ADD

            # Prepare the database patch
            db_patch = self._prepare_db_patch(assessment_id, llm_analysis_data)
            logger.debug(f"[{self.NAME}] Generated DB Patch for {assessment_id}: {db_patch}") # Log the patch
            print(f"DEBUG: Generated DB Patch for {assessment_id}: {db_patch}", flush=True) # Cascade ADD

            return {
                "_module_output": output_results,
                "_db_patch": db_patch
            }

        except Exception as e:
            logger.error(f"[{self.NAME}] Error during analysis for assessment {assessment_id}: {e}", exc_info=True)
            print(f"DEBUG: Error during analysis for assessment {assessment_id}: {e}", flush=True) # Cascade ADD
            output_results["status"] = "error"
            output_results["message"] = f"Analysis failed: {e}"
            output_results["confidence"] = 0.0
            output_results["debug_info"]["exception"] = str(e) # Add exception to debug info
            # Ensure we always return the standard structure, even on error
            return {
                "_module_output": output_results,
                "_db_patch": None # No patch if analysis failed
            }

    def _generate_llm_prompt_from_content(self, raw_content: str) -> str:
        print("DEBUG: Entering _generate_llm_prompt_from_content...", flush=True) # Cascade ADD
        # Basic cleaning
        try:
            print("DEBUG: Starting BeautifulSoup cleaning...", flush=True) # Cascade ADD
            soup = BeautifulSoup(raw_content, 'html.parser')
            cleaned_text = soup.get_text(separator='\n', strip=True)
            print("DEBUG: Finished BeautifulSoup cleaning.", flush=True) # Cascade ADD
        except Exception as bs_error:
            print(f"DEBUG: Error during BeautifulSoup cleaning: {bs_error}", flush=True) # Cascade ADD
            # Decide if we want to raise or return an empty string/handle error
            cleaned_text = "" # Example: return empty string on error
        
        # Limit length if necessary (adjust limit as needed)
        max_length = 20000  # Example limit
        if len(cleaned_text) > max_length:
            cleaned_text = cleaned_text[:max_length]
            print(f"DEBUG: Truncated cleaned_text to {max_length} chars.", flush=True) # Cascade MOD
        
        prompt = f"""Analyze the following website content and extract the information in JSON format according to the schema provided below.

        Website Content:
        ```
        {cleaned_text}
        ```

        JSON Schema:
        {{
          "summary": "string | Brief summary of the company and its primary business.",
          "products": [
            {{
              "name": "string | Product name.",
              "category": "string | Broad product category (e.g., Frozen Foods, Snacks, Beverages).",
              "description": "string | Brief description of the product.",
              "variants": [
                {{
                  "sku": "string | Stock Keeping Unit, if available.",
                  "size": "string | e.g., '1kg', '500ml', 'Pack of 6'.",
                  "price": "float | Price if available, otherwise null."
                }}
              ],
              "estimated_hs_code": "string | Estimated Harmonized System code if possible, otherwise null."
            }}
          ],
          "certifications": [
            {{
              "name": "string | Name of the certification (e.g., HACCP, ISO 9001, Halal).",
              "description": "string | Brief description or scope.",
              "issuing_body": "string | Issuing organization, if mentioned.",
              "required_for": "list[string] | Optional: List of countries/regions where it's required/mentioned."
            }}
          ],
          "contacts": {{
            "email": "string | Primary contact email.",
            "phone": "string | Primary contact phone number.",
            "address": "string | Physical address."
          }},
          "social_links": {{
            "facebook": "string | URL",
            "instagram": "string | URL",
            "linkedin": "string | URL",
            "twitter": "string | URL",
            "youtube": "string | URL"
          }}
        }}

        Response JSON:
        """
        print(f"DEBUG: Generated LLM prompt (first 500 chars):\n{prompt[:500]}...", flush=True) # Cascade MOD
        print("DEBUG: Exiting _generate_llm_prompt_from_content.", flush=True) # Cascade ADD
        return prompt

    def _parse_llm_response(self, response_text: Optional[str]) -> Optional[Dict[str, Any]]:
        print("DEBUG: Entering _parse_llm_response...", flush=True) # Cascade ADD
        if not response_text:
             print("DEBUG: LLM response text is empty or None.", flush=True) # Cascade ADD
             self._module_output.debug_info["error"] = "LLM returned empty response."
             return None
             
        print(f"DEBUG: Raw LLM response (first 500 chars):\n{response_text[:500]}...", flush=True) # Cascade MOD
        try:
            # Clean the response: remove potential markdown code fences
            print("DEBUG: Cleaning LLM response...", flush=True) # Cascade ADD
            if response_text.startswith("```json\n"):
                response_text = response_text[len("```json\n"):]
            if response_text.endswith("\n```"):
                response_text = response_text[:-len("\n```")]
             # Handle ``` at start/end
            if response_text.startswith("```") and response_text.endswith("```"):
                response_text = response_text[3:-3]

            parsed_data = json.loads(response_text.strip())
            print("DEBUG: Successfully parsed LLM response.", flush=True) # Cascade MOD
            print("DEBUG: Exiting _parse_llm_response (success).", flush=True) # Cascade ADD
            return parsed_data
        except json.JSONDecodeError as e:
            error_msg = f"Failed to parse LLM response JSON: {e}"
            logging.error(error_msg)
            print(f"DEBUG: {error_msg}", flush=True) # Cascade MOD
            self._module_output.debug_info["error"] = error_msg
            self._module_output.debug_info["raw_llm_response"] = response_text # Store raw response on error
            print("DEBUG: Exiting _parse_llm_response (JSON error).", flush=True) # Cascade ADD
            return None 
        except Exception as e:
            error_msg = f"An unexpected error occurred during LLM response parsing: {e}"
            logging.error(error_msg)
            print(f"DEBUG: {error_msg}", flush=True) # Cascade MOD
            self._module_output.debug_info["error"] = error_msg
            self._module_output.debug_info["raw_llm_response"] = response_text # Store raw response on error
            print("DEBUG: Exiting _parse_llm_response (unexpected error).", flush=True) # Cascade ADD
            return None

    def _prepare_db_patch(self, assessment_id: str, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        print("DEBUG: Entering _prepare_db_patch...", flush=True) # Cascade ADD
        if not parsed_data:
            print("DEBUG: No parsed data provided to _prepare_db_patch.", flush=True) # Cascade MOD
            print("DEBUG: Exiting _prepare_db_patch (no data).", flush=True) # Cascade ADD
            return {}

        db_patch = {}
        # Prepare assessment update
        print("DEBUG: Preparing Assessment update patch...", flush=True) # Cascade ADD
        assessment_update = {
            "summary": parsed_data.get("summary"),
            # "confidence_score": parsed_data.get("confidence_score"), # Needs specific handling if required
            "contacts": parsed_data.get("contacts"),
            "social_links": parsed_data.get("social_links"),
            "llm_processed_at": datetime.now(timezone.utc).isoformat(),
            "status": "llm_processed",
            "llm_ready": False,
            "fallback_reason": None
        }
        # Filter out None values to avoid overwriting existing data with nulls unintentionally
        db_patch["Assessments"] = {k: v for k, v in assessment_update.items() if v is not None}

        # Prepare product upserts
        print("DEBUG: Preparing Product upsert patch...", flush=True) # Cascade ADD
        products_data = parsed_data.get("products", [])
        products_patch = []
        variants_patch = []
        if isinstance(products_data, list):
            for product in products_data:
                if isinstance(product, dict) and product.get("name"):
                    product_id = str(uuid4())
                    products_patch.append({
                        "id": product_id,
                        "assessment_id": assessment_id,
                        "name": product.get("name"),
                        "category": product.get("category"),
                        "description": product.get("description"),
                        "estimated_hs_code": product.get("estimated_hs_code"),
                        # Add other fields as needed, ensure they match DB schema
                    })
                    # Prepare variants
                    product_variants = product.get("variants", [])
                    if isinstance(product_variants, list):
                        for variant in product_variants:
                             if isinstance(variant, dict):
                                variants_patch.append({
                                    "id": str(uuid4()),
                                    "product_id": product_id,
                                    "assessment_id": assessment_id, # Include for potential direct query
                                    "sku": variant.get("sku"),
                                    "size": variant.get("size"),
                                    "price": variant.get("price")
                                })
        db_patch["Products"] = products_patch
        db_patch["ProductVariants"] = variants_patch

        # Prepare certification upserts
        print("DEBUG: Preparing Certification upsert patch...", flush=True) # Cascade ADD
        certifications_data = parsed_data.get("certifications", [])
        certs_patch = []
        if isinstance(certifications_data, list):
            for cert in certifications_data:
                if isinstance(cert, dict) and cert.get("name"):
                    certs_patch.append({
                        "id": str(uuid4()),
                        "assessment_id": assessment_id,
                        "name": cert.get("name"),
                        "description": cert.get("description"),
                        "issuing_body": cert.get("issuing_body"),
                        "required_for": cert.get("required_for") # Assumes this is a list[str] already
                    })
        db_patch["Certifications"] = certs_patch
        
        print(f"DEBUG: Prepared DB patch: {json.dumps(db_patch, indent=2)[:500]}...", flush=True) # Cascade MOD
        print("DEBUG: Exiting _prepare_db_patch (success).", flush=True) # Cascade ADD
        return db_patch

    def _generate_error_output(self, error_message: str, debug_info: Optional[Dict] = None) -> ModuleOutput:
        print("DEBUG: Entering _generate_error_output...", flush=True) # Cascade ADD
        return {
            "_module_output": {
                "module_name": self.NAME,
                "module_version": self.VERSION,
                "status": "error",
                "message": error_message,
                "confidence": 0.0,
                "results": {},
                "debug_info": debug_info or {} 
            },
            "_db_patch": None
        }
        print("DEBUG: Exiting _generate_error_output.", flush=True) # Cascade ADD

    @staticmethod
    def get_website_analysis_prompt(website_content: str) -> str:
        print("DEBUG: Entering get_website_analysis_prompt...", flush=True) # Cascade ADD
        return f"""Analyze the following website content extracted from a company's website. Your goal is to identify key business information, including products/services offered, industry/sector, certifications, and contact details. Structure your response as a JSON object containing the following keys: 'summary', 'products', 'certifications', 'contacts', 'social_links'.

        Instructions:
        1.  **summary**: Provide a concise overview of the company's main business activities (1-2 sentences).
        2.  **products**: List the main products or services. For each, provide 'name' (required), 'category' (optional), and 'estimated_hs_code' (optional, if easily identifiable).
            - Example: `{{"name": "Frozen Beef Patties", "category": "Meat Products", "estimated_hs_code": "0202.30"}}`
        3.  **certifications**: List any quality standards, regulatory compliance, or industry certifications mentioned (e.g., ISO 9001, Halal, FDA Approved). For each, provide 'name' (required) and 'required_for' (optional list of countries/regions if specified).
            - Example: `{{"name": "HACCP", "required_for": ["EU"]}}`
        4.  **contacts**: Extract primary contact details: 'email', 'phone', 'address'.
        5.  **social_links**: Extract links to social media profiles like 'facebook', 'linkedin', 'instagram', etc.

        Website Content:
        ```
        {website_content}
        ```

        Respond ONLY with the JSON object.
        """
        print("DEBUG: Exiting get_website_analysis_prompt.", flush=True) # Cascade ADD