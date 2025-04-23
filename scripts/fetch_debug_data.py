import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# --- Configuration ---
ASSESSMENT_ID = "573afb47-7bda-4117-a6fc-8cdf21fff6c8"
MCP_NAME = "website_analysis"
# -------------------

def get_supabase_client() -> Client | None:
    """Initializes and returns the Supabase client."""
    load_dotenv()
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        print("Error: Supabase URL or Key not found in environment variables.")
        return None

    try:
        supabase: Client = create_client(url, key)
        print("Supabase client initialized successfully.")
        return supabase
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
        return None

def main():
    supabase = get_supabase_client()
    if not supabase:
        return

    print(f"\n--- Fetching data for Assessment ID: {ASSESSMENT_ID} ---")

    # 1. Fetch raw_content from Assessments
    raw_content = None
    try:
        response = supabase.table("Assessments") \
                         .select("raw_content") \
                         .eq("id", ASSESSMENT_ID) \
                         .single() \
                         .execute()
        if response.data:
            raw_content = response.data.get("raw_content")
            print("✅ Fetched raw_content from Assessments.")
        else:
            print(f"❌ Assessment {ASSESSMENT_ID} not found.")
            return # Cannot proceed without assessment

    except Exception as e:
        print(f"❌ Error fetching assessment: {e}")
        return

    # 2. Fetch latest MCP run data
    llm_input_prompt = None
    llm_raw_output = None
    try:
        response = supabase.table("mcp_runs") \
                         .select("mcp_output") \
                         .eq("classification_id", ASSESSMENT_ID) \
                         .eq("mcp_name", MCP_NAME) \
                         .order("created_at", desc=True) \
                         .limit(1) \
                         .maybe_single() \
                         .execute()

        if response.data:
            mcp_output_data = response.data.get("mcp_output")
            if mcp_output_data:
                # mcp_output is stored as JSONB, but might be returned as a string
                # Safely parse it if it's a string
                if isinstance(mcp_output_data, str):
                    try:
                        mcp_output_data = json.loads(mcp_output_data)
                    except json.JSONDecodeError:
                        print("❌ Error: Could not parse mcp_output JSON string.")
                        mcp_output_data = None # Reset to avoid attribute errors

                if isinstance(mcp_output_data, dict):
                    print("✅ Fetched mcp_output dictionary:")
                    # Print the entire dictionary for debugging
                    print(json.dumps(mcp_output_data, indent=2))

                    llm_input_prompt = mcp_output_data.get("llm_input_prompt")
                    llm_raw_output = mcp_output_data.get("llm_raw_output")
                    if llm_input_prompt and llm_raw_output:
                         print("✅ Extracted llm_input_prompt and llm_raw_output from mcp_output.")
                    else:
                         print("⚠️ Could not extract llm_input_prompt or llm_raw_output from mcp_output dictionary (keys might be missing).")
                else:
                    print("❌ Error: mcp_output is not in the expected dictionary format after parsing.")
            else:
                print("❌ Warning: mcp_output field is empty in the latest mcp_runs record.")
        else:
            print(f"❌ No mcp_runs record found for MCP '{MCP_NAME}' and Assessment {ASSESSMENT_ID}.")

    except Exception as e:
        print(f"❌ Error fetching mcp_runs: {e}")

    # 3. Print the fetched data
    print("\n--- Phase 1 Data --- Lo")

    print("\n----- 1. Raw Content (from Assessments) -----")
    print(raw_content or "Not found or error fetching.")

    print("\n----- 2. LLM Input Prompt (from mcp_runs) -----")
    print(llm_input_prompt or "Not found or error fetching.")

    print("\n----- 3. Raw LLM Response (from mcp_runs) -----")
    print(llm_raw_output or "Not found or error fetching.")

    print("\n--- End of Data --- Lo")


if __name__ == "__main__":
    main()
