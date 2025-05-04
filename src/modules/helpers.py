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

def log_mcp_run(
    mcp_name: str,
    mcp_version: str,
    payload: Dict[str, Any],
    result: Optional[Dict[str, Any]] = None,
    confidence: Optional[float] = None,
    llm_input_prompt: Optional[str] = None,
    llm_raw_output: Optional[str] = None,
    error: Optional[str] = None,
    started_at: datetime.datetime = None,
    completed_at: datetime.datetime = None,
    classification_id: Optional[str] = None,
    supabase_client: Client = supabase,
) -> None:
    """Logs the details of an MCP execution to the 'mcp_runs' table in Supabase.

    Args:
        supabase_client: Initialized Supabase client instance.
        mcp_name: Name of the MCP.
        mcp_version: Version of the MCP.
        payload: Input payload given to the MCP.
        result: Structured result from the MCP (or None if error).
        confidence: Confidence score from the MCP (or None if error/not applicable).
        llm_input_prompt: Prompt sent to LLM, if any.
        llm_raw_output: Raw output from LLM, if any.
        error: Error message if the MCP run failed.
        started_at: Timestamp when the MCP execution started.
        completed_at: Timestamp when the MCP execution completed.
        classification_id: Optional ID of the related Classification session.
    """
    if not started_at:
        started_at = datetime.datetime.now(datetime.timezone.utc) # Default if not provided
    if not completed_at:
         completed_at = datetime.datetime.now(datetime.timezone.utc) # Assume completion now if not given

    # Construct the comprehensive output object to be stored in the 'mcp_output' column
    mcp_output_data = {
        "result": result,
        "confidence": confidence,
        "llm_input_prompt": llm_input_prompt,
        "llm_raw_output": llm_raw_output,
        "error": error,
        "started_at": started_at.isoformat() if started_at else None,
        "completed_at": completed_at.isoformat() if completed_at else None,
    }

    # Filter out None values from the mcp_output_data
    mcp_output_data = {k: v for k, v in mcp_output_data.items() if v is not None}

    log_entry = {
        "classification_id": classification_id,
        "mcp_name": mcp_name,
        "mcp_version": mcp_version,
        "payload": payload, # Keep the original input payload
        "mcp_output": mcp_output_data, # Store the comprehensive object
        # Note: Supabase client automatically adds created_at
    }

    # Filter out None values from the main log_entry (specifically for classification_id)
    log_entry = {k: v for k, v in log_entry.items() if v is not None}

    try:
        response = supabase_client.table("mcp_runs").insert(log_entry).execute()
        logger.info(f"Successfully logged MCP run for {mcp_name} v{mcp_version}.")
        # Optional: Check response for errors if needed
        # if response.error:
        #     logger.error(f"Supabase error logging MCP run: {response.error}")

    except Exception as e:
        logger.error(f"Failed to log MCP run for {mcp_name} v{mcp_version} to Supabase: {e}", exc_info=True)

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
    success = True
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
                        logger.error(f"Error applying _db_patch for {table}/{record_id}: {e}")
                        success = False
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
                # Ensure assessment_id is in the patch data for related tables
                if 'assessment_id' not in patch_data:
                    patch_data['assessment_id'] = current_assessment_id
                
                # Check if assessment_id matches the one we expect
                if patch_data['assessment_id'] != current_assessment_id:
                     logger.warning(f"Mismatch: assessment_id in patch data ({patch_data['assessment_id']}) differs from expected ({current_assessment_id}) for {table}/{record_id}. Using ID from patch data.")

                logger.info(f"Upserting table '{table}', record '{record_id}' with data: {patch_data}")
                try:
                    # Use upsert to handle both inserts and updates
                    response = supabase_client.table(table).upsert(patch_data).execute()
                    
                    # Check response - upsert might return empty data on success
                    if not response.data:
                         # Changed Warning to Info - Empty data is often expected on upsert
                         logger.info(f"Upsert operation on {table}/{record_id} completed. Response data is empty (this might be expected).")
                    else:
                        logger.debug(f"Upsert response data for {table}/{record_id}: {response.data}")

                except Exception as e: # Catch specific Supabase API errors if possible, fallback to general
                    logger.error(f"Error upserting data for {table}/{record_id}: {e}")
                    success = False

    except Exception as e:
        logger.error(f"General error applying _db_patch: {e}", exc_info=True)
        success = False
    return success # Return whether patch application was attempted

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
