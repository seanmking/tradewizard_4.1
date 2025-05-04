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
        return {
            "assessment_id": assessment_data.get("id"),
            "raw_content": assessment_data.get("raw_content")
        }

    async def run(self, payload: Dict[str, Any]) -> ModuleOutput:
        """Analyzes website content, cleans it, and uses an LLM."""
        load_dotenv()

        assessment_id = payload.get("assessment_id")
        raw_content_html = payload.get("raw_content") # Rename to indicate it's HTML

        logger.debug(f"[{self.NAME}] Received payload keys: {list(payload.keys())}")

        if not assessment_id:
            logger.error(f"[{self.NAME}] Missing assessment_id in payload.")
            return self._generate_error_output("Missing assessment_id")

        if not raw_content_html:
            logger.warning(f"[{self.NAME}] No raw_content provided for assessment {assessment_id}. Skipping analysis.")
            return {
                "_module_output": {
                    "module_name": self.NAME,
                    "module_version": self.VERSION,
                    "status": "skipped",
                    "message": "No raw_content available",
                    "confidence": 0.0,
                    "results": {},
                    "debug_info": {} # Add debug_info field
                },
                "_db_patch": None
            } # Return skipped output

        logger.info(f"[{self.NAME}] Starting analysis for assessment {assessment_id}. Original raw content length: {len(raw_content_html)}")

        # --- Start of Cleaning Logic ---
        cleaned_content = ""
        try:
            soup = BeautifulSoup(raw_content_html, 'html.parser')

            # Remove script and style elements
            for script_or_style in soup(["script", "style"]):
                script_or_style.decompose() # Remove the tag from the soup

            # Get text content, stripping excess whitespace
            cleaned_content = soup.get_text(separator=' ', strip=True)
            logger.info(f"[{self.NAME}] Cleaned content length for assessment {assessment_id}: {len(cleaned_content)}")

        except Exception as e:
            logger.error(f"[{self.NAME}] Error cleaning HTML content for assessment {assessment_id}: {e}", exc_info=True)
            return self._generate_error_output(f"Failed to clean website HTML: {e}", debug_info={"original_content_length": len(raw_content_html)})

        if not cleaned_content.strip():
             logger.warning(f"[{self.NAME}] HTML cleaning resulted in empty content for assessment {assessment_id}. Skipping LLM analysis.")
             return self._generate_error_output("HTML cleaning yielded empty content", debug_info={"original_content_length": len(raw_content_html)})
        # --- End of Cleaning Logic ---

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

            # Call the LLM
            logger.info(f"[{self.NAME}] Calling LLM for assessment {assessment_id}.")
            llm_response_raw = await call_llm(prompt)
            output_results["debug_info"]["llm_raw_output"] = llm_response_raw # Store raw response
            logger.debug(f"[{self.NAME}] LLM raw response snippet for {assessment_id}: {llm_response_raw[:200]}...")

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

            # Prepare the database patch
            db_patch = self._prepare_db_patch(assessment_id, llm_analysis_data)
            logger.debug(f"[{self.NAME}] Generated DB Patch for {assessment_id}: {db_patch}") # Log the patch

            return {
                "_module_output": output_results,
                "_db_patch": db_patch
            }

        except Exception as e:
            logger.error(f"[{self.NAME}] Error during analysis for assessment {assessment_id}: {e}", exc_info=True)
            output_results["status"] = "error"
            output_results["message"] = f"Analysis failed: {e}"
            output_results["confidence"] = 0.0
            output_results["debug_info"]["original_content_length"] = len(raw_content_html)
            output_results["debug_info"]["cleaned_content_length"] = len(cleaned_content)

            db_patch = {
                "Assessments": {
                    assessment_id: {
                        "llm_status": "error",
                        "llm_error_message": str(e)[:500], # Truncate long errors
                        "llm_processed_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            }
            return {"_module_output": output_results, "_db_patch": db_patch} # Use db_patch here

    def _generate_llm_prompt_from_content(self, raw_content: str) -> str:
        """Generates the LLM prompt using the raw website content."""
        soup = BeautifulSoup(raw_content, 'html.parser')
        cleaned_text = soup.get_text(separator='\n', strip=True)

        logger.debug(f"[{self.NAME}] Cleaned text length for prompt: {len(cleaned_text)}")

        return WebsiteAnalysisModule.get_website_analysis_prompt(website_content=cleaned_text)

    def _parse_llm_response(self, llm_response: str) -> Optional[Dict]:
        """Parses the LLM's JSON response, handling potential markdown/text noise."""
        logger.debug(f"[{self.NAME}] Attempting to parse LLM response snippet: {llm_response[:200]}...")
        try:
            json_start = llm_response.find('{')
            json_end = llm_response.rfind('}') + 1

            if json_start != -1 and json_end != -1:
                json_str = llm_response[json_start:json_end]
                parsed_data = json.loads(json_str)
                logger.info(f"[{self.NAME}] Successfully parsed LLM response.")
                logger.debug(f"[{self.NAME}] Parsed data keys: {list(parsed_data.keys())}")
                return parsed_data
            else:
                logger.error(f"[{self.NAME}] No JSON object ({'{...}'}) found in LLM response.")
                return None

        except json.JSONDecodeError as e:
            logger.error(f"[{self.NAME}] Failed to parse JSON from LLM response: {e}")
            logger.error(f"[{self.NAME}] LLM response content (first 500 chars): {llm_response[:500]}")
            return None
        except Exception as e:
            logger.error(f"[{self.NAME}] An unexpected error occurred during LLM response parsing: {e}", exc_info=True)
            return None

    def _prepare_db_patch(self, assessment_id: str, llm_analysis_data: Optional[Dict]) -> Optional[Dict]:
        """Prepares the database patch based on the LLM analysis results, creating related records."""
        if not llm_analysis_data:
            logger.warning(f"[{self.NAME}] No LLM analysis data available for assessment {assessment_id}, cannot prepare DB patch.")
            return None

        patch = {
            "Assessments": { 
                assessment_id: {
                    "summary": llm_analysis_data.get("summary"), 
                    "llm_processed_at": datetime.now(timezone.utc).isoformat(),
                    "status": "llm_processed" 
                }
            },
            "Products": {}, 
            "ProductVariants": {}, 
            "Certifications": {} 
        }
        
        assessment_patch = patch["Assessments"][assessment_id]
        products_patch = patch["Products"]
        variants_patch = patch["ProductVariants"]
        certs_patch = patch["Certifications"]

        products_list = llm_analysis_data.get("products", [])
        if isinstance(products_list, list):
            for product_data in products_list:
                if not isinstance(product_data, dict) or not product_data.get("name"):
                    logger.warning(f"[{self.NAME}] Skipping invalid product data item: {product_data}")
                    continue
                
                product_id = str(uuid4())
                products_patch[product_id] = {
                    "id": product_id,
                    "assessment_id": assessment_id,
                    "name": product_data.get("name"),
                    "category": product_data.get("category"),
                    "estimated_hs_code": product_data.get("estimated_hs_code")
                }
                
                variants_list = product_data.get("variants", [])
                if isinstance(variants_list, list):
                    for variant_data in variants_list:
                         if not isinstance(variant_data, dict) or not variant_data.get("name"):
                            logger.warning(f"[{self.NAME}] Skipping invalid variant data item for product {product_id}: {variant_data}")
                            continue
                         
                         variant_id = str(uuid4())
                         variants_patch[variant_id] = {
                             "id": variant_id,
                             "product_id": product_id, 
                             "name": variant_data.get("name"),
                             "description": variant_data.get("description")
                         }
        else:
            logger.warning(f"[{self.NAME}] 'products' key contains non-list data: {type(products_list)}. Skipping product processing.")

        certs_list = llm_analysis_data.get("certifications", [])
        if isinstance(certs_list, list):
            for cert_data in certs_list:
                 if not isinstance(cert_data, dict) or not cert_data.get("name"):
                    logger.warning(f"[{self.NAME}] Skipping invalid certification data item: {cert_data}")
                    continue
                    
                 cert_id = str(uuid4())
                 certs_patch[cert_id] = {
                     "id": cert_id,
                     "assessment_id": assessment_id,
                     "name": cert_data.get("name"),
                     "required_for": cert_data.get("required_for", []) 
                 }
        else:
            logger.warning(f"[{self.NAME}] 'certifications' key contains non-list data: {type(certs_list)}. Skipping certification processing.")
            
        logger.info(f"[{self.NAME}] Prepared DB patch for assessment {assessment_id} with {len(products_patch)} products, {len(variants_patch)} variants, {len(certs_patch)} certifications.")
        logger.debug(f"[{self.NAME}] Full DB patch details: {json.dumps(patch, indent=2)}")
        return patch

    def _generate_error_output(self, error_message: str, debug_info: Optional[Dict] = None) -> ModuleOutput:
        """Generates a standard error output for the module."""
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

    @staticmethod
    def get_website_analysis_prompt(website_content: str) -> str:
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