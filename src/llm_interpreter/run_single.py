#!/usr/bin/env python
# /Users/seanking/Projects/tradewizard_4.1/src/llm_interpreter/run_single.py

import os
import sys
import logging
import json
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from dotenv import load_dotenv

# Import the interpreter module and output formatter using relative imports
import sys
import os

from .interpreter import process_single_assessment, update_assessment_status, fetch_assessments_for_llm
from .output_formatter import format_mcp_results

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def run_single_assessment(assessment_id: str) -> bool:
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
        
        # Fetch the assessment by ID
        response = supabase.table("Assessments") \
                          .select("*") \
                          .eq("id", assessment_id) \
                          .execute()
        
        if not response.data:
            logger.error(f"Assessment with ID {assessment_id} not found.")
            return False
        
        assessment = response.data[0]
        
        # Process the assessment
        start_time = datetime.now(timezone.utc)
        final_status = process_single_assessment(assessment)
        
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
        
        # Insert products if available
        if "products" in standardized_output and standardized_output["products"]:
            products_to_insert = []
            for product in standardized_output["products"]:
                product_copy = product.copy()
                product_copy["assessment_id"] = assessment_id
                products_to_insert.append(product_copy)
            
            if products_to_insert:
                supabase.table("Products") \
                        .upsert(products_to_insert) \
                        .execute()
                logger.info(f"Inserted {len(products_to_insert)} products for assessment {assessment_id}")
        
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

if __name__ == "__main__":
    # Check if an assessment ID was provided as a command-line argument
    if len(sys.argv) < 2:
        logger.error("No assessment ID provided. Usage: python run_single.py <assessment_id>")
        sys.exit(1)
    
    assessment_id = sys.argv[1]
    success = run_single_assessment(assessment_id)
    
    # Exit with appropriate status code
    sys.exit(0 if success else 1)
