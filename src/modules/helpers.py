# /Users/seanking/Projects/tradewizard_4.1/src/mcps/helpers.py

import logging
import datetime
import os
import json
from typing import Optional, Dict, Any
from supabase import Client, create_client
from .base import MCPOutput # Import MCPOutput for type hinting

# --- Supabase client initialization at module level ---
supabase_url: Optional[str] = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key: Optional[str] = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Optional[Client] = None
if supabase_url and supabase_key:
    try:
        supabase = create_client(supabase_url, supabase_key)
    except Exception as e:
        supabase = None
else:
    supabase = None

# Initialize logger for MCP helpers
logger = logging.getLogger(__name__)

# --- Custom JSON Encoder ---
class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle non-serializable types like datetime."""
    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return super().default(obj)

def log_mcp_run(
    mcp_name: str,
    mcp_version: str,
    payload: Dict[str, Any],
    result: Optional[Dict[str, Any]] = None,
    confidence: Optional[float] = None,
    llm_input_prompt: Optional[str] = None,
    llm_raw_output: Optional[str] = None,
    error: Optional[str] = None,
    classification_id: Optional[str] = None,
    supabase_client: Client = supabase,
) -> None:
    """Logs the details of an MCP execution to the 'mcp_runs' table."""
    logger.debug(f"--- Entered log_mcp_run for {mcp_name} v{mcp_version}, classification {classification_id} ---")
    try:
        # --- Payload Summary for Logging --- 
        # Avoid logging potentially huge raw_content directly
        payload_summary = {}
        if payload:
            # Simplified summary
            payload_summary = {k: type(v).__name__ for k, v in payload.items() if k != 'raw_content'}
            if 'raw_content' in payload:
                payload_summary['raw_content'] = f"<present, len={len(payload['raw_content']) if payload['raw_content'] else 0}>"
        else:
            payload_summary = "<payload_was_none_or_empty>"
        # --- End Payload Summary --- 

        # Prepare result data, handling potential non-serializable types
        mcp_output_data = None
        if result:
            try:
                # Serialize the entire result dictionary using the custom encoder
                mcp_output_data_str = json.dumps(result, cls=CustomJSONEncoder, indent=2)
                mcp_output_data = json.loads(mcp_output_data_str) # Load back into dict for Supabase
                logger.debug("Successfully serialized 'result' dictionary in log_mcp_run.")
            except Exception as serialization_error:
                logger.error(f"Error serializing result in log_mcp_run: {serialization_error}", exc_info=True)
                mcp_output_data = {"error": f"Serialization failed: {str(serialization_error)}", "original_keys": list(result.keys())}

        log_entry = {
            "classification_id": classification_id,
            "mcp_name": mcp_name,
            "mcp_version": mcp_version,
            # "payload_summary": payload_summary, # Removed - Column doesn't exist in mcp_runs
            "mcp_output": mcp_output_data, # Store the comprehensive object
            # Note: Supabase client automatically adds created_at
        }

        # Filter out None values from the main log_entry (specifically for classification_id)
        log_entry = {k: v for k, v in log_entry.items() if v is not None}

        # == Add detailed pre-insert logging ==
        logger.debug(f"LOG_MCP_RUN PRE-INSERT: Classification ID: {classification_id}")
        logger.debug(f"LOG_MCP_RUN PRE-INSERT: MCP Name: {mcp_name}")
        logger.debug(f"LOG_MCP_RUN PRE-INSERT: Payload Summary Keys: {list(payload_summary.keys()) if isinstance(payload_summary, dict) else 'Not a dict'}")
        logger.debug(f"LOG_MCP_RUN PRE-INSERT: MCP Output Type: {type(mcp_output_data)}")
        if isinstance(mcp_output_data, dict):
            logger.debug(f"LOG_MCP_RUN PRE-INSERT: MCP Output Keys: {list(mcp_output_data.keys())}")
        logger.debug(f"LOG_MCP_RUN PRE-INSERT: Final Log Entry Keys: {list(log_entry.keys())}")
        try:
            logger.debug("Attempting to insert log entry into mcp_runs...")
            response = supabase_client.table("mcp_runs").insert(log_entry).execute()
            logger.debug(f"Successfully inserted log entry into mcp_runs: {response.data}") # Show data part of response
            # Handle potential API errors if needed, though PostgrestResponse structure might vary
            # if hasattr(response, 'error') and response.error:
            #     print(f"ERROR logging MCP run (Supabase error): {response.error}")
        except Exception as e:
            logger.error(f"Exception during log_mcp_run execution: {e}", exc_info=True)
            # Add more specific error context if possible
            # Try to log minimal info if main logging fails
            try:
                error_log = {
                    "classification_id": classification_id,
                    "mcp_name": mcp_name,
                    "mcp_version": mcp_version,
                    "error_message": str(e),
                    "error_context": "log_mcp_run initial processing or insert"
                }
                logger.warning(f"Attempting minimal error log after main log failure: {error_log}")
                # Consider logging this minimal error to a different table or log file
            except Exception as inner_e:
                logger.critical(f"Failed even to prepare minimal error log: {inner_e}", exc_info=True)
            return # Exit the function after logging the error

    except Exception as e:
        logger.error(f"Exception during log_mcp_run execution: {e}", exc_info=True)
        # Add more specific error context if possible
        # Try to log minimal info if main logging fails
        try:
            error_log = {
                "classification_id": classification_id,
                "mcp_name": mcp_name,
                "mcp_version": mcp_version,
                "error_message": str(e),
                "error_context": "log_mcp_run initial processing or insert"
            }
            logger.warning(f"Attempting minimal error log after main log failure: {error_log}")
            # Consider logging this minimal error to a different table or log file
        except Exception as inner_e:
            logger.critical(f"Failed even to prepare minimal error log: {inner_e}", exc_info=True)
        return # Exit the function after logging the error

def handle_mcp_result(mcp_output: MCPOutput) -> bool:
    """
    Applies the database patch specified in the MCP output.

    Args:
        mcp_output: The output dictionary from an MCP run.

    Returns:
        True if a patch was attempted (successfully or not), False if no patch was found.
    """
    if not supabase:
        logger.warning("Supabase client not initialized. Skipping MCP patch handling.")
        return False

    db_patch = mcp_output.get("_db_patch")

    if not db_patch:
        logger.info("No _db_patch found in MCP output. Skipping database update.")
        return True

    supabase_client = get_supabase_client()
    if not supabase_client:
         logger.error("Supabase client not available. Cannot apply _db_patch.")
         return False

    # Attempt to get assessment_id from the MCP output root first, if available
    # This might be useful if the patch doesn't include the Assessments table update
    assessment_id_from_output = mcp_output.get("result", {}).get("assessment_id") or \
                                mcp_output.get("debug_info", {}).get("assessment_id")

    logger.debug(f"Applying _db_patch: {json.dumps(db_patch, indent=2)} for assessment_id (from output): {assessment_id_from_output}")
    processed_assessment_id = None # Store the ID processed in the Assessments table
    try:
        for table, records in db_patch.items():
            if table == "Assessments": # Special handling for the main assessment record
                # Expecting only one record_id (assessment_id) here
                if len(records) == 1:
                    record_id = list(records.keys())[0]
                    processed_assessment_id = record_id # Store the ID
                    patch_data = records[record_id]
                    logger.info(f"Updating table '{table}', record '{record_id}' with patch: {patch_data}")
                    try:
                        supabase_client.table(table).update(patch_data).eq("id", record_id).execute()
                    except Exception as e: # Catch any exception during update
                        logger.error(f"ERROR applying _db_patch for {table}/{record_id}: {e}")
                else:
                    logger.warning(f"Expected exactly one record ID under 'Assessments' in db_patch, found {len(records)}. Skipping Assessments update.")
                continue # Move to next table after handling Assessments

            # --- Handle related tables (Products, ProductVariants, Certifications) --- 
            
            # Determine the correct assessment_id to use for relations
            # Prefer the one processed from the Assessments table patch, fallback to the one from output
            current_assessment_id = processed_assessment_id or assessment_id_from_output
            
            if not current_assessment_id:
                # Removed the premature error log. Error will be logged per-record if needed.
                # logger.error("Could not determine assessment_id. Cannot apply patches for related tables.")
                logger.warning(f"Skipping table '{table}' processing as assessment_id could not be determined.")
                continue # Skip this table if assessment_id is missing
                
            for record_id, patch_data in records.items():
                try:
                    # Copy and attempt to serialize for logging, handle potential errors
                    log_patch_str = json.dumps(patch_data, indent=2, default=str) # Use default=str for non-serializable types like datetime
                    logger.debug(f"Preparing to upsert record_id '{record_id}' into table '{table}' with data:\n{log_patch_str}")
                except Exception as log_e:
                    logger.debug(f"Preparing to upsert record_id '{record_id}' into table '{table}'. Error logging patch data: {log_e}. Raw data: {patch_data}")
                
                # Ensure assessment_id is in the patch data for related tables
                if 'assessment_id' not in patch_data:
                    patch_data['assessment_id'] = current_assessment_id
                
                # Check if assessment_id matches the one we expect
                if patch_data['assessment_id'] != current_assessment_id:
                     logger.warning(f"Mismatch: assessment_id in patch data ({patch_data['assessment_id']}) differs from expected ({current_assessment_id}) for {table}/{record_id}. Using ID from patch data.")

                logger.info(f"Upserting table '{table}', record '{record_id}' with data: {patch_data}")
                try:
                    # Define conflict columns based on table
                    conflict_columns = None
                    if table == "Products":
                        conflict_columns = "assessment_id,name"
                    elif table == "ProductVariants":
                        # Check if product_id exists; if not, cannot upsert uniquely
                        if 'product_id' in patch_data:
                             conflict_columns = "product_id,name"
                        else:
                            logger.warning(f"Missing 'product_id' for variant {record_id} in {table}. Cannot determine conflict column. Skipping upsert.")
                            continue
                    elif table == "Certifications":
                        conflict_columns = "id"

                    if conflict_columns:
                        logger.debug(f"Upserting {table}/{record_id} with on_conflict='{conflict_columns}'")
                        response = supabase_client.table(table).upsert(patch_data, on_conflict=conflict_columns).execute()
                    else:
                        # Fallback or specific handling if no conflict columns defined (e.g., just insert?)
                        logger.warning(f"No conflict columns defined for table {table}. Attempting standard upsert without on_conflict for {record_id}. This might fail or behave unexpectedly.")
                        response = supabase_client.table(table).upsert(patch_data).execute() # Attempt without on_conflict
                    
                    # Check response - upsert might return empty data on success
                    if not response.data:
                         # Changed Warning to Info - Empty data is often expected on upsert
                         logger.info(f"Upsert operation on {table}/{record_id} completed. Response data is empty (this might be expected).")
                    else:
                        logger.debug(f"Upsert response data for {table}/{record_id}: {response.data}")

                except Exception as e: # Catch specific Supabase API errors if possible, fallback to general
                    logger.error(f"ERROR upserting data for {table}/{record_id}: {e}. Data: {patch_data}")

    except Exception as e:
        logger.error(f"ERROR applying DB patch: Unexpected error - {e}")
        return False # Indicate failure on major unexpected error

    return True # Indicate that patch application was attempted

# Placeholder for future prompt templating helpers
# def format_prompt(template: str, context: dict) -> str:
#     ...

# Placeholder for token budgeting helpers
# def check_token_limit(text: str, limit: int) -> bool:
#     ...

def get_supabase_client():
    if supabase:
        return supabase
    else:
        supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if supabase_url and supabase_key:
            try:
                return create_client(supabase_url, supabase_key)
            except Exception as e:
                logger.error(f"Failed to create Supabase client: {e}")
        else:
            logger.error("Supabase URL or key not set. Cannot create client.")
        return None
