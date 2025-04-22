# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html

import logging
import json
import os
from postgrest.exceptions import APIError
from dotenv import load_dotenv
from itemadapter import ItemAdapter
from supabase import create_client, Client
from scrapy.exceptions import DropItem
from .items import ScrapySmeScraperItem # Import the updated item

# Determine the project root path (assuming pipelines.py is 3 levels down from .env)
# The .env file is in /Users/seanking/Projects/tradewizard_4.1/
# __file__ is in /Users/seanking/Projects/tradewizard_4.1/scraping/scrapy_sme_scraper/scrapy_sme_scraper/
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
dotenv_path = os.path.join(project_root, '.env')

# Load environment variables from .env file
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
    logging.info(f".env file loaded from: {dotenv_path}")
else:
    logging.warning(f".env file not found at: {dotenv_path}. Relying on system environment variables.")

logger = logging.getLogger(__name__)

class SupabasePipeline:

    def __init__(self, supabase_url, supabase_key, supabase_table):
        if not supabase_url or supabase_url == "your-supabase-url-from-env":
            raise ValueError("SUPABASE_URL not set in Scrapy settings or environment")
        if not supabase_key or supabase_key == "your-supabase-service-role-key-from-env":
             # Use service role key for backend operations like this
            raise ValueError("SUPABASE_KEY (service role key) not set in Scrapy settings or environment")
        if not supabase_table:
            raise ValueError("SUPABASE_TABLE_NAME not set in Scrapy settings or environment")

        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.supabase_table = supabase_table
        self.client: Client | None = None
        logger.info("SupabasePipeline initialized.")

    @classmethod
    def from_crawler(cls, crawler):
        # Get settings from Scrapy settings.py
        # You might need to load from environment variables if preferred, e.g., using os.getenv()
        supabase_url = crawler.settings.get('SUPABASE_URL', os.getenv('SUPABASE_URL'))
        supabase_key = crawler.settings.get('SUPABASE_KEY', os.getenv('SUPABASE_KEY')) # Use service role key
        supabase_table = crawler.settings.get('SUPABASE_TABLE_NAME', os.getenv('SUPABASE_TABLE_NAME', 'assessments'))

        return cls(
            supabase_url=supabase_url,
            supabase_key=supabase_key,
            supabase_table=supabase_table
        )

    def open_spider(self, spider):
        # Connect to Supabase when the spider opens
        try:
            self.client = create_client(self.supabase_url, self.supabase_key)
            logger.info("Supabase client created successfully.")
        except Exception as e:
            logger.error(f"Failed to create Supabase client: {e}", exc_info=True)
            self.client = None # Ensure client is None if connection fails

    def close_spider(self, spider):
        # Clean up resources if needed (Supabase client doesn't require explicit close)
        logger.info("SupabasePipeline closing.")
        pass

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        item_dict = adapter.asdict() # Convert Item to dict
        assessment_id = item_dict.get('assessment_id', 'Unknown_ID')

        if not isinstance(item, ScrapySmeScraperItem):
            logger.warning(f"Item is not an instance of ScrapySmeScraperItem: {type(item)}. Skipping processing for assessment_id: {assessment_id}")
            return item # Or raise DropItem if this should not happen

        if not assessment_id:
            logger.error("Item missing assessment_id. Dropping item.")
            raise DropItem("Missing assessment_id")

        payload = None # Initialize payload to None
        try:
            # 1. Define the explicit mapping from Item fields to DB columns
            field_to_column_map = {
                'assessment_id': 'id', # Map item's assessment_id to DB's 'id' column
                'source_url': 'source_url',
                'companyName': 'company',
                'about': 'summary',
                'products': 'products',
                'certifications': 'certifications',
                'contacts': 'contacts',
                'socialLinks': 'social_links',
                'other_links': 'other_links',
                'images': 'images',
                'rawContent': 'raw_content',
                'confidence': 'confidence_score',
                'llm_ready': 'llm_ready',
                'fallback_reason': 'fallback_reason'
            }

            # 2. Prepare the payload dictionary
            json_columns = ['products', 'contacts', 'social_links', 'other_links', 'images', 'certifications']
            payload = {}
            for field_name, column_name in field_to_column_map.items():
                if field_name in item_dict and item_dict[field_name] is not None:
                    value = item_dict[field_name]
                    # Explicitly serialize if the target column is expected to be JSON/JSONB
                    if column_name in json_columns:
                        try:
                            payload[column_name] = json.dumps(value)
                        except TypeError as json_err:
                            logger.error(f"JSON serialization failed for field '{field_name}' (column '{column_name}'): {json_err}. Value type: {type(value)}. Dropping item.", exc_info=True)
                            raise DropItem(f"JSON serialization failed for {column_name}") from json_err
                    else:
                         # Assign directly for non-JSON columns (text, int, float, boolean, etc.)
                         payload[column_name] = value
                # else: # Optionally set missing fields to None/NULL if needed
                #     payload[column_name] = None

            # 3. Ensure primary key 'id' is in the payload
            if 'id' not in payload:
                logger.error(f"Mapped primary key 'id' missing from final payload for assessment_id: {assessment_id}. Dropping item.")
                raise DropItem("Missing primary key ('id') in final payload")

            # 4. Perform the upsert operation
            response = self.client.table(self.supabase_table).upsert(payload).execute()

            # Note: By default, supabase-py's upsert uses the primary key defined in the table
            # for conflict resolution. We don't *need* to specify `on_conflict='id'` unless
            # we want to be extremely explicit or handle conflicts on a different column.

            # 5. Basic Response Check (Adjust based on observed response structure)
            # Check for common success/error indicators in Supabase responses
            # This might need refinement based on the actual response format from `supabase-py`
            has_data = hasattr(response, 'data') and response.data
            has_error = hasattr(response, 'error') and response.error

            if has_data and not has_error:
                logger.info(f"Successfully upserted/updated item for assessment_id: {assessment_id}")
            elif has_error:
                logger.error(f"Supabase upsert FAILED for assessment_id: {assessment_id}. Error: {response.error}")
                # Log specific details if available (adjust based on actual error object structure)
                if hasattr(response.error, 'message'): logger.error(f"Error Message: {response.error.message}")
                if hasattr(response.error, 'details'): logger.error(f"Error Details: {response.error.details}")
                if hasattr(response.error, 'hint'): logger.error(f"Error Hint: {response.error.hint}")
                if hasattr(response.error, 'code'): logger.error(f"Error Code: {response.error.code}")
                raise DropItem(f"Supabase upsert failed: {response.error}")
            else:
                # Handle unexpected response formats (no data and no error explicitly)
                logger.warning(f"Supabase response format UNEXPECTED for assessment_id: {assessment_id}. Assuming success cautiously.")
                # Decide if this should be treated as success or failure
                # Depending on strictness, you might raise DropItem here.
                pass 

            return item

        # --- ENHANCED EXCEPTION LOGGING --- 
        except DropItem as e:
            # Re-raise DropItem to ensure Scrapy handles it
            logger.warning(f"Item explicitly dropped for assessment_id {assessment_id}: {e}")
            raise e
        except json.JSONDecodeError as e:
             logger.error(f"JSON serialization error during payload prep for assessment_id {assessment_id}: {e}", exc_info=True)
             logger.error(f"Item data causing error: {item_dict}")
             raise DropItem(f"JSON serialization error: {e}") from e
        except APIError as e:
             logger.error(f"Supabase API Error for assessment_id {assessment_id}: Message: {e.message}", exc_info=True)
             # Attempt to log details if available
             if hasattr(e, 'details'): logger.error(f"APIError Details: {e.details}")
             if hasattr(e, 'hint'): logger.error(f"APIError Hint: {e.hint}")
             if hasattr(e, 'code'): logger.error(f"APIError Code: {e.code}")
             raise DropItem(f"Supabase API Error: {e.message}") from e
        except Exception as e:
             logger.error(f"Unexpected error processing item for assessment_id {assessment_id}: {e}", exc_info=True) # Log traceback
             logger.error(f"Item data (if available): {item_dict}")
             raise DropItem(f"Unexpected error in pipeline: {e}") from e
        # --- END ENHANCED EXCEPTION LOGGING ---