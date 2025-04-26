import os
import time
import json
import logging
from supabase import create_client
import openai
from dotenv import load_dotenv
import argparse  # for CLI override

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

assert SUPABASE_URL and SUPABASE_KEY and OPENAI_API_KEY, "Missing environment configuration."

# Initialize clients
sb = create_client(SUPABASE_URL, SUPABASE_KEY)
# Configure OpenAI key
openai.api_key = OPENAI_API_KEY

# Setup logging
log_file = os.path.join(os.path.dirname(__file__), '..', 'interpreter.log')
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)

# Constants
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds
BATCH_SIZE = 5
POLL_INTERVAL = 5  # seconds

# System prompt defining JSON extraction schema
SYSTEM_PROMPT = """
You are an LLM data extraction assistant. Given raw website content, output ONLY valid JSON with the following fields:
{
  "summary": "string",
  "products": [
    { "name": "string", "category": "string", "estimated_hs_code": "string" }
  ],
  "certifications": [
    { "name": "string", "required_for": ["string"] }
  ],
  "contacts": {
    "email": "string",
    "phone": "string",
    "address": "string"
  }
}
If no extractable content is found, do NOT apologize or ask questions. Instead, return valid JSON with empty values:
{
  "summary": "",
  "products": [],
  "certifications": [],
  "contacts": { "email": "", "phone": "", "address": "" }
}
"""

def process_assessment(record: dict) -> None:
    assessment_id = record.get("id")
    raw_content = record.get("raw_content", "")
    logging.info(f"Processing assessment {assessment_id}...")

    # Test mode shortcut: auto-complete dummy data without calling OpenAI
    if record.get("test_mode"):
        logging.info(f"Test mode enabled for {assessment_id}, populating dummy data.")
        dummy_output = {
            "summary": "Test mode summary",
            "products": [],
            "certifications": [],
            "contacts": {"email": "", "phone": "", "address": ""}
        }
        update_data = {
            **dummy_output,
            "status": "completed",
            "llm_ready": False,
            "fallback_reason": None,
            "llm_processed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        sb.table("Assessments").update(update_data).eq("id", assessment_id).execute()
        logging.info(f"Assessment {assessment_id} test mode processed.")
        return

    try:
        # Retry loop for LLM call
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = openai.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": raw_content}
                    ]
                )
                raw_text = response.choices[0].message.content
                logging.info(f"LLM raw response: {raw_text}")
                parsed_output = json.loads(raw_text)
                break
            except Exception as e:
                logging.warning(f"Attempt {attempt} failed: {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY * attempt)
                    continue
                else:
                    raise

        # Validate required fields
        for field in ["summary", "products", "certifications", "contacts"]:
            if field not in parsed_output:
                raise ValueError(f"Missing expected field: {field}")

        # Prepare update
        update_data = {
            **parsed_output,
            "status": "completed",
            "llm_ready": False,
            "fallback_reason": None,
            "llm_processed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

        # Update Supabase
        sb.table("Assessments").update(update_data).eq("id", assessment_id).execute()
        logging.info(f"Assessment {assessment_id} successfully updated.")

    except Exception as e:
        logging.error(f"Error processing assessment {assessment_id}: {e}")
        sb.table("Assessments").update({
            "status": "error",
            "llm_ready": False,
            "fallback_reason": str(e)
        }).eq("id", assessment_id).execute()

def run_interpreter_batch() -> None:
    """Process a single batch of assessments ready for LLM processing."""
    result = (
        sb.table("Assessments")
          .select("id, raw_content, test_mode")
          .eq("llm_ready", True)
          .not_.is_("raw_content", None)
          .limit(BATCH_SIZE)
          .execute()
    )
    records = result.data or []
    for record in records:
        process_assessment(record)

def main_loop() -> None:
    logging.info("Starting LLM Interpreter Service...")
    while True:
        try:
            result = (
                sb.table("Assessments")
                  .select("id, raw_content, test_mode")
                  .eq("llm_ready", True)
                  .not_.is_("raw_content", None)
                  .limit(BATCH_SIZE)
                  .execute()
            )
            records = result.data or []
            if not records:
                logging.info("No assessments ready. Sleeping...")
            for record in records:
                process_assessment(record)
        except Exception as e:
            logging.error(f"Unexpected error in main loop: {e}")
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LLM Interpreter Service")
    parser.add_argument("--id", dest="process_id", help="Assessment ID to process once and exit")
    parser.add_argument("--batch", action="store_true", help="Process a batch and exit")
    args = parser.parse_args()
    if args.process_id:
        logging.info(f"Processing single assessment via CLI: {args.process_id}")
        res = sb.table("Assessments").select("id, raw_content, test_mode").eq("id", args.process_id).execute()
        recs = res.data or []
        if recs:
            process_assessment(recs[0])
        else:
            logging.error(f"No assessment found with id {args.process_id}")
    elif args.batch:
        logging.info("Processing batch via CLI")
        run_interpreter_batch()
    else:
        main_loop()
