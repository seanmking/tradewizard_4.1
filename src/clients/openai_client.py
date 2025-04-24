import openai
import json
import logging
from src.config import LLM_CONFIG

logger = logging.getLogger(__name__)

# --- Response Wrapper --- 
# This ensures the client returns an object with a .json() method, 
# matching the interface expected by LLMService.
class OpenAIResponseWrapper:
    def __init__(self, content: str):
        self._raw_content = content
        self._data = None
        
        # --- Strip potential markdown fences --- 
        cleaned_content = content.strip()
        if cleaned_content.startswith("```json"):
            cleaned_content = cleaned_content[7:] # Remove ```json
        if cleaned_content.startswith("```"):
             cleaned_content = cleaned_content[3:] # Remove ```
        if cleaned_content.endswith("```"):
            cleaned_content = cleaned_content[:-3] # Remove ```
        cleaned_content = cleaned_content.strip() # Strip again after removal
        # --------------------------------------
        
        try:
            # Attempt to parse the cleaned content as JSON
            self._data = json.loads(cleaned_content)
            logger.debug("Successfully parsed LLM JSON response.")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}. Cleaned content: '{cleaned_content[:100]}...'", exc_info=True)
            # Fallback: return an empty list or dict based on common use case? 
            # For product extraction, list is expected.
            self._data = [] 
        except Exception as e:
            logger.error(f"Unexpected error parsing LLM response: {e}. Raw content: '{content[:100]}...'", exc_info=True)
            self._data = []

    def json(self):
        """Returns the parsed JSON data (or fallback)."""
        return self._data

    @property
    def raw_content(self) -> str:
        """Returns the original raw string content from the LLM."""
        return self._raw_content

# --- OpenAI Client --- 

class OpenAIClient:
    """Client for interacting with the OpenAI API (v1+ SDK)."""
    def __init__(self):
        if not LLM_CONFIG.get("api_key"):
            raise ValueError("OpenAI API key not configured in LLM_CONFIG.")
        # Initialize the official OpenAI client
        # The API key is automatically picked up from the environment or openai.api_key
        self.client = openai.OpenAI(api_key=LLM_CONFIG["api_key"])
        logger.info("OpenAIClient initialized.")

    def chat(self, prompt: str, config: dict):
        """Sends a prompt to the OpenAI ChatCompletion endpoint.

        Args:
            prompt: The user prompt content.
            config: Dictionary containing model, temperature, max_tokens, timeout.

        Returns:
            An OpenAIResponseWrapper instance containing the parsed JSON data or fallback.
        """
        model = config.get("model", "gpt-4-turbo-preview")
        temperature = config.get("temperature", 0.2)
        max_tokens = config.get("max_tokens", 1500)
        timeout = config.get("timeout_seconds", 30)

        # TODO: The system prompt should ideally come from the PromptManager 
        #       or be configurable, not hardcoded here.
        system_message = "You are an expert product classification agent. You extract product names, descriptions, and other structured data from messy website content. Return ONLY valid JSON conforming to the requested schema."
        
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ]

        logger.info(f"Sending request to OpenAI model: {model}")
        logger.debug(f"OpenAI Request Messages: {messages}") # Be careful logging full prompts if sensitive

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=timeout,
                # response_format={ "type": "json_object" } # Consider forcing JSON mode if model supports
            )
            
            # Extract content
            content = response.choices[0].message.content
            if content is None:
                logger.warning("OpenAI response content is None.")
                content = "[]" # Default to empty JSON array string

            logger.debug(f"Raw OpenAI Response Content: {content[:200]}...")
            # Wrap the raw content string for parsing and interface compatibility
            return OpenAIResponseWrapper(content)

        except openai.APITimeoutError as e:
            logger.error(f"OpenAI API request timed out: {e}")
            raise # Re-raise or handle as needed
        except openai.APIConnectionError as e:
            logger.error(f"OpenAI API connection error: {e}")
            raise
        except openai.APIStatusError as e:
             logger.error(f"OpenAI API returned an error status: {e.status_code} - {e.response}")
             raise
        except openai.OpenAIError as e:
            logger.error(f"An unexpected OpenAI error occurred: {e}")
            raise
        except Exception as e:
            logger.error(f"An unexpected error occurred in OpenAIClient.chat: {e}", exc_info=True)
            raise # Re-raise the exception after logging
