from typing import Dict, Any, Callable, TYPE_CHECKING, TypedDict
from .compliance import ComplianceMCP
from .hscode import HSCodeMCP
from .website_analysis import WebsiteAnalysisMCP

if TYPE_CHECKING:
    from .base import BaseMCP # Avoid circular import

# Define the structure for the registry value
class MCPRegistryEntry(TypedDict):
    mcp_class: "BaseMCP"
    enabled_if: Callable[[Dict[str, Any]], bool]

# MCP Registry
MCP_REGISTRY: Dict[str, MCPRegistryEntry] = {
    "WebsiteAnalysisMCP": {
        "mcp_class": WebsiteAnalysisMCP(),
        # Enable if assessment is marked llm_ready and has structured raw_content
        "enabled_if": lambda assessment: assessment.get("llm_ready", False) and \
                         isinstance(assessment.get("raw_content"), dict) and \
                         "aggregated_products" in assessment.get("raw_content", {})
    },
    "ComplianceMCP": {
        "mcp_class": ComplianceMCP(),
        # Example: Enable if status requires compliance check or is in final review
        # TODO: Update this based on actual workflow status fields
        "enabled_if": lambda classification: classification.get("status") in ["compliance", "review"]
    },
    "HSCodeMCP": {
        "mcp_class": HSCodeMCP(),
        # Example: Enable if status requires HS coding or is in final review
        # TODO: Update this based on actual workflow status fields
        "enabled_if": lambda classification: classification.get("status") in ["hs_coding", "review"]
    }
    # Add other MCPs here as they are developed
}

def get_active_mcps(classification: Dict[str, Any]) -> Dict[str, 'BaseMCP']:
    """Returns a dictionary of active MCP instances based on the classification data."""
    active_mcps = {}
    logger.debug(f"Checking MCP activation for assessment ID: {classification.get('id')}, Status: {classification.get('status')}, LLM Ready: {classification.get('llm_ready')}") # More detailed debug
    for name, entry in MCP_REGISTRY.items():
        try:
            is_enabled = entry["enabled_if"](classification)
            if is_enabled:
                active_mcps[name] = entry["mcp_class"]
                logger.info(f"MCP '{name}' ENABLED for assessment {classification.get('id')}")
            else:
                 logger.debug(f"MCP '{name}' disabled for assessment {classification.get('id')}") # Debug level for disabled
        except Exception as e:
            logger.error(f"Error evaluating enabled_if condition for MCP '{name}': {e}", exc_info=True)
             # Optionally disable the MCP on error, or let it potentially run if logic is flawed?
             # For now, we'll just log the error and skip enabling it.

    if not active_mcps:
        logger.warning(f"No MCPs were enabled for assessment {classification.get('id')}. Check MCP registry conditions and assessment status/data.")

    return active_mcps

# Add basic logging configuration if not already present globally
import logging
logging.basicConfig(level=logging.INFO) # Ensure logger is configured
logger = logging.getLogger(__name__)
