# /Users/seanking/Projects/tradewizard_4.1/src/mcps/helpers.py

import logging
import datetime
import os
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
        return False

    assessment_id = mcp_output.get("assessment_id") # Get assessment_id for foreign key
    if not assessment_id:
        logger.error("Could not find assessment_id in MCP output. Cannot apply patches requiring it.")
        # Decide if this is a critical error or just prevents certain patches
        # For now, let's prevent proceeding if assessment_id is missing and needed.
        # return False # Option: Stop if assessment_id missing

    logger.info(f"Applying _db_patch: {db_patch} for assessment {assessment_id}")
    success = True
    try:
        for table, data in db_patch.items(): # Rename 'updates' to 'data' for clarity
            # Check if the data is a list (indicating insertion)
            if isinstance(data, list):
                if data: # Only insert if the list is not empty
                    # --- Modification Start ---
                    # If inserting into extracted_products, ensure assessment_id is added
                    if table == "extracted_products":
                        if not assessment_id:
                            logger.error(f"Cannot insert into '{table}' without assessment_id.")
                            success = False # Mark as failed for this table
                            continue # Skip this table
                        
                        # Add assessment_id to each record
                        for record in data:
                            if isinstance(record, dict):
                                record['assessment_id'] = assessment_id
                            else:
                                logger.warning(f"Skipping non-dict item in list for table '{table}': {record}")
                        # Filter out any non-dict items just in case
                        data_to_insert = [r for r in data if isinstance(r, dict)]
                        if not data_to_insert:
                            logger.warning(f"No valid dict records found to insert into '{table}' after filtering.")
                            continue # Skip if nothing valid left
                    else:
                        data_to_insert = data # Use original data for other tables
                    # --- Modification End ---

                    logger.info(f"Inserting {len(data_to_insert)} records into table '{table}'...")
                    insert_response = supabase.table(table).insert(data_to_insert).execute()
                    # Add basic logging for insert response
                    logger.debug(f"Insert response for {table}: {insert_response.data}")
                    if not insert_response.data:
                         logger.warning(f"Possible issue inserting into {table}. Response data is empty.")
                else:
                    logger.info(f"Skipping insert for table '{table}' as data list is empty.")
            # Assume it's a dictionary for updates otherwise
            elif isinstance(data, dict):
                for record_id, patch_data in data.items():
                    if patch_data: # Only update if there's data
                        logger.info(f"Updating table '{table}', record '{record_id}' with patch: {patch_data}")
                        logger.debug(f"Supabase update payload for {table}/{record_id}: {patch_data}")
                        update_response = supabase.table(table).update(patch_data).eq("id", record_id).execute()
                        logger.debug(f"Update response for {table}/{record_id}: {update_response.data}")
                        if not update_response.data:
                            logger.warning(f"Possible issue updating {table}/{record_id}. Response data is empty.")
                    else:
                         logger.info(f"Skipping update for table '{table}', record '{record_id}' as patch data is empty.")
            else:
                 logger.warning(f"Skipping patch for table '{table}'. Unexpected data type: {type(data)}")

    except Exception as e:
        logger.error(f"Error applying _db_patch: {e}", exc_info=True)
        success = False # Indicate patch application failed

    return success # Return whether patch application was attempted

# Placeholder for future prompt templating helpers
# def format_prompt(template: str, context: dict) -> str:
#     ...

# Placeholder for token budgeting helpers
# def check_token_limit(text: str, limit: int) -> bool:
#     ...
