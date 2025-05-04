import pytest
from unittest.mock import patch, MagicMock
import uuid
from modules.helpers import handle_mcp_result
from modules.base import MCPOutput

@patch('mcps.helpers.supabase', new_callable=MagicMock)
def test_handle_mcp_result_applies_patch(mock_supabase_client):
    product_id = str(uuid.uuid4())
    table_name = "Products"
    patch_data = {
        "compliance_data": {
            "required_certs": ["TEST"],
            "estimated_cost": 100,
            "estimated_time": "1 day",
            "mcp_confidence": 0.99,
            "mcp_version": "1.0.1"
        }
    }
    mcp_output = MCPOutput(
        result={},
        confidence=0.99,
        _db_patch={
            table_name: {
                product_id: patch_data
            }
        },
        llm_input_prompt=None,
        llm_raw_output=None,
        error=None
    )
    mock_table = MagicMock()
    mock_update_query = MagicMock()
    mock_eq_query = MagicMock()
    mock_execute_result = MagicMock()
    mock_execute_result.data = [{'id': product_id}]
    mock_supabase_client.table.return_value = mock_table
    mock_table.update.return_value = mock_update_query
    mock_update_query.eq.return_value = mock_eq_query
    mock_eq_query.execute.return_value = mock_execute_result
    result = handle_mcp_result(mcp_output)
    assert result is True
    mock_supabase_client.table.assert_called_once_with(table_name)
    mock_table.update.assert_called_once_with(patch_data)
    mock_update_query.eq.assert_called_once_with("id", product_id)
    mock_eq_query.execute.assert_called_once()

@patch('mcps.helpers.supabase', new_callable=MagicMock)
def test_handle_mcp_result_no_patch(mock_supabase_client):
    mcp_output_none = MCPOutput(
        result={}, confidence=0.8, _db_patch=None,
        llm_input_prompt=None, llm_raw_output=None, error=None
    )
    mcp_output_missing = MCPOutput(
        result={}, confidence=0.8,
        llm_input_prompt=None, llm_raw_output=None, error=None
    )
    result_none = handle_mcp_result(mcp_output_none)
    assert result_none is False
    mock_supabase_client.table.assert_not_called()
