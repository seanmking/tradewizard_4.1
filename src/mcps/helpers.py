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

    log_entry = {
        "classification_id": classification_id,
        "mcp_name": mcp_name,
        "mcp_version": mcp_version,
        "payload": payload, # Keep the original input payload
        "mcp_output": result, # Map the 'result' variable to the 'mcp_output' column
    }

    # Filter out None values before insertion
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

    logger.info(f"Applying _db_patch: {db_patch}")
    success = True
    try:
        for table, updates in db_patch.items():
            for record_id, patch_data in updates.items():
                logger.info(f"Updating table '{table}', record '{record_id}' with patch: {patch_data}")
                update_response = supabase.table(table).update(patch_data).eq("id", record_id).execute()
                # Basic check: Supabase client v2 might not return count as reliably
                # Consider more robust checks if needed based on response structure
                logger.debug(f"Update response for {table}/{record_id}: {update_response.data}")
                if not update_response.data:
                    logger.warning(f"Possible issue updating {table}/{record_id}. Response data is empty.")
                    # Depending on requirements, you might set success = False here

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
