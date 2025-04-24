import yaml
import logging
from pathlib import Path
from typing import Dict, Any
from functools import lru_cache

logger = logging.getLogger(__name__)

PROMPT_DIR = Path(__file__).parent / "templates"


class PromptManager:
    """Manages loading and building prompts from YAML templates."""
    
    def __init__(self):
        """Initializes the PromptManager."""
        logger.info(f"PromptManager initialized. Templates will be loaded on demand from: {PROMPT_DIR}")
        self._template_cache: Dict[str, Dict] = {} 

    @lru_cache(maxsize=10) 
    def _load_template(self, prompt_id: str) -> dict:
        """Loads a specific prompt template YAML file by its ID.
        
        Args:
            prompt_id: The identifier of the prompt (e.g., 'product_extraction_v1').
            
        Returns:
            The loaded template content as a dictionary.
            
        Raises:
            FileNotFoundError: If the template file doesn't exist.
            yaml.YAMLError: If the file is not valid YAML.
        """
        filename = f"{prompt_id}.yaml"
        path = PROMPT_DIR / filename
        logger.debug(f"Attempting to load prompt template: {path}")
        if not path.exists():
            logger.error(f"Prompt template file not found: {path}")
            raise FileNotFoundError(f"Prompt template not found: {path}")
        try:
            with open(path, "r", encoding="utf-8") as f:
                template_data = yaml.safe_load(f)
                if not isinstance(template_data, dict):
                    raise yaml.YAMLError(f"Template file {filename} did not load as a dictionary.")
                logger.info(f"Successfully loaded prompt template: {prompt_id}")
                return template_data
        except yaml.YAMLError as e:
            logger.error(f"Error parsing YAML template {filename}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error loading template {filename}: {e}")
            raise

    def build_prompt(self, prompt_id: str, **kwargs: Any) -> str:
        """Builds a prompt string by formatting a loaded template with provided arguments.

        Args:
            prompt_id: The ID of the template to use (e.g., 'product_extraction_v1').
            **kwargs: Keyword arguments to fill the placeholders in the template's content.

        Returns:
            The fully formatted prompt string.
            
        Raises:
            FileNotFoundError: If the template file cannot be found.
            KeyError: If a required placeholder in the template is not provided in kwargs.
            TypeError: If the loaded template content is not a string.
        """
        try:
            template_data = self._load_template(prompt_id)
            template_content = template_data.get("content")

            if not template_content:
                logger.error(f"Template '{prompt_id}' is missing the 'content' field.")
                raise KeyError(f"Template '{prompt_id}' is missing the 'content' field.")
            
            if not isinstance(template_content, str):
                 logger.error(f"Template '{prompt_id}' content field is not a string (type: {type(template_content)}). Check YAML structure.")
                 raise TypeError(f"Template '{prompt_id}' content field must be a string.")

            formatted_prompt = template_content.format(**kwargs)
            logger.debug(f"Successfully built prompt using template: {prompt_id}")
            return formatted_prompt.strip()
        
        except FileNotFoundError:
            raise
        except KeyError as e:
            logger.error(f"Missing required placeholder '{e}' in arguments for template '{prompt_id}'. Provided args: {list(kwargs.keys())}")
            raise KeyError(f"Missing required placeholder {e} for template '{prompt_id}'.") from e
        except Exception as e:
            logger.error(f"Failed to build prompt '{prompt_id}': {e}", exc_info=True)
            raise

# Example Usage:
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    manager = PromptManager()
    try:
        prompt = manager.build_prompt(
            prompt_id="product_extraction_v1", 
            page_content="<html>Example HTML here...</html>", 
            website_url="https://example.com"
        )
        print("\n--- Built Prompt ---")
        print(prompt)
        print("--------------------\n")
    except (FileNotFoundError, KeyError, TypeError) as e:
        print(f"Error building prompt: {e}")
