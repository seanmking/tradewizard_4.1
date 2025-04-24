import os
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

# --- LLM Configuration ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not found in environment variables. LLM calls will fail.")
    # raise ValueError("OPENAI_API_KEY environment variable not set.") # Or raise error

LLM_CONFIG = {
    "temperature": 0.2,
    "max_tokens": 1500, # Increased slightly for potentially complex product lists
    "model": os.getenv("OPENAI_MODEL_NAME", "gpt-4-turbo-preview"), # Allow overriding model via env
    "timeout_seconds": 30, # Increased timeout
    "api_key": OPENAI_API_KEY
}

USE_LLM_EXTRACTION = os.getenv("USE_LLM_EXTRACTION", False)

# --- Other Configurations (Add as needed) ---
# Example: Database URL
# DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@host:port/db")

# Example: Cache TTL
# CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "3600"))

logger.info(f"LLM Configuration loaded. Model: {LLM_CONFIG.get('model')}")
