# /Users/seanking/Projects/tradewizard_4.1/src/llm_interpreter/interpreter.py

import os
import json
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI # Assuming OpenAI, change if needed (e.g., Anthropic)

# --- Configuration & Setup ---

# Load environment variables from .env file at the project root
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Supabase Client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") # Use service role key
supabase: Client = None
if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Supabase URL or Service Key not found in environment variables.")
else:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}", exc_info=True)

# LLM Client (OpenAI example)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
llm_client = None
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not found in environment variables. LLM processing disabled.")
else:
    try:
        llm_client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI client initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {e}", exc_info=True)

# Target Supabase Table
ASSESSMENTS_TABLE = os.getenv("SUPABASE_TABLE_NAME", "Assessments")
MIN_RAW_CONTENT_LENGTH = 1000 # Minimum characters required in raw_content

# --- Core Functions ---

def fetch_assessments_for_llm():
    """
    Fetches records from the Assessments table that are ready for LLM processing.
    Looks for records where llm_ready = true, is_mock = false, and raw_content is not null.
    """
    if not supabase:
        logger.error("Supabase client not initialized. Cannot fetch assessments.")
        return []

    try:
        response = supabase.table(ASSESSMENTS_TABLE)\
                           .select("id, raw_content, is_mock")\
                           .eq("llm_ready", True)\
                           .eq("is_mock", False)\
                           .not_.is_("raw_content", "null")\
                           .execute()

        if response.data:
            logger.info(f"Fetched {len(response.data)} assessments ready for LLM processing.")
            return response.data
        else:
            logger.info("No non-mock assessments found ready for LLM processing.")
            return []
    except Exception as e:
        logger.error(f"Error fetching assessments from Supabase: {e}", exc_info=True)
        return []

def generate_llm_prompt(raw_content: str) -> str:
    """
    Creates the prompt to send to the LLM, instructing it to parse the raw_content
    into the desired MCPData JSON structure.
    (Includes placeholder for per-field confidence)
    """
    # TODO: Refine this prompt template significantly, especially for per-field confidence
    prompt = f"""
    Analyze the following raw text content scraped from a company website and extract the specified information into a structured JSON format.

    **Raw Content:**
    --- START ---
    {raw_content}
    --- END ---

    **Desired JSON Output Structure:**
    {{
      "summary": "string (Brief company overview, 1-2 sentences)",
      "products": [
        {{ "name": "string", "category": "string (optional)", "estimated_hs_code": "string (optional)", "confidence": "float (0.0-1.0)", "source": "string (e.g., 'Extracted from product section')" }}
      ],
      "certifications": [
        {{ "name": "string", "required_for": ["string (optional country/region code)"], "confidence": "float (0.0-1.0)", "source": "string" }}
      ],
      "contacts": {{
        "email": "string (optional)", "confidence_email": "float",
        "phone": "string (optional)", "confidence_phone": "float",
        "address": "string (optional)", "confidence_address": "float"
      }},
      "social_links": {{
        "facebook": "string (optional URL)", "confidence_facebook": "float",
        "instagram": "string (optional URL)", "confidence_instagram": "float",
        "youtube": "string (optional URL)", "confidence_youtube": "float",
        "linkedin": "string (optional URL)", "confidence_linkedin": "float",
        "twitter": "string (optional URL)", "confidence_twitter": "float",
        "other": ["string (optional URL)"]
      }},
      "confidence_score": "float (Estimate overall confidence 0.0-1.0)"
    }}

    **Instructions:**
    1. Extract relevant information *only* from the Raw Content.
    2. If information is missing, omit the field or use null/empty values.
    3. Include a `confidence` score (0.0-1.0) for each product, certification, and optionally for contact/social fields, reflecting certainty of the extraction.
    4. Include a `source` description for products/certifications where possible.
    5. Provide an overall `confidence_score`.
    6. Output *only* the JSON object.

    **JSON Output:**
    """
    return prompt.strip()

def call_llm_interpreter(prompt: str, assessment_id: str): # Added assessment_id for logging
    """
    Sends the prompt to the configured LLM API and returns the structured response.
    """
    if not llm_client:
        logger.error(f"[{assessment_id}] LLM client not initialized. Cannot call interpreter.")
        return None

    try:
        logger.info(f"[{assessment_id}] Calling LLM API...")
        response = llm_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert data extraction assistant. Output structured JSON based on the user's schema."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=2048,
            response_format={ "type": "json_object" }
        )

        llm_output_raw = response.choices[0].message.content
        logger.debug(f"[{assessment_id}] Raw LLM Response:\n{llm_output_raw}")

        parsed_data = json.loads(llm_output_raw)
        logger.info(f"[{assessment_id}] Successfully parsed LLM response JSON.")
        # Log confidence score if present
        overall_confidence = parsed_data.get('confidence_score')
        if overall_confidence is not None:
             logger.info(f"[{assessment_id}] LLM reported overall confidence: {overall_confidence}")
        else:
             logger.warning(f"[{assessment_id}] LLM response missing overall 'confidence_score'.")

        return parsed_data

    except json.JSONDecodeError as json_err:
        logger.error(f"[{assessment_id}] Failed to decode JSON from LLM response: {json_err}", exc_info=True)
        logger.error(f"[{assessment_id}] LLM Raw Output: {llm_output_raw}")
        return None
    except Exception as e:
        logger.error(f"[{assessment_id}] Error calling LLM API: {e}", exc_info=True)
        return None

def update_assessment_with_llm_data(assessment_id: str, parsed_data: dict):
    """
    Updates the Supabase assessment record with the structured data from the LLM.
    Sets llm_ready to false and adds a timestamp.
    """
    if not supabase:
        logger.error(f"[{assessment_id}] Supabase client not initialized. Cannot update assessment.")
        return False
    if not parsed_data:
        logger.error(f"[{assessment_id}] Parsed data is empty. Cannot update assessment.")
        return False

    update_payload = parsed_data.copy()
    update_payload['llm_ready'] = False
    update_payload['llm_processed_at'] = datetime.now(timezone.utc).isoformat()
    update_payload['fallback_reason'] = None # Clear any previous fallback reason on success

    if 'id' in update_payload:
        del update_payload['id']

    try:
        logger.info(f"[{assessment_id}] Attempting to update Supabase record...")
        response = supabase.table(ASSESSMENTS_TABLE)\
                           .update(update_payload)\
                           .eq("id", assessment_id)\
                           .execute()

        if hasattr(response, 'error') and response.error:
             logger.error(f"[{assessment_id}] Supabase update failed: {response.error}")
             # Log details
             if hasattr(response.error, 'message'): logger.error(f"[{assessment_id}] Error Message: {response.error.message}")
             if hasattr(response.error, 'details'): logger.error(f"[{assessment_id}] Error Details: {response.error.details}")
             return False
        elif response.data:
            logger.info(f"[{assessment_id}] Successfully updated assessment with LLM data.")
            return True
        else:
            logger.warning(f"[{assessment_id}] Supabase update executed but returned no data. Check if ID exists.")
            return False

    except Exception as e:
        logger.error(f"[{assessment_id}] Error updating Supabase: {e}", exc_info=True)
        return False

def update_assessment_with_error(assessment_id: str, reason: str):
    """Marks an assessment as failed LLM processing."""
    if not supabase:
        logger.error(f"[{assessment_id}] Supabase client not initialized. Cannot mark assessment as failed.")
        return False

    update_payload = {
        'llm_ready': False, # Stop retrying for now
        'fallback_reason': reason,
        'llm_processed_at': datetime.now(timezone.utc).isoformat()
    }
    try:
        logger.warning(f"[{assessment_id}] Marking assessment as failed LLM processing. Reason: {reason}")
        response = supabase.table(ASSESSMENTS_TABLE)\
                           .update(update_payload)\
                           .eq("id", assessment_id)\
                           .execute()
        # Basic check, could add more detail
        if hasattr(response, 'error') and response.error:
             logger.error(f"[{assessment_id}] Failed to mark assessment as failed in Supabase: {response.error}")
             return False
        else:
             return True
    except Exception as e:
        logger.error(f"[{assessment_id}] Error marking assessment as failed in Supabase: {e}", exc_info=True)
        return False


def process_single_assessment(assessment: dict):
    """Processes a single assessment record fetched from Supabase with checks."""
    assessment_id = assessment.get("id")
    raw_content = assessment.get("raw_content")
    is_mock = assessment.get("is_mock", False) # Default to False if field is missing

    if not assessment_id:
        logger.warning(f"Skipping assessment due to missing ID: {assessment}")
        return False # Indicate failure/skip

    # --- Data Integrity Checks ---
    if is_mock:
        logger.info(f"[{assessment_id}] Skipping: Record marked as mock (is_mock=true).")
        # Optionally mark llm_ready=false here if mock records shouldn't be re-queued
        update_assessment_with_error(assessment_id, "Skipped: Mock Record")
        return False
    if not raw_content or len(raw_content.strip()) < MIN_RAW_CONTENT_LENGTH:
        reason = f"Skipped: Raw content missing or too short ({len(raw_content.strip()) if raw_content else 0} chars, required {MIN_RAW_CONTENT_LENGTH})."
        logger.warning(f"[{assessment_id}] {reason}")
        update_assessment_with_error(assessment_id, reason)
        return False
    # --- End Checks ---

    logger.info(f"Processing assessment ID: {assessment_id} (is_mock={is_mock}, content_length={len(raw_content.strip())})")

    # 1. Generate Prompt
    prompt = generate_llm_prompt(raw_content)
    logger.debug(f"[{assessment_id}] Generated Prompt (truncated):\n{prompt[:500]}...")

    # 2. Call LLM
    parsed_data = call_llm_interpreter(prompt, assessment_id)

    # 3. Update Supabase
    if parsed_data:
        # TODO: Add validation logic for parsed_data structure/content here
        logger.info(f"[{assessment_id}] LLM processing successful. Updating Supabase...")
        success = update_assessment_with_llm_data(assessment_id, parsed_data)
        return success
    else:
        reason = "LLM call failed or returned invalid JSON."
        logger.error(f"[{assessment_id}] {reason}")
        update_assessment_with_error(assessment_id, reason)
        # TODO: Implement retry logic if desired
        return False

# --- Main Execution Logic ---

def run_interpreter_batch():
    """Fetches and processes a batch of assessments."""
    logger.info("--- Starting LLM Interpreter Batch Run ---")
    assessments_to_process = fetch_assessments_for_llm()

    if not assessments_to_process:
        logger.info("No valid assessments to process in this batch.")
    else:
        logger.info(f"Attempting to process {len(assessments_to_process)} assessments...")

        processed_count = 0
        succeeded_count = 0
        failed_count = 0 # Includes skips and errors
        for assessment in assessments_to_process:
            assessment_id = assessment.get('id', 'N/A')
            processed_count += 1
            try:
                success = process_single_assessment(assessment)
                if success:
                    succeeded_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                logger.error(f"[{assessment_id}] Unhandled exception during processing: {e}", exc_info=True)
                failed_count += 1
                update_assessment_with_error(assessment_id, f"Unhandled Exception: {e}")

        logger.info(f"Batch Summary: Processed={processed_count}, Succeeded={succeeded_count}, Failed/Skipped={failed_count}")

    logger.info("--- Finished LLM Interpreter Batch Run ---")


if __name__ == "__main__":
    run_interpreter_batch()
