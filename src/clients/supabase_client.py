import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

def get_supabase_client() -> Client:
    """Creates and returns a Supabase client instance."""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url:
        raise ValueError("SUPABASE_URL environment variable not set.")
    if not supabase_key:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY environment variable not set.")

    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        return supabase
    except Exception as e:
        print(f"Error creating Supabase client: {e}")
        raise

# Optional: Create a global client instance if needed frequently,
# but be mindful of potential issues in concurrent environments.
# supabase_client = get_supabase_client()
