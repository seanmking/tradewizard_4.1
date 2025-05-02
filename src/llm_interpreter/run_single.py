#!/usr/bin/env python
# /Users/seanking/Projects/tradewizard_4.1/src/llm_interpreter/run_single.py

import os
import sys
import logging
import json
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from dotenv import load_dotenv
import asyncio

# Import the interpreter module and output formatter using relative imports
from .interpreter import process_assessment
from .output_formatter import format_mcp_results

# Backwards compatibility stubs for missing imports
process_single_assessment = process_assessment

def update_assessment_status(assessment_id: str, status: str):
    from supabase import create_client
    import os
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if supabase_url and supabase_key:
        supabase = create_client(supabase_url, supabase_key)
        supabase.table("Assessments").update({"status": status}).eq("id", assessment_id).execute()

def fetch_assessments_for_llm(*args, **kwargs):
    # Stub: not used in single-run
    return []

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def run_single_assessment(assessment_id: str) -> bool:
    """
    Process a single assessment by ID
    
    Args:
        assessment_id: The ID of the assessment to process
        
    Returns:
        True if processing was successful, False otherwise
    """
    logger.info(f"Processing single assessment: {assessment_id}")
    
    try:
        # Import here to avoid circular imports
        from supabase import create_client
        
        # Initialize Supabase client
        supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.error("Supabase URL or Key not found. Cannot process assessment.")
            return False
        
        supabase = create_client(supabase_url, supabase_key)
        
        # --- Pre-run Reset: Ensure the assessment is ready for processing --- 
        try:
            logger.info(f"Resetting assessment {assessment_id} state for processing (llm_ready=True).")
            reset_response = supabase.table("Assessments") \
                                     .update({
                                         "llm_ready": True,
                                         "llm_status": None, # Reset status
                                         "error_message": None # Clear previous errors
                                     }) \
                                     .eq("id", assessment_id) \
                                     .execute()
            if not reset_response.data:
                # Handle cases where the update might fail or affect 0 rows (e.g., ID not found)
                logger.warning(f"Attempt to reset assessment {assessment_id} returned no data. It might not exist.")
                # Decide if we should stop here or try fetching anyway
                # For now, let's try fetching, it will fail later if the ID is truly invalid
        except Exception as e:
            logger.error(f"Error resetting assessment {assessment_id} status: {e}", exc_info=True)
            return False # Exit if we can't reset the state

        # --- Main Processing Block --- 
        try:
            # Fetch Assessment Data
            response = supabase.table("Assessments") \
                             .select("*") \
                             .eq("id", assessment_id) \
                             .execute()
            
            if not response.data:
                logger.error(f"Assessment with ID {assessment_id} not found.")
                return False
            
            assessment = response.data[0]

            # Patch assessment for formatter compatibility and fallback
            if 'products' not in assessment or not assessment['products']:
                # Try to pull from known output locations
                if 'output_json' in assessment and 'products' in assessment['output_json']:
                    assessment['products'] = assessment['output_json']['products']
            if 'output_json' not in assessment:
                assessment['output_json'] = {}
            if 'products' in assessment and assessment['products']:
                assessment['output_json']['products'] = assessment['products']
            # Defensive: add llm_raw_response if missing and products are present
            if 'llm_raw_response' not in assessment and assessment.get('products'):
                assessment['llm_raw_response'] = {'products': assessment['products']}

            # Process the assessment
            start_time = datetime.now(timezone.utc)
            # Call the synchronous interpreter and treat completion as success
            process_single_assessment(assessment)
            final_status = "success"
            
            # Collect MCP outputs from the mcp_runs table
            mcp_runs_response = supabase.table("mcp_runs") \
                                      .select("*") \
                                      .eq("classification_id", assessment_id) \
                                      .execute()
            
            mcp_outputs = {}
            if mcp_runs_response.data:
                for run in mcp_runs_response.data:
                    mcp_name = run.get("mcp_name")
                    if mcp_name and "mcp_output" in run:
                        try:
                            mcp_outputs[mcp_name] = run["mcp_output"]
                        except (TypeError, ValueError) as e:
                            logger.warning(f"Could not parse MCP output for {mcp_name}: {e}")
            
            # Format MCP outputs into standardized structure
            standardized_output = format_mcp_results(assessment, mcp_outputs)
            
            # Print the standardized output as JSON for the Node.js bridge to capture
            print("\nSTANDARDIZED_OUTPUT_BEGIN")
            print(json.dumps(standardized_output, indent=2))
            print("STANDARDIZED_OUTPUT_END\n")
            
            # Upsert extracted products into canonical Product table
            if standardized_output.get("products"):
                products_to_upsert = []
                for product in standardized_output["products"]:
                    product_record = {
                        "assessment_id": assessment_id,
                        "name": product.get("name"),
                        "description": product.get("description"),
                        "image_url": product.get("image_url"),
                        "scraped_url": None,
                        "raw_scraped_data": None,
                        "llm_insights": {
                            "confidence": product.get("confidence"),
                            "source": product.get("source"),
                            "estimated_hs_code": product.get("estimated_hs_code"),
                        },
                        "group_id": None,  # Start ungrouped
                    }
                    # Optionally set scraped_url if found_on_pages is present and non-empty
                    found_on_pages = product.get("found_on_pages")
                    if found_on_pages and isinstance(found_on_pages, list) and found_on_pages:
                        product_record["scraped_url"] = found_on_pages[0]
                    products_to_upsert.append(product_record)

                # Deduplicate by (assessment_id, name)
                seen = set()
                deduped_products = []
                for p in products_to_upsert:
                    key = (p["assessment_id"], p["name"])
                    if key not in seen:
                        deduped_products.append(p)
                        seen.add(key)

                logger.info(f"Upserting {len(deduped_products)} products into Product table for assessment {assessment_id}.")
                # Use Supabase upsert (on assessment_id, name) if available
                try:
                    upsert_response = supabase.table("products").upsert(
                        deduped_products,
                        on_conflict=["assessment_id", "name"]
                    ).execute()
                    logger.debug(f"Product upsert response: {upsert_response.data}")
                except Exception as e:
                    logger.error(f"Supabase upsert failed, falling back to delete+insert: {e}")
                    # Fallback: delete then insert
                    for p in deduped_products:
                        supabase.table("products").delete().eq("assessment_id", p["assessment_id"]).eq("name", p["name"]).execute()
                    insert_response = supabase.table("products").insert(deduped_products).execute()
                    logger.debug(f"Product insert fallback response: {insert_response.data}")

                logger.info(f"Products upserted for assessment {assessment_id}: {len(deduped_products)}")

            # Update the assessment with the standardized output
            update_data = {
                "llm_status": final_status,
                "llm_ready": False,  # Reset so it doesn't get processed again
                "llm_processed_at": start_time.isoformat()
            }
            
            # Add standardized fields to the update
            if "summary" in standardized_output:
                update_data["summary"] = standardized_output["summary"]
            
            # Update the assessment
            supabase.table("Assessments") \
                    .update(update_data) \
                    .eq("id", assessment_id) \
                    .execute()
            
            # Insert certifications if available
            if "certifications" in standardized_output and standardized_output["certifications"]:
                certs_to_insert = []
                for cert in standardized_output["certifications"]:
                    cert_copy = cert.copy()
                    cert_copy["assessment_id"] = assessment_id
                    certs_to_insert.append(cert_copy)
                
                if certs_to_insert:
                    supabase.table("Certifications") \
                            .upsert(certs_to_insert) \
                            .execute()
                    logger.info(f"Inserted {len(certs_to_insert)} certifications for assessment {assessment_id}")
            
            logger.info(f"Assessment {assessment_id} processed with status: {final_status}")
            return final_status == "success"

        except Exception as e:
            # This except block now correctly corresponds to the main processing try block
            logger.error(f"Error processing assessment {assessment_id}: {e}", exc_info=True)
            
            # Try to update the assessment status to failed
            try:
                update_assessment_status(assessment_id, "failed")
                
                # Print error output for the Node.js bridge to capture
                error_output = {
                    "error": str(e),
                    "llm_ready": False,
                    "fallback_reason": f"Error: {str(e)}"
                }
                print("\nSTANDARDIZED_OUTPUT_BEGIN")
                print(json.dumps(error_output))
                print("STANDARDIZED_OUTPUT_END\n")
                
            except Exception as update_e:
                logger.error(f"Failed to update assessment status: {update_e}")
            
            return False

    except Exception as init_e: # This except handles the initial Supabase client creation
        logger.error(f"Failed to initialize Supabase client or critical setup error: {init_e}", exc_info=True)
        return False

if __name__ == "__main__":
    # Check if an assessment ID was provided as a command-line argument
    if len(sys.argv) < 2:
        logger.error("No assessment ID provided. Usage: python run_single.py <assessment_id>")
        sys.exit(1)
    
    assessment_id = sys.argv[1]
    # Run the async function using asyncio.run
    success = asyncio.run(run_single_assessment(assessment_id))
    
    # Exit with appropriate status code
    sys.exit(0 if success else 1)
