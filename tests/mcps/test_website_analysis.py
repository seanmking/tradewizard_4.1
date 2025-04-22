# tests/mcps/test_website_analysis.py

import pytest
import json
import os
from unittest.mock import patch, MagicMock, ANY
from typing import Dict, Any

# Assuming StandardizedMCPData and related types are accessible
# Adjust the import path as necessary based on your project structure
from src.mcps.base import StandardizedMCPData, MCPOutput, MCPProduct, MCPCertification, MCPContact
from src.mcps.website_analysis import WebsiteAnalysisMCP
from src.mcps.registry import MCP_REGISTRY  # To get the class if needed
from openai._base_client import SyncHttpxClientWrapper

# Store the original wrapper to call it
_original_sync_httpx_client_wrapper = SyncHttpxClientWrapper

def mock_sync_httpx_client_wrapper_no_proxies(*args, **kwargs):
    """A wrapper for SyncHttpxClientWrapper that removes the 'proxies' kwarg."""
    kwargs.pop('proxies', None) # Remove proxies if it exists, do nothing otherwise
    # Call the original initializer with the cleaned arguments
    return _original_sync_httpx_client_wrapper(*args, **kwargs)

# Sample input data for testing
SAMPLE_PAYLOAD = {
    "assessment_id": "test_assessment_123",
    "raw_content": {
        "url": "http://example.com",
        "title": "Example Domain",
        # Corrected: Use 'mainContent' key to match implementation
        "mainContent": "This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.",
        "metadata": {"description": "Example domain for examples."},
        "links": [{"text": "More information...", "href": "https://www.iana.org/domains/example"}],
        # Add other relevant fields if your scraper provides them
    },
    "classification": {"status": "ready_for_llm"} # Example classification
}

# Minimal payload to pass the first check in run()
MINIMAL_SAMPLE_PAYLOAD = {
    'scraper_data': {'url': 'http://example.com'}, # Must be non-empty dict
    'assessment_id': 'test-assessment-minimal'
    # 'error' key must not be present
}

# --- Fixtures (Optional but good practice) ---

@pytest.fixture
def mcp_instance():
    """Provides an instance of the WebsiteAnalysisMCP."""
    # Ensure dotenv loads test environment variables if necessary
    # from dotenv import load_dotenv
    # load_dotenv(".env.test") # Example if you have a test env file
    return WebsiteAnalysisMCP()

# --- Test Cases ---

def test_mcp_registration():
    """Verify that the MCP is registered correctly."""
    assert "WebsiteAnalysisMCP" in MCP_REGISTRY
    # Corrected: Check if the stored item is an INSTANCE of the class
    assert isinstance(MCP_REGISTRY["WebsiteAnalysisMCP"]["mcp_class"], WebsiteAnalysisMCP)

def test_construct_system_prompt(mcp_instance):
    """Test the system prompt construction."""
    system_prompt = mcp_instance._construct_system_prompt()
    assert "You are an expert business analyst" in system_prompt
    assert "JSON object" in system_prompt
    # Corrected: Check for a required field name instead of the type name
    assert '"confidence_score"' in system_prompt # Check for the field name in quotes
    # Add more specific checks based on your actual system prompt content

def test_construct_user_prompt(mcp_instance):
    """Test the user prompt construction."""
    user_prompt = mcp_instance._construct_user_prompt(SAMPLE_PAYLOAD["raw_content"])
    assert "### Website Metadata ###" in user_prompt
    assert "Example Domain" in user_prompt # Check if title is included
    # Corrected: Check for a smaller part of the text likely in an excerpt
    assert "illustrative examples" in user_prompt # Check if excerpt text is included
    # Corrected: Check if the actual metadata VALUE is present
    assert SAMPLE_PAYLOAD["raw_content"]["metadata"]["description"] in user_prompt
    assert "iana.org" in user_prompt # Check if link href is included

# --- More tests to be added for run method, API mocking, error handling etc. ---

# --- Test for Run Method ---

# Define a sample successful LLM output (as a JSON string)
MOCK_LLM_RESPONSE_JSON = json.dumps({
    "summary": "Mock summary.",
    "products": [
        {"name": "Product A", "category": "Cat 1", "estimated_hs_code": "1111.11"},
        {"name": "Product B", "category": "Cat 2"}
    ],
    "certifications": [
        {"name": "Cert X", "required_for": ["US", "CA"]}
    ],
    "contacts": {"email": "test@example.com"},
    "confidence_score": 0.85,
    "fallback_reason": None,
    "next_best_action": "Review Products"
})

@patch('src.mcps.website_analysis.load_dotenv')
@patch('openai.resources.chat.completions.Completions.create')
# Patch the problematic HTTP client wrapper initialization directly
@patch('openai._base_client.SyncHttpxClientWrapper', new=mock_sync_httpx_client_wrapper_no_proxies)
def test_run_method_success(mock_openai_create, mock_load_dotenv, mcp_instance): # Order matches decorators bottom-up
    """Test the run method with a successful API call and valid JSON response."""

    # Mock the successful API response structure
    mock_choice = MagicMock()
    mock_choice.message.content = MOCK_LLM_RESPONSE_JSON
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]
    mock_openai_create.return_value = mock_completion

    # Simplify env var patching - just need the API key now
    env_vars_to_patch = {
        'OPENAI_API_KEY': 'fake_api_key',
    }
    # Use patch.dict within the test for environment variables
    with patch.dict(os.environ, env_vars_to_patch, clear=True):
        # Execute the run method
        result: MCPOutput = mcp_instance.run(MINIMAL_SAMPLE_PAYLOAD)

        # Assertions
        mock_openai_create.assert_called_once() # Should be called now
        assert result['status'] == 'success'
        assert result['error'] is None
        # Assuming StandardizedMCPData is the type hint for result['result']
        assert isinstance(result['result'], dict) # Check it's a dict
        parsed_expected = json.loads(MOCK_LLM_RESPONSE_JSON)
        # Check some key fields match the mocked response
        assert result['result']['summary'] == parsed_expected['summary']
        assert result['result']['products'] == parsed_expected['products']
        # Check confidence score processing
        assert result['result']['confidence_score'] == parsed_expected['confidence_score']
        # Check other MCPOutput fields
        assert result['confidence'] > 0 # Should be derived from result['result']['confidence_score']
        assert result['_db_patch'] is not None # Ensure db_patch is generated
        assert 'summary' in result['_db_patch'] # Check if patch contains expected keys
        assert 'products' in result['_db_patch']
        assert result['llm_input_prompt'] is not None
        assert result['llm_raw_output'] == MOCK_LLM_RESPONSE_JSON
        mock_load_dotenv.assert_called_once()

        # --- Validate _db_patch Structure ---
        patch_data = result['_db_patch']
        assert patch_data is not None
        # Check presence of keys from LLM output (matching MOCK_LLM_RESPONSE_JSON)
        assert patch_data['summary'] == parsed_expected['summary']
        assert patch_data['products'] == parsed_expected['products']
        assert patch_data['certifications'] == parsed_expected['certifications']
        assert patch_data['contacts'] == parsed_expected['contacts']
        # Check metadata fields added by the MCP
        assert 'llm_processed_at' in patch_data
        assert isinstance(patch_data['llm_processed_at'], str) # Should be ISO string
        assert patch_data['llm_ready'] is False # Verify it's set to False
        assert patch_data['llm_status'] == 'processed'
        # Ensure other fields from standardized_result are also present if needed
        assert patch_data['confidence_score'] == parsed_expected['confidence_score']

@patch('src.mcps.website_analysis.load_dotenv')
def test_run_method_no_api_key(mock_load_dotenv, mcp_instance):
    """Test the run method when the OpenAI API key is missing."""
    with patch.dict(os.environ, {}, clear=True): # Ensure key is NOT present
        result: MCPOutput = mcp_instance.run(MINIMAL_SAMPLE_PAYLOAD)

        assert result['status'] == 'error'
        assert result['error'] == "OpenAI API key is not configured."
        # Change assertion to check 'result' key
        assert result['result'] == {}
        assert result['_db_patch'] is None
        mock_load_dotenv.assert_called_once() # load_dotenv should still be called here
