import logging
import sys

def setup_logging(level=logging.INFO):
    """
    Configures basic logging to stream to stdout.
    """
    # Get the root logger
    logger = logging.getLogger()
    logger.setLevel(level)

    # Remove existing handlers to avoid duplicates if called multiple times
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # Create a handler that writes log records to stderr (or stdout)
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)

    # Create a formatter and set it for the handler
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    # Add the handler to the root logger
    logger.addHandler(handler)

    # Optionally, set specific levels for libraries if needed
    # logging.getLogger("urllib3").setLevel(logging.WARNING)

if __name__ == '__main__':
    # Example usage if run directly
    setup_logging(logging.DEBUG)
    logging.debug("Debug message")
    logging.info("Info message")
    logging.warning("Warning message")
    logging.error("Error message")
    logging.critical("Critical message")
