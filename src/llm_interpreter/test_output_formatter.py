import logging
import json
from output_formatter import format_mcp_results

def test_format_mcp_results():
    # Simulate assessment and MCP outputs
    assessment = {
        "id": "test-assessment-1",
        "source_url": "https://example.com",
        "products": [
            {"id": "p1", "name": "Widget", "description": "A useful widget", "category": "Tools", "certifications": ["ISO9001"]},
            {"id": "p2", "name": "Gadget", "description": "A fancy gadget", "category": "Electronics", "certifications": []}
        ],
        "raw_content": json.dumps({
            "description": "This is a summary from raw_content.",
            "mainContent": "Contact us at info@example.com or +1234567890.",
            "aggregated_products": [
                {"name": "Raw Widget", "description": "Extracted widget", "category": "Raw Tools"}
            ]
        }),
        "llm_processed_at": "2025-05-01T10:00:00Z"
    }
    mcp_outputs = {
        "HSCodeMCP": {
            "result": {
                "products": {
                    "p1": {"suggestedHSCode": "1234.56", "name": "Widget", "description": "A useful widget", "category": "Tools"},
                    "p2": {"suggestedHSCode": "7890.12", "name": "Gadget", "description": "A fancy gadget", "category": "Electronics"}
                }
            },
            "confidence": 0.9
        },
        "WebsiteAnalysisMCP": {
            "result": {
                "products": [
                    {"name": "Site Widget", "description": "Widget from website", "category": "Site Tools"}
                ],
                "summary": "Website summary from MCP.",
                "contacts": {"email": "web@example.com"}
            },
            "confidence": 0.8
        },
        "ComplianceMCP": {
            "result": {
                "required_certs": ["CE", "RoHS"]
            },
            "confidence": 0.85
        }
    }
    logging.basicConfig(level=logging.DEBUG)
    output = format_mcp_results(assessment, mcp_outputs)
    print("\n--- FORMATTED MCP RESULTS ---")
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    test_format_mcp_results()
