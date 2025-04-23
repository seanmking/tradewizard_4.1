# /Users/seanking/Projects/tradewizard_4.1/src/llm_interpreter/interpreter.py

import os
import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv
import asyncio

# Import MCP components using relative imports
import sys
import os

# Add the parent directory to sys.path to enable relative imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from mcps import get_active_mcps, log_mcp_run, handle_mcp_result, BaseMCP, MCPOutput
from scrapers.crawler_integration import crawl_and_prepare_content

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url: Optional[str] = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key: Optional[str] = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Optional[Client] = None
if supabase_url and supabase_key:
    try:
        supabase = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized successfully in interpreter.")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
else:
    logger.warning("Supabase URL or Key not found. Interpreter operations requiring DB access will fail.")

# --- Database Interaction Functions ---

def fetch_assessments_for_llm() -> List[Dict[str, Any]]:
    """Fetches assessments marked ready for LLM processing."""
    if not supabase:
        logger.error("Supabase client not available for fetching assessments.")
        return []
    try:
        # TODO: Potentially filter out assessments already processed or in a failed state?
        # Filter by llm_ready = true and maybe llm_status != 'failed' or based on last attempt time?
        # Currently selecting based on original 'llm_ready' logic
        response = supabase.table("Assessments") \
                         .select("*", count='exact') \
                         .eq("llm_ready", True) \
                         .not_.is_('raw_content', None) \
                         .execute()

        if response.count is not None and response.count > 0:
            logger.info(f"Fetched {response.count} assessments for LLM processing.")
            return response.data
        else:
            logger.info("No assessments found ready for LLM processing.")
            return []
    except Exception as e:
        logger.error(f"Error fetching assessments from Supabase: {e}", exc_info=True)
        return []

def fetch_products_for_classification(classification_id: str) -> List[Dict[str, Any]]:
    """Fetches product records associated with a given assessment ID."""
    # This function queries the 'Products' table based on the assessment_id
    if not supabase:
        logger.error("Supabase client not available for fetching products.")
        return []
    
    try:
        logger.info(f"Fetching products for classification ID: {classification_id}")
        # Using assessment_id which is the column name in our Products table
        response = (supabase.table("Products")
                          .select("*, ProductVariants(*)")
                          .eq("assessment_id", classification_id)
                          .execute())
        
        if response.data:
            logger.info(f"Fetched {len(response.data)} products for classification {classification_id}")
            return response.data
        else:
            logger.info(f"No products found for classification {classification_id}")
            return []
    except Exception as e:
        logger.error(f"Error fetching products for classification {classification_id}: {e}", exc_info=True)
        return []
    # --- End Placeholder Implementation ---

def update_assessment_status(assessment_id: str, status: str, processed_at: Optional[datetime] = None, error_message: Optional[str] = None) -> None:
    """Updates the llm_status and optionally llm_processed_at for an assessment."""
    if not supabase:
        logger.error(f"Supabase client not available. Cannot update assessment status for {assessment_id}.")
        return

    update_data: Dict[str, Any] = {
        "llm_status": status,
        "llm_ready": False # Always set llm_ready to false after processing attempt
    }
    if processed_at:
        update_data["llm_processed_at"] = processed_at.isoformat()
    if error_message:
        update_data["error_message"] = error_message

    try:
        logger.info(f"Updating assessment {assessment_id} status to '{status}'...")
        response = supabase.table("Assessments") \
                         .update(update_data) \
                         .eq("id", assessment_id) \
                         .execute()
        # Add check for success/failure if needed based on response
        logger.debug(f"Assessment {assessment_id} status update response: {response.data}")
    except Exception as e:
        logger.error(f"Error updating assessment status for {assessment_id}: {e}", exc_info=True)

# --- Core Processing Logic ---

async def process_single_assessment(assessment: Dict[str, Any]) -> str:
    """Processes a single assessment by running all applicable MCPs."""
    assessment_id = assessment.get("id")
    if not assessment_id:
        logger.error("Assessment data missing 'id'. Cannot process.")
        return "failed" # Indicate failure

    logger.info(f"Processing assessment ID: {assessment_id}")

    # --- Start: Crawler Integration Logic ---
    trigger_crawler = assessment.get("trigger_crawler", False)
    # Heuristic check: Does raw_content look like structured JSON from our crawler?
    # If it doesn't have a known key like 'page_contents', assume it's incomplete.
    raw_content_is_structured = isinstance(assessment.get("raw_content"), dict) and "page_contents" in assessment.get("raw_content", {})

    logger.info(f"Checking crawler condition for {assessment_id}: trigger_crawler={trigger_crawler}, raw_content_is_structured={raw_content_is_structured}")

    if trigger_crawler and not raw_content_is_structured:
        logger.info(f"Triggering crawler for assessment {assessment_id} as trigger_crawler=True and raw_content seems incomplete.")
        # Fetch the URL using the correct column name 'source_url'
        url = assessment.get("source_url")
        if not url:
            error_msg = "URL missing for crawler trigger"
            logger.error(f"Cannot trigger crawler for assessment {assessment_id}: {error_msg}.")
            # Update status before returning
            update_assessment_status(assessment_id, "failed", error_message=error_msg)
            return "failed"

        try:
            # Run the async crawler function using asyncio.run()
            structured_raw_content = await crawl_and_prepare_content(url)
            # Assuming crawl_and_prepare_content returns None or raises error on failure
            # Check if the crawler returned a valid dictionary
            if not isinstance(structured_raw_content, dict):
                logger.error(f"Crawler for {url} did not return a valid dictionary. Output: {structured_raw_content}")
                raise ValueError("Crawler returned unexpected data type")

            # Update the assessment with the structured content
            logger.info(f"Updating assessment {assessment_id} with crawled content.")
            update_data = {
                "raw_content": structured_raw_content,
                "trigger_crawler": False, # Reset the trigger
                "crawler_run_at": datetime.now(timezone.utc).isoformat()
            }
            response = supabase.table("Assessments").update(update_data).eq("id", assessment_id).execute()
            logger.debug(f"Supabase update response for crawled content: {response}")

            # Reload assessment data after update
            response = supabase.table("Assessments").select("*").eq("id", assessment_id).single().execute()
            assessment = response.data
            logger.info(f"Re-fetched assessment {assessment_id} after crawler update.")
            # Re-check if raw_content is now structured after the update
            raw_content_is_structured = isinstance(assessment.get('raw_content'), dict) and bool(assessment.get('raw_content'))
            logger.info(f"Re-checking raw_content structure: {raw_content_is_structured}")

        except Exception as e:
            error_msg = f"Error during crawler execution or update for assessment {assessment_id}: {e}"
            logger.error(error_msg, exc_info=True)
            update_assessment_status(assessment_id, "failed", error_message=error_msg)
            return "failed" # Stop processing if crawler fails

    # Determine active MCPs based on potentially updated assessment data
    try:
        active_mcps: Dict[str, BaseMCP] = get_active_mcps(assessment)
    except Exception as e:
        logger.error(f"Error determining active MCPs for assessment {assessment_id}: {e}", exc_info=True)
        return "failed"

    if not active_mcps:
        logger.info(f"No active MCPs found for assessment {assessment_id} based on its status. Marking as processed.")
        return "success" # Or another status like 'skipped'?

    logger.info(f"Active MCPs for assessment {assessment_id}: {list(active_mcps.keys())}")

    overall_status = "success" # Assume success initially
    mcp_errors = 0

    # 3. Iterate through active MCPs and execute them
    for mcp_name, mcp_instance in active_mcps.items():
        logger.info(f"--- Running MCP: {mcp_name} (v{mcp_instance.version}) for assessment {assessment_id} ---")
        mcp_output: Optional[MCPOutput] = None
        payload: Optional[Dict[str, Any]] = None
        run_error: Optional[str] = None

        try:
            # a. Build Payload
            payload = await mcp_instance.build_payload(assessment, [])
            logger.debug(f"[{mcp_name}] Payload built: {payload}")

            # b. Run MCP - Pass only the payload (use await as run might be async)
            mcp_output = await mcp_instance.run(payload)
            logger.debug(f"[{mcp_name}] Raw output: {mcp_output}")

            # Check for errors reported by the MCP itself
            if mcp_output.get("error"):
                run_error = mcp_output["error"]
                logger.error(f"MCP {mcp_name} reported an error: {run_error}")
                mcp_errors += 1

        except Exception as e:
            run_error = f"Interpreter error running {mcp_name}: {e}"
            logger.error(run_error, exc_info=True)
            mcp_errors += 1
            # Create a minimal MCPOutput for logging the error
            mcp_output = MCPOutput(result={}, confidence=None, error=run_error, _db_patch=None, llm_input_prompt=None, llm_raw_output=None, started_at=datetime.now(timezone.utc), completed_at=datetime.now(timezone.utc))

        finally:
            # c. Log MCP Run (always attempt to log, even on error)
            if mcp_output is not None:
                try:
                    # Extract arguments for log_mcp_run from mcp_output
                    log_mcp_run(
                        # assessment_id=assessment_id,
                        classification_id=assessment_id, # Changed from assessment_id for clarity if needed
                        mcp_name=mcp_instance.name,
                        mcp_version=mcp_instance.version,
                        payload=payload or {}, # Log empty payload if build failed
                        # Unpack relevant fields from mcp_output
                        result=mcp_output.get("result"),
                        confidence=mcp_output.get("confidence"),
                        error=mcp_output.get("error"), # Use .get() for safety
                        llm_input_prompt=mcp_output.get("llm_input_prompt"),
                        llm_raw_output=mcp_output.get("llm_raw_output"),
                        started_at=mcp_output.get("started_at"), # Pass timestamps if available
                        completed_at=mcp_output.get("completed_at")
                        # mcp_output=mcp_output # Removed this incorrect argument
                    )
                except Exception as log_e:
                    logger.error(f"Critical error logging MCP run for {mcp_name}: {log_e}", exc_info=True)

                # d. Apply DB Patch (if available and no critical error occurred during run)
                # Check if mcp_output exists and if the run itself didn't have a critical exception error
                if mcp_output.get("_db_patch") and not run_error:
                    logger.info(f"[{mcp_name}] Attempting to apply database patch...")
                    try:
                        patch_applied = handle_mcp_result(mcp_output)
                        if patch_applied:
                            logger.info(f"[{mcp_name}] Database patch applied successfully.")
                        else:
                            # This case might mean no patch was needed, or handle_mcp_result handled an error internally
                            logger.info(f"[{mcp_name}] Database patch application finished (or no patch needed/failed internally). Check logs for handle_mcp_result.")
                    except Exception as patch_e:
                        logger.error(f"Critical error applying MCP patch for {mcp_name}: {patch_e}", exc_info=True)
                        # Consider if this error should change overall_status or mcp_errors
                elif run_error:
                    logger.warning(f"[{mcp_name}] Skipping database patch application due to MCP run error: {run_error}")
                else:
                    logger.info(f"[{mcp_name}] No _db_patch found or MCP output was None. Skipping patch application.")

            logger.info(f"--- Finished MCP: {mcp_name} for assessment {assessment_id} ---")

    # 4. Determine final status
    if mcp_errors == len(active_mcps):
        overall_status = "failed" # All MCPs failed
    elif mcp_errors > 0:
        overall_status = "partial" # Some MCPs failed
    else:
        overall_status = "success" # All ran without error

    logger.info(f"Finished processing assessment {assessment_id}. Overall status: {overall_status}")
    return overall_status

# --- Main Execution Function ---

async def run_interpreter_batch() -> None:
    """Fetches and processes a batch of assessments."""
    logger.info("Starting LLM interpreter batch run...")
    assessments_to_process = fetch_assessments_for_llm()

    if not assessments_to_process:
        logger.info("No assessments to process in this batch run.")
        return

    processed_count = 0
    failed_count = 0
    partial_count = 0

    for assessment in assessments_to_process:
        assessment_id = assessment.get("id", "Unknown ID")
        logger.info(f"Processing assessment: {assessment_id}")
        start_time = datetime.now(timezone.utc)

        # Process the assessment using the new MCP-driven logic
        final_status = await process_single_assessment(assessment)

        # Update the assessment status in Supabase
        update_assessment_status(assessment_id, final_status, processed_at=start_time)

        if final_status == "success":
            processed_count += 1
        elif final_status == "partial":
            partial_count += 1
        else: # final_status == "failed"
            failed_count += 1

    logger.info("LLM interpreter batch run finished.")
    logger.info(f"Summary: Processed={processed_count}, Partial={partial_count}, Failed={failed_count}")

# --- Main entry point for direct execution ---
if __name__ == "__main__":
    logger.info("Running LLM Interpreter directly...")
    # Make sure Supabase client is available if running directly
    if not supabase:
        logger.critical("Supabase client not initialized. Cannot run interpreter. Check .env variables.")
    else:
        asyncio.run(run_interpreter_batch())
    logger.info("Interpreter finished direct run.")
