# /Users/seanking/Projects/tradewizard_4.1/src/mcps/base.py

from typing import Protocol, List, Dict, Any, Optional, TypedDict

class MCPOutput(TypedDict):
    """Standardized output structure for all MCPs."""
    result: Dict[str, Any]  # The primary structured data output of the MCP
    confidence: Optional[float] # Confidence score (0.0 to 1.0) for the result
    llm_input_prompt: Optional[str] # The exact prompt sent to the LLM (if applicable)
    llm_raw_output: Optional[str] # The raw string output from the LLM (if applicable)
    error: Optional[str] # Description of any error encountered during execution
    _db_patch: Optional[Dict[str, Dict[str, Dict[str, Any]]]] # Optional patch for Supabase
        # Structure: { "TableName": { "record_uuid": { "column_to_update": new_value } } }

# --- Standardized Output Schema for LLM Analysis ---

# Define placeholder types for nested structures (can be refined later)
class MCPProduct(TypedDict):
    # Define fields expected for a product after LLM processing
    # Corresponds roughly to Product/ProductVariant tables + enrichments
    id: Optional[str] # Existing ID if matched, or new UUID if created
    name: Optional[str]
    description: Optional[str]
    category: Optional[str] # LLM-derived category
    estimated_hs_code: Optional[str] # LLM-derived HS Code
    # Add other relevant fields like variant info, compliance flags etc.
    source_url: Optional[str] # URL where product was found
    image_url: Optional[str]

class MCPCertification(TypedDict):
    # Define fields for certifications
    id: Optional[str]
    name: Optional[str]
    required_for: Optional[List[str]] # e.g., specific products or markets
    # source: Optional[str] # Where was the certification mentioned?

class MCPContact(TypedDict):
    # Define fields for contacts
    emails: Optional[List[str]]
    phones: Optional[List[str]]
    social_links: Optional[List[Dict[str, str]]] # From scraper: {platform: string, url: string}[]

class StandardizedMCPData(TypedDict):
    """
    Standardized data structure expected after primary LLM analysis of a website.
    This structure will typically populate the 'result' field of the WebsiteAnalysisMCP's output.
    """
    summary: Optional[str] # Overall summary of the website/company
    products: List[MCPProduct] # List of products identified/confirmed by LLM
    certifications: List[MCPCertification] # List of certifications identified
    contacts: Optional[MCPContact] # Contact information
    # --- Meta fields required by checkpoint ---
    confidence_score: Optional[float] # Overall confidence in the analysis
    fallback_reason: Optional[str] # Reason if LLM failed or confidence is low
    next_best_action: Optional[str] # Suggested next step for the user/system

class BaseMCP(Protocol):
    """Base protocol for all Model Context Protocols (MCPs)."""
    name: str
    version: str

    def build_payload(self, classification: Dict[str, Any], products: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Builds the specific input payload required by the MCP's run method.

        Args:
            classification: The main classification record dictionary.
            products: A list of product dictionaries associated with the classification.

        Returns:
            A dictionary containing the data needed for the MCP's logic.
        """
        ...

    def run(self, payload: Dict[str, Any]) -> MCPOutput:
        """
        Executes the core logic of the MCP.

        Args:
            payload: The input data prepared by build_payload.

        Returns:
            An MCPOutput dictionary containing the results, confidence, potential errors,
            LLM details (if applicable), and an optional database patch.
        """
        ...

# Example Usage (for illustration, not functional code here):
# class ComplianceMCP(BaseMCP):
#     name = "compliance"
#     version = "1.0.0"
#
#     def build_payload(self, classification: Dict[str, Any], products: List[Dict[str, Any]]) -> Dict[str, Any]:
#         # ... actual logic ...
#         return {"productName": "Example Product", "targetMarket": "EU"}
#
#     def run(self, payload: Dict[str, Any]) -> MCPOutput:
#         # 1. Validate payload schema
#         # 2. Assemble prompt for LLM (or use internal logic)
#         # 3. Call LLM (or execute logic)
#         # 4. Parse result
#         # 5. Calculate confidence
#         # 6. Return structured output
#         product_name = payload.get("productName")
#         target_market = payload.get("targetMarket")
#         # ... actual logic ...
#         stub_result = {
#             "requiredCerts": ["ISO 9001", "CE Mark"],
#             "estimatedCost": 5000,
#             "estimatedTime": "3 months"
#         }
#         return {"result": stub_result, "confidence": 0.85}
