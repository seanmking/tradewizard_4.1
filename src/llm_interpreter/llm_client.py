import os
import json
import logging
import asyncio
from typing import Dict, Any, Optional, List, Union

import openai
from openai import AsyncOpenAI, OpenAIError, RateLimitError, APITimeoutError, APIConnectionError, APIStatusError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, retry_if_exception, retry_any
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# --- Load Environment Variables ---
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- Retry Configuration --- 
# Retry on specific transient OpenAI errors or 5xx server errors.
RETRYABLE_ERRORS = (RateLimitError, APITimeoutError, APIConnectionError)

def is_retryable_status(exception: BaseException) -> bool:
    """Check if the exception is an APIStatusError with a 5xx status code."""
    return isinstance(exception, APIStatusError) and exception.status_code >= 500

# Combine retry conditions: specific error types OR 5xx status codes
retry_config = retry(
    wait=wait_exponential(multiplier=1, min=1, max=4), # 1s, 2s, 4s
    stop=stop_after_attempt(3 + 1), # Initial attempt + 3 retries = 4 total attempts
    retry=retry_any(
        retry_if_exception_type(RETRYABLE_ERRORS),
        retry_if_exception(is_retryable_status)
    ),
    before_sleep=lambda retry_state: logger.warning(
        f"Retrying OpenAI call (attempt {retry_state.attempt_number}) due to: {retry_state.outcome.exception()}"
    ),
    reraise=True # Reraise the exception if all retries fail
)

# --- LLM Client Function --- 
@retry_config
async def call_llm(
    prompt: Union[str, List[Dict[str, str]]],
    system_prompt: Optional[str] = None,
    model: str = "gpt-4-1106-preview",
    expected_format: str = "text", # Can be 'text' or 'json'
    temperature: float = 0.2,
    max_tokens: int = 2048
) -> Any: # Returns str or Dict depending on expected_format
    """Calls the OpenAI API with retry logic and handles response formatting.

    Args:
        prompt: The main user prompt (string) or a list of message dicts.
        system_prompt: An optional system message string.
        model: The OpenAI model to use.
        expected_format: 'text' to return raw string, 'json' to parse.
        temperature: The generation temperature.
        max_tokens: The maximum number of tokens to generate.

    Returns:
        The raw text response or a parsed JSON dictionary, or raises an error.
    """
    if not OPENAI_API_KEY:
        logger.error("OpenAI API key not found. Set OPENAI_API_KEY environment variable.")
        raise ValueError("OpenAI API key is not configured.")

    try:
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {e}", exc_info=True)
        raise

    # --- Construct Messages --- 
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    
    if isinstance(prompt, str):
        messages.append({"role": "user", "content": prompt})
    elif isinstance(prompt, list):
        # Assume prompt is already a list of message dicts
        # Basic validation: check if it's a list of dicts with 'role' and 'content'
        if not all(isinstance(m, dict) and 'role' in m and 'content' in m for m in prompt):
            raise ValueError("Invalid format for 'prompt' list. Expected list of {'role': str, 'content': str}.")
        messages.extend(prompt)
    else:
        raise TypeError("Invalid 'prompt' type. Expected str or List[Dict[str, str]].")

    prompt_log_snippet = json.dumps(messages)[:1000] # Truncate for logging
    logger.info(f"Calling OpenAI model '{model}' with prompt (truncated): {prompt_log_snippet}...")

    try:
        completion = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            # response_format={"type": "json_object"} # Use only if guaranteed JSON needed and model supports
        )
        
        raw_response = completion.choices[0].message.content
        response_log_snippet = (raw_response or "")[:1000] # Truncate
        logger.info(f"Received raw response from {model} (truncated): {response_log_snippet}")

        if not raw_response:
             logger.warning(f"LLM model '{model}' returned an empty response.")
             # Decide behavior: return None, empty string, or raise error?
             return None # Returning None for empty response

        # --- Handle Expected Format --- 
        if expected_format.lower() == 'json':
            # Clean the response: remove potential markdown fences and strip whitespace
            cleaned_response = raw_response.strip()
            if cleaned_response.startswith("```json") and cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[7:-3].strip() # Remove ```json and ```
            elif cleaned_response.startswith("```") and cleaned_response.endswith("```"):
                 # Handle cases where it might just be ``` ... ``` without 'json' specified
                 cleaned_response = cleaned_response[3:-3].strip()

            try:
                parsed_json = json.loads(cleaned_response) # Parse the cleaned response
                logger.info("Successfully parsed LLM response as JSON.")
                return parsed_json
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM response as JSON after cleaning. Error: {e}. Cleaned response snippet: {cleaned_response[:500]}")
                # Option 1: Raise an error
                raise ValueError(f"LLM response was not valid JSON: {e}")
                # Option 2: Return the raw string as fallback (less strict)
                # return raw_response 
        else: # expected_format == 'text' or other
            return raw_response

    except OpenAIError as e:
        # This will be caught by tenacity for retries if applicable,
        # but log it here for visibility upon final failure.
        logger.error(f"OpenAI API error after retries (if any): {type(e).__name__}: {e}", exc_info=True)
        raise # Re-raise the original OpenAIError
    except Exception as e:
        logger.error(f"Unexpected error during LLM call: {type(e).__name__}: {e}", exc_info=True)
        raise # Re-raise other exceptions

# --- Example Usage (for testing) --- 
async def _test_call_llm():
    logging.basicConfig(level=logging.INFO)
    logger.info("Testing LLM client...")
    try:
        # Test 1: Simple text prompt
        print("--- Test 1: Text Prompt ---")
        text_response = await call_llm("Explain the concept of asynchronous programming in Python in one sentence.", model="gpt-3.5-turbo")
        print(f"Text Response: {text_response}")

        # Test 2: System + User prompt, expecting JSON
        print("\n--- Test 2: JSON Prompt --- ")
        json_prompt = "List two primary colors."
        system_prompt = "You are a helpful assistant that responds in JSON format. The JSON should have a key 'colors' containing a list of strings."
        json_response = await call_llm(json_prompt, system_prompt=system_prompt, model="gpt-3.5-turbo", expected_format='json')
        print(f"JSON Response: {json.dumps(json_response, indent=2)}")
        
        # Test 3: Chat messages prompt
        print("\n--- Test 3: Chat Messages --- ")
        messages = [
             {"role": "system", "content": "You are a helpful assistant."},
             {"role": "user", "content": "What is the capital of France?"}
         ]
        chat_response = await call_llm(messages, model="gpt-3.5-turbo") # System prompt in messages overrides optional arg
        print(f"Chat Response: {chat_response}")

    except Exception as e:
        print(f"\n--- Test Failed --- ")
        print(f"Error: {e}")

if __name__ == "__main__":
    # To run this test: python -m src.llm_interpreter.llm_client
    # Make sure you have a .env file with OPENAI_API_KEY in the project root
    # or the environment variable is set.
    asyncio.run(_test_call_llm())
