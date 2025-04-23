import os
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---
ASSESSMENT_ID = "573afb47-7bda-4117-a6fc-8cdf21fff6c8"
# -------------------

def get_supabase_client() -> Client | None:
    """Initializes and returns the Supabase client."""
    load_dotenv()
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        logger.error("Supabase URL or Key not found in environment variables.")
        return None

    try:
        supabase: Client = create_client(url, key)
        logger.info("Supabase client initialized successfully.")
        return supabase
    except Exception as e:
        logger.error(f"Error initializing Supabase client: {e}")
        return None

def main():
    supabase = get_supabase_client()
    if not supabase:
        return

    logger.info(f"Resetting llm_ready=True for Assessment ID: {ASSESSMENT_ID}")

    try:
        update_data = {"llm_ready": True, "llm_status": "pending"}
        response = supabase.table("Assessments") \
                         .update(update_data) \
                         .eq("id", ASSESSMENT_ID) \
                         .execute()

        # Check if the update was successful (Supabase update returns count in data)
        if response.data:
            logger.info(f"✅ Successfully reset Assessment {ASSESSMENT_ID}. Response: {response.data}")
        else:
            # Handle cases where the ID might not exist or another issue occurred
            logger.warning(f"⚠️ Assessment {ASSESSMENT_ID} not found or update failed. Response: {response}")
            if hasattr(response, 'error') and response.error:
                 logger.error(f"Supabase error: {response.error}")

    except Exception as e:
        logger.error(f"❌ Error updating assessment: {e}", exc_info=True)

if __name__ == "__main__":
    main()
