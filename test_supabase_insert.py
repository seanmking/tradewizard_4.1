# test_supabase_insert.py
import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables from .env file in the current directory
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Check if keys were loaded
if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment.")
    print("Make sure your .env file is in the correct directory and contains these variables.")
else:
    print(f"Using Supabase URL: {url}")
    print(f"Using Supabase Key: {key[:10]}...") # Print only the start of the key for verification

    try:
        # Initialize Supabase client
        supabase = create_client(url, key)

        # Data to insert
        data = {
            "id": f"test-insert-{os.urandom(4).hex()}", # Unique ID for each test
            "llm_ready": True,
            "raw_content": {"test_data": "This is a test insert from script"}
        }

        # Attempt to insert data into the 'Assessments' table
        print(f"Attempting to insert into 'Assessments': {data}")
        response = supabase.table("Assessments").insert(data).execute()

        # Check response
        if response.data:
            print("Insert successful!")
            print("Response:", response.data)
        else:
            print("Insert failed.")
            # Attempt to print error details if available
            if hasattr(response, 'error') and response.error:
                print("Error details:", response.error)
            else:
                 print("No specific error details returned by Supabase client.")


    except Exception as e:
        print(f"An error occurred during Supabase interaction: {e}")
