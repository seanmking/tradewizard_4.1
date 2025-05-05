#!/usr/bin/env python
# /Users/seaking/Projects/tradewizard_4.1/src/llm_interpreter/run_single.py

import os
import sys
import logging

import asyncio
import argparse
import logging
import os
import sys
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from dotenv import load_dotenv
import json
from supabase import create_client, Client
from src.modules.helpers import log_mcp_run, handle_mcp_result, get_supabase_client  # include patch helper
from src.llm_interpreter.interpreter import process_assessment
from src.llm_interpreter.output_formatter import format_mcp_results
from src.scrapers.playwright_crawler import PlaywrightCrawler
from postgrest.exceptions import APIError

# Configure basic logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Get logger for this script
logger = logging.getLogger(__name__)

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")) # Corrected path
sys.path.insert(0, project_root)

# Load environment variables
load_dotenv()

# Ensure supabase client is initialized for helpers
supabase = get_supabase_client()
if not supabase:
    print("Failed to initialize Supabase client. Cannot proceed.")
    sys.exit(1)

async def run_single_assessment(record: dict, supabase_client: Client, trigger_crawler: bool) -> None:
    """Run WebsiteAnalysisModule and persist its output to mcp_runs."""
    from src.modules.website_analysis_module import WebsiteAnalysisModule

    assessment_id = record['id']
    print(f"DEBUG: >>> Entering run_single_assessment for ID: {assessment_id}", flush=True)

    # --- MOVED: Crawling Logic Start --- 
    # Check for raw_content and crawl if necessary
    if not record.get("raw_content") or trigger_crawler:
        if trigger_crawler:
            logger.info(f"Assessment {assessment_id}: --trigger-crawler flag detected. Initiating crawl even if raw_content exists.")
        else:
            logger.info(f"Assessment {assessment_id}: raw_content missing. Initiating crawl.")
        
        source_url = record.get("source_url")
        if not source_url:
            logger.error(f"Assessment {assessment_id}: Missing source_url. Cannot crawl.")
            update_assessment_status(assessment_id, "failed", "Missing source_url")
            return # Return instead of exit inside async function
        
        try:
            # Initialize and run the crawler
            logger.info(f"Assessment {assessment_id}: Triggering PlaywrightCrawler for URL: {source_url}")
            crawler = PlaywrightCrawler(max_pages=50, max_depth=5)
            logger.debug(f"Assessment {assessment_id}: Awaiting crawler.crawl()...")
            # CORRECTED: Use await here
            crawl_results = await crawler.crawl(source_url)
            logger.info(f"Assessment {assessment_id}: Raw crawl_results received: {crawl_results}") 
            logger.debug(f"Assessment {assessment_id}: Crawler finished. Raw crawl_results (debug): {crawl_results}") # Keep debug too
            logger.info(f"Assessment {assessment_id}: Crawler finished. Results keys: {crawl_results.keys() if isinstance(crawl_results, dict) else 'N/A'}")
            
            aggregated_content = ""
            raw_content_list = []
            # Check the structure of crawl_results before iterating
            if crawl_results and 'pages' in crawl_results and isinstance(crawl_results['pages'], list):
                logger.debug(f"Assessment {assessment_id}: Processing {len(crawl_results['pages'])} pages from crawl results.")
                for page in crawl_results['pages']:
                    if isinstance(page, dict) and 'url' in page and 'content' in page:
                         logger.debug(f"Assessment {assessment_id}: Adding content from URL: {page['url']}")
                         raw_content_list.append(page['content'])
                    else:
                         logger.debug(f"Assessment {assessment_id}: Skipping invalid page data in crawl_results: {page}")
                aggregated_content = "\n\n".join(raw_content_list)
                logger.debug(f"Assessment {assessment_id}: Aggregated content length: {len(aggregated_content)}")
            else:
                logger.error(f"Assessment {assessment_id}: Unexpected crawl_results structure: {type(crawl_results)}. Content: {crawl_results}")
                update_assessment_status(assessment_id, "failed", "Crawler returned unexpected data structure.")
                return # Return instead of exit

            record["raw_content"] = aggregated_content # Update record in memory
            logger.debug(f"Assessment {assessment_id}: Attempting to update database with crawled content...")
            update_success = update_assessment_content(assessment_id, aggregated_content, "processing")
            logger.debug(f"Assessment {assessment_id}: Database update result: {update_success}")
            if not update_success:
                logger.error(f"Assessment {assessment_id}: Failed to update database with crawled content. Aborting assessment run.")
                update_assessment_status(assessment_id, "failed", "Failed to save crawled content to DB.")
                return # Return instead of exit
        except Exception as e:
            logger.error(f"Assessment {assessment_id}: Crawler failed with error: {e}", exc_info=True)
            update_assessment_status(assessment_id, "failed", f"Crawler error: {e}")
            return # Return on crawler failure
    else:
        logger.info(f"Assessment {assessment_id}: Found existing raw_content and --trigger-crawler flag not set. Skipping crawl.")
    # --- MOVED: Crawling Logic End --- 

    # --- Updated Analysis Logic --- 
    # Get raw_content and check if it exists
    raw_content_value = record.get("raw_content") # Renamed to avoid conflict
    if raw_content_value is None:
        logger.warning(f"Assessment {assessment_id}: No raw_content found. Skipping analysis.")
        if record.get("status") != "failed":
            update_assessment_status(assessment_id, "skipped", "No raw_content found.")
        return # Exit function if no content

    # Handle both JSONB and legacy TEXT formats
    aggregated_text = "" # Initialize aggregated_text
    content_source = "Unknown"

    if isinstance(raw_content_value, dict):  # JSONB format
        content_source = "JSONB"
        logger.info(f"Assessment {assessment_id}: Processing JSONB raw_content.")
        # Extract text from all crawled pages
        aggregated_text = ""
        if 'pages' in raw_content_value and isinstance(raw_content_value['pages'], list):
            for page in raw_content_value['pages']:
                page_text = page.get('text', '')
                if page_text:
                    # Add URL context for better extraction
                    page_url = page.get('url', 'unknown')
                    aggregated_text += f"=== Page: {page_url} ===\n"
                    aggregated_text += page_text.strip() + "\n\n" # Added strip()
            aggregated_text = aggregated_text.strip() # Remove trailing newlines
        else:
            logger.error(f"Assessment {assessment_id}: Invalid JSONB structure in raw_content. Skipping analysis.")
            if record.get("status") != "failed":
                 update_assessment_status(assessment_id, "skipped", "Invalid JSONB structure in raw_content.")
            return # Exit function
            
    elif isinstance(raw_content_value, str):  # Legacy TEXT format
        content_source = "TEXT"
        logger.info(f"Assessment {assessment_id}: Processing TEXT raw_content.")
        aggregated_text = raw_content_value.strip()
    else:
        logger.error(f"Assessment {assessment_id}: Invalid raw_content type ({type(raw_content_value)}). Skipping analysis.")
        if record.get("status") != "failed":
             update_assessment_status(assessment_id, "skipped", f"Invalid raw_content type: {type(raw_content_value)}")
        return # Exit function

    # Check if aggregated_text is empty after processing
    if not aggregated_text:
         logger.warning(f"Assessment {assessment_id}: Aggregated text is empty after processing {content_source} content. Skipping analysis.")
         if record.get("status") != "failed":
              update_assessment_status(assessment_id, "skipped", f"Aggregated text is empty from {content_source} content.")
         return # Exit function

    # --- Added Debug Logging ---
    logger.debug(f"Assessment {assessment_id}: Raw content type processed: {type(raw_content_value)}")
    logger.debug(f"Assessment {assessment_id}: Aggregated text length: {len(aggregated_text)}")
    logger.debug(f"Assessment {assessment_id}: First 500 chars: {aggregated_text[:500]}")

    # Update the record in memory so process_assessment gets the text string
    # This assumes process_assessment expects the text in 'raw_content' key
    record['raw_content'] = aggregated_text

    # --- Existing Analysis Logic Continues ---
    logger.info(f"Assessment {assessment_id}: Starting LLM analysis.")
    logger.info(f"Assessment {assessment_id}: Content source: {content_source}")

    # Now call the interpreter function
    try:
        # Run the main processing function from interpreter.py
        # It expects the full record, and we've updated record['raw_content'] to be the aggregated text string.
        module = WebsiteAnalysisModule()
        payload = await module.build_payload(record, [])
        print(f"DEBUG: Using module: {module.NAME} v{module.VERSION}", flush=True)

        print(f"DEBUG: Running module {module.NAME} for assessment {record['id']}...", flush=True)
        print(f"DEBUG: Before module.run() call...", flush=True)
        module_run_success = module.run(record)
        print(f"DEBUG: module.run() returned: {module_run_success}", flush=True)
        print(f"DEBUG: After module.run() call...", flush=True)

        # Store results and log
        if module_run_success:
            print(f"DEBUG: Logging MCP run for {module.NAME}...", flush=True) # Use print
            logger.debug(f"== BEFORE log_mcp_run call for assessment {record['id']} ==")
            log_mcp_run(
                mcp_name=module.NAME,
                mcp_version=module.VERSION,
                payload=payload, # Pass the original payload for context (summary logged)
                result=module_run_success, # Pass the entire result
                classification_id=record["id"],
                supabase_client=supabase_client,
            )
            logger.debug(f"== AFTER log_mcp_run call for assessment {record['id']} ==")

            # Apply the database patch generated by the MCP
            print(f"DEBUG: Attempting to apply database patches for assessment {record['id']}...", flush=True)
            print(f"DEBUG: == BEFORE handle_mcp_result call ==")
            patch_applied = handle_mcp_result(module_run_success) # Pass the whole output dict
            print(f"DEBUG: == AFTER handle_mcp_result call. Returned value: {patch_applied} (Type: {type(patch_applied)}) ==")
            if patch_applied:
                print(f"DEBUG: Database patch application process completed for assessment {record['id']}.", flush=True)
            else:
                print(f"DEBUG: No database patch found or application failed for assessment {record['id']}.", flush=True)
        else:
            print("DEBUG: MCP output dictionary was None or empty, skipping log and patch.", flush=True) # Use print
        # --- End Core Logic ---
    except Exception as e:
        print(f"DEBUG: !!! EXCEPTION caught within run_single_assessment for ID {record['id']}: {e}", flush=True)
        # Optionally update status here if needed, though main() might also catch it
        # update_assessment_status(record['id'], "failed", f"Async execution error: {e}")

    print(f"DEBUG: Reached end of script for assessment {assessment_id}.", flush=True) # Cascade ADD
    logging.info(f"Assessment {assessment_id}: Assessment processing completed.")

def main():
    # --- Use argparse for proper argument handling ---
    parser = argparse.ArgumentParser(description="Run LLM analysis for a single assessment ID.")
    parser.add_argument("--assessment_id", required=True, help="The UUID of the assessment to process.")
    parser.add_argument('--trigger-crawler', action='store_true', help='Force crawl even if raw_content exists.')
    args = parser.parse_args()
    assessment_id = args.assessment_id
    trigger_crawler_flag = args.trigger_crawler # Store flag
    # --- End of argparse setup ---

    # --- Fetch initial record ---
    record = fetch_record(assessment_id)
    if not record:
        sys.exit(1) # Error logged in fetch_record

    # --- Call the async function using asyncio.run --- 
    logger.info(f"Assessment {assessment_id}: Starting assessment processing...")
    try:
        print(f"DEBUG: ENTERED main try block for {assessment_id}", flush=True) # Cascade ADD
        # Pass the trigger_crawler flag to the async function
        asyncio.run(run_single_assessment(record, supabase, trigger_crawler=trigger_crawler_flag))
        logger.info(f"Assessment {assessment_id}: Assessment processing completed.")
    except Exception as e:
        print(f"DEBUG: CAUGHT EXCEPTION in main: {e}", flush=True) # Cascade ADD
        logger.critical(f"Assessment {assessment_id}: An unexpected error occurred during run_single_assessment: {e}", exc_info=True)
        update_assessment_status(assessment_id, "failed", f"Unhandled exception: {e}")
        sys.exit(1)
    
def fetch_record(assessment_id: str) -> Optional[Dict[str, Any]]:
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        print("Supabase URL or Key not found in environment variables.")
        return None
    supabase = create_client(supabase_url, supabase_key)
    
    response = supabase.table("Assessments").select("*").eq("id", assessment_id).execute()
    if not response.data:
        print(f"Assessment with ID {assessment_id} not found.")
        return None
    return response.data[0]

def update_assessment_content(assessment_id: str, content: str, status: str):
    """Updates the raw_content and status for an assessment."""
    print(f"DEBUG: ENTERED update_assessment_content for {assessment_id} with status {status}", flush=True) # Cascade ADD
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        print("Supabase URL or Key not found in environment variables.")
        return False
    supabase = create_client(supabase_url, supabase_key)
    try:
        print(f"DEBUG: Updating assessment {assessment_id} with content and status {status}...", flush=True) # Cascade ADD
        # Execute the update
        supabase.table("Assessments").update({
            "raw_content": content,
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat() # Keep updated_at fresh
        }).eq("id", assessment_id).execute()
        
        # If execute() completed without raising an exception, assume success.
        # We know from logs the HTTP status code was 200 OK previously.
        print(f"Assessment {assessment_id}: Successfully executed update for raw_content and status to '{status}'.", flush=True)
        return True
    
    except Exception as e:
        print(f"DEBUG: ERROR in update_assessment_content: {e}", flush=True) # Cascade ADD
        print(f"Assessment {assessment_id}: Exception during Supabase content update: {e}", exc_info=True)
        # Attempt to update status to failed ONLY if the primary update fails
        try:
            # Use the dedicated status update function if it exists, otherwise inline
            # Assuming update_assessment_status exists and handles its own errors
            from .supabase_utils import update_assessment_status # Assuming it's here
            update_assessment_status(assessment_id, "failed", f"DB content update error: {e}")
        except ImportError:
            # Fallback if update_assessment_status is not easily importable or defined elsewhere
            print("update_assessment_status not found, attempting inline status update.")
            try:
                supabase.table("Assessments").update({
                    "status": "failed",
                    "error_message": f"DB content update error: {e}",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", assessment_id).execute()
            except Exception as inner_e:
                print(f"Assessment {assessment_id}: CRITICAL - Failed to update status to 'failed' after content update error: {inner_e}")
        except Exception as status_update_e:
              print(f"Assessment {assessment_id}: CRITICAL - Failed during call to update_assessment_status after content update error: {status_update_e}")
        
        return False

def update_assessment_status(assessment_id: str, status: str, message: Optional[str] = None):
    """Updates the status and optionally a message for an assessment."""
    print(f"DEBUG: ENTERED update_assessment_status for {assessment_id} with status {status}", flush=True) # Cascade ADD
    try:
        supabase = get_supabase_client()
        if not supabase:
            print("DEBUG: Supabase client not available in update_assessment_status", flush=True) # Cascade ADD
            return
        update_data = {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        print(f"DEBUG: Updating assessment {assessment_id} with data: {update_data}", flush=True) # Cascade ADD
        if message:
            print(f"Status message (not saved to DB): {message}", flush=True) # Log message instead
            update_data["error_message"] = message
        response = supabase.table("Assessments").update(update_data).eq("id", assessment_id).execute()
        # Check response structure before accessing data
        if hasattr(response, 'data') and response.data:
            print(f"DEBUG: DB update response in update_assessment_status: {response.data}", flush=True) # Cascade ADD
        else:
            print(f"DEBUG: DB update response (or error info) in update_assessment_status: {response}", flush=True) # Cascade ADD
    except Exception as e:
        print(f"DEBUG: ERROR in update_assessment_status: {e}", flush=True) # Cascade ADD
        logging.error(f"Failed to update status for assessment {assessment_id}: {e}", exc_info=True)

if __name__ == "__main__":
    main()
