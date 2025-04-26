# /Users/seanking/Projects/tradewizard_4.1/scheduler.py

import schedule
import time
import logging
import os
from dotenv import load_dotenv

# Configure logging to file and console
log_file = os.path.join(os.path.dirname(__file__), 'scheduler.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file at the project root
# This ensures the interpreter module has access to necessary vars like Supabase/API keys
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
loaded = load_dotenv(dotenv_path=dotenv_path, override=True)
if loaded:
    logger.info("Scheduler: .env file loaded successfully.")
else:
    logger.warning("Scheduler: .env file not found or failed to load. Ensure it exists at the project root.")

# Attempt to import the batch runner from the interpreter module
try:
    # Adjust the import path based on your project structure if needed
    # Assuming scheduler.py is at the root and interpreter.py is in src/llm_interpreter
    from src.llm_interpreter.interpreter import run_interpreter_batch
    interpreter_available = True
    logger.info("Scheduler: Successfully imported run_interpreter_batch from interpreter module.")
except ImportError as e:
    logger.error(f"Scheduler: Failed to import run_interpreter_batch: {e}. Interpreter automation disabled.")
    interpreter_available = False
except Exception as e:
    logger.error(f"Scheduler: An unexpected error occurred during import: {e}")
    interpreter_available = False

def scheduled_job():
    """Wrapper function to call the interpreter batch job and handle errors."""
    if not interpreter_available:
        logger.warning("Scheduler: Skipping job run because interpreter module is not available.")
        return

    logger.info("Scheduler: Starting scheduled interpreter batch run...")
    try:
        run_interpreter_batch() # Call the function imported from interpreter.py
        logger.info("Scheduler: Interpreter batch run finished.")
    except Exception as e:
        logger.error(f"Scheduler: An error occurred during scheduled_job execution: {e}", exc_info=True)

# --- Schedule Configuration ---
# Read interval from environment variable, default to 5 minutes
POLLING_INTERVAL_MINUTES = int(os.getenv('INTERPRETER_POLLING_INTERVAL_MINUTES', '5'))
logger.info(f"Scheduler: Running interpreter batch every {POLLING_INTERVAL_MINUTES} minutes.")

# Schedule the job
# schedule.every(POLLING_INTERVAL_MINUTES).minutes.do(scheduled_job)
# Use a more robust way for the first run and subsequent schedules
schedule.every(POLLING_INTERVAL_MINUTES).minutes.do(scheduled_job)

# --- Main Loop ---
def main():
    logger.info("Scheduler: Starting main loop. Press Ctrl+C to exit.")
    # Run the job once immediately on startup if the interpreter is available
    if interpreter_available:
        logger.info("Scheduler: Performing initial run of the interpreter batch job...")
        scheduled_job()
    else:
        logger.warning("Scheduler: Skipping initial run as interpreter module is not available.")

    while True:
        try:
            schedule.run_pending()
            time.sleep(60) # Check for pending jobs every 60 seconds
        except KeyboardInterrupt:
            logger.info("Scheduler: KeyboardInterrupt received. Shutting down...")
            break
        except Exception as e:
            logger.error(f"Scheduler: An error occurred in the main loop: {e}", exc_info=True)
            # Avoid busy-looping on continuous errors
            time.sleep(300) # Wait 5 minutes before retrying after an error in the loop

if __name__ == "__main__":
    main()
