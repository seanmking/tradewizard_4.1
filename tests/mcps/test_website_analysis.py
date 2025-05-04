# tests/mcps/test_website_analysis.py

import pytest
import json
import os
from unittest.mock import patch, MagicMock, AsyncMock
from typing import Dict, Any

# Assuming StandardizedMCPData and related types are accessible
# Adjust the import path as necessary based on your project structure
from modules.base import MCPOutput
from modules.website_analysis import WebsiteAnalysisMCP
from modules.registry import MCP_REGISTRY  # To get the class if needed
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
    "crawler_data": {
        "metadata": {
            "assessment_id": "test_assessment_123",
            "url": "http://example.com",
            "timestamp": "2024-01-01T12:00:00Z",
            "crawl_status": "success",
            "title": "Example Domain",
            "description": "Example domain for examples.",
            "contact_info": {"emails": [], "phones": [], "addresses": [], "social_links": []},
            "confidence_score": 0.85
        },
        "aggregated_products": [
            {"name": "Example Product 1", "price": "$10.00", "description": "First example product.", "category": "Widgets"},
            {"name": "Example Product 2", "price": "$25.50", "description": "Second example product.", "category": "Gadgets"}
        ],
        "pages": [
            {
                "url": "http://example.com",
                "title": "Example Domain",
                "text_content": "Example Domain... This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.",
                "links": [{"href": "http://www.iana.org/domains/example", "text": "More information..."}]
            }
        ]
    },
    "trigger_crawler": False # Explicitly false
}

# Minimal payload to pass the first check in run()
MINIMAL_SAMPLE_PAYLOAD = {
    'crawler_data': {'url': 'http://example.com'}, # Must be non-empty dict
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

@pytest.fixture
def sample_payload():
    """Provides a sample payload matching the expected input structure for the run method, now using crawler_data."""
    return {
        "assessment_id": "test_assessment_123",
        "url": "http://example.com", # Added for completeness
        # Use 'crawler_data' key now
        "crawler_data": { 
            "metadata": {
                "assessment_id": "test_assessment_123",
                "url": "http://example.com",
                "timestamp": "2024-01-01T12:00:00Z",
                "crawl_status": "success",
                "title": "Example Domain",
                "description": "Example domain for examples.",
                "contact_info": {"emails": [], "phones": [], "addresses": [], "social_links": []},
                "confidence_score": 0.85
            },
            "aggregated_products": [
                {"name": "Example Product 1", "price": "$10.00", "description": "First example product.", "category": "Widgets"},
                {"name": "Example Product 2", "price": "$25.50", "description": "Second example product.", "category": "Gadgets"}
            ],
            "pages": [
                {
                    "url": "http://example.com",
                    "title": "Example Domain",
                    "text_content": "Example Domain... This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.",
                    "links": [{"href": "http://www.iana.org/domains/example", "text": "More information..."}]
                }
            ]
        },
        "trigger_crawler": False # Explicitly false
    }

# --- Test Cases ---

def test_mcp_registration(mcp_instance):
    """Verify that the MCP is registered correctly."""
    assert "WebsiteAnalysisMCP" in MCP_REGISTRY
    # Corrected: Check if the stored item is an INSTANCE of the class
    assert isinstance(MCP_REGISTRY["WebsiteAnalysisMCP"]["mcp_class"], WebsiteAnalysisMCP)

# def test_construct_system_prompt(mcp_instance):
#     """Test the system prompt construction."""
#     system_prompt = mcp_instance._construct_system_prompt()
#     assert "You are an expert business analyst" in system_prompt
#     assert "JSON object" in system_prompt
#     # Corrected: Check for a required field name instead of the type name
#     assert '"confidence_score"' in system_prompt # Check for the field name in quotes
#     # Add more specific checks based on your actual system prompt content

# def test_construct_user_prompt(mcp_instance):
#     """Test the user prompt construction."""
#     user_prompt = mcp_instance._construct_user_prompt(SAMPLE_PAYLOAD["crawler_data"])
#     assert "### Website Metadata ###" in user_prompt
#     assert "Example Domain" in user_prompt # Check if title is included
#     # Corrected: Check for a smaller part of the text likely in an excerpt
#     assert "illustrative examples" in user_prompt # Check if excerpt text is included
#     # Corrected: Check if the actual metadata VALUE is present
#     assert SAMPLE_PAYLOAD["crawler_data"]["metadata"]["description"] in user_prompt
#     assert "iana.org" in user_prompt # Check if link href is included

# --- More tests to be added for run method, API mocking, error handling etc. ---

# --- Test for Run Method ---

# Define a sample successful LLM output (as a JSON string)
MOCK_LLM_RESPONSE_DICT = {
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
}

MOCK_LLM_RESPONSE_JSON = json.dumps(MOCK_LLM_RESPONSE_DICT)

@pytest.mark.asyncio
@patch('modules.website_analysis.load_dotenv') # Keep this patch
@patch('modules.website_analysis.call_llm') # Correct patch target
@patch('os.getenv') # Add patch for os.getenv
async def test_run_method_success(mock_os_getenv, mock_call_llm, mock_load_dotenv, mcp_instance, sample_payload): # Added sample_payload fixture
    """Test the run method with a successful API call and valid JSON response."""

    # Configure mock_os_getenv to return the fake API key
    def getenv_side_effect_success(key, default=None):
        if key == 'OPENAI_API_KEY':
            return 'fake_api_key' # Simulate key presence
        return os.environ.get(key, default)
    mock_os_getenv.side_effect = getenv_side_effect_success

    # Mock the successful API response structure
    mock_call_llm.return_value = MOCK_LLM_RESPONSE_DICT 

    # Execute the run method
    result: MCPOutput = await mcp_instance.run(sample_payload) # Use the full payload

    # Assertions
    mock_call_llm.assert_called_once()
    mock_load_dotenv.assert_called_once() # load_dotenv should be called by run
    mock_os_getenv.assert_called() # os.getenv should be called by run

    # Check the output status and structure
    assert result['status'] == 'completed' # Check for 'completed'
    assert result['error'] is None
    assert isinstance(result['result'], dict)
    parsed_expected = MOCK_LLM_RESPONSE_DICT
    # Check some key fields match the mocked response
    assert result['result']['summary'] == parsed_expected['summary']
    assert result['result']['products'] == parsed_expected['products']
    # Check confidence score processing
    assert result['result']['confidence_score'] == parsed_expected['confidence_score']
    assert result['result'].get('next_best_action') == parsed_expected.get('next_best_action') # Check if exists
    assert result['result'].get('fallback_reason') == parsed_expected.get('fallback_reason') # Check if exists
    # Check _db_patch structure
    assert isinstance(result['_db_patch'], dict)
    assert 'Assessments' in result['_db_patch']
    assert 'extracted_products' in result['_db_patch'] # Assuming LLM adds products

    # --- Validate _db_patch Structure ---
    patch_data = result['_db_patch']
    assert patch_data is not None
    assessment_id = sample_payload['assessment_id']
    # Check presence of keys from LLM output within the patch structure
    assert patch_data['Assessments'][assessment_id]['llm_summary'] == parsed_expected['summary']
    assert patch_data['Assessments'][assessment_id]['llm_confidence_score'] == parsed_expected['confidence_score']
    assert patch_data['Assessments'][assessment_id]['llm_status'] == 'completed'
    # Assuming the LLM products overwrite/are stored in extracted_products in the patch
    assert patch_data['extracted_products'] == parsed_expected['products']

@pytest.mark.asyncio
@patch('modules.website_analysis.load_dotenv') # Add this patch back
@patch('os.getenv') # Patch os.getenv directly
async def test_run_method_no_api_key(mock_os_getenv, mock_load_dotenv, mcp_instance, sample_payload): # Added sample_payload
    """Test the run method when the OpenAI API key is missing."""
    # Configure mock_os_getenv to return None for OPENAI_API_KEY
    def getenv_side_effect_no_key(key, default=None):
        if key == 'OPENAI_API_KEY':
            return None # Simulate key absence
        return os.environ.get(key, default)
    mock_os_getenv.side_effect = getenv_side_effect_no_key

    # Await the call
    result: MCPOutput = await mcp_instance.run(sample_payload) # Use the full payload

    assert result['status'] == 'error'
    # Check the specific error message returned by the run method
    assert result['error'] == "OpenAI API key not configured" # Check exact error message
    # Change assertion to check 'result' key
    assert result['result'] == {}
    # Check that the db_patch was still created and status set to pending
    assessment_id = sample_payload['assessment_id']
    assert isinstance(result['_db_patch'], dict)
    assert result['_db_patch']['Assessments'][assessment_id]['llm_status'] == 'pending'
    mock_load_dotenv.assert_called_once() # load_dotenv is called at the start
    mock_os_getenv.assert_called() # Verify os.getenv was called for the key check
