# /Users/seanking/Projects/tradewizard_4.1/src/mcps/__init__.py
"""Model Context Protocol (MCP) package.

This package contains modular, pluggable components (MCPs) that encapsulate
domain-specific logic, often involving LLM interactions, for TradeWizard.

Interpreter.py discovers and executes MCPs based on an explicit registry.
"""

from typing import Dict, Type

# Import the base class to make it easily accessible
from .base import BaseMCP, MCPOutput

# Import specific MCP implementations here
from .compliance import ComplianceMCP
from .hscode import HSCodeMCP

# Import helpers
from .helpers import log_mcp_run, handle_mcp_result

# Import registry
from .registry import MCP_REGISTRY, get_active_mcps

# --- MCP Registration ---
# Explicitly register available MCP classes
# The interpreter will use this registry to discover and instantiate MCPs.
REGISTERED_MCPS: Dict[str, Type[BaseMCP]] = {
    ComplianceMCP.name: ComplianceMCP,
    HSCodeMCP.name: HSCodeMCP,
    # Add other MCPs here as they are created, e.g.:
    # HSCodeMCP.name: HSCodeMCP,
}

__all__ = [
    "BaseMCP",
    "MCPOutput",
    "ComplianceMCP",
    "HSCodeMCP",
    "log_mcp_run",
    "handle_mcp_result",
    "MCP_REGISTRY",
    "get_active_mcps",
    "REGISTERED_MCPS"
]
