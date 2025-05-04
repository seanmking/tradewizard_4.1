# /Users/seanking/Projects/tradewizard_4.1/src/mcps/__init__.py
"""Model Context Protocol (Module) package.

This package contains modular, pluggable components (Modules) that encapsulate
domain-specific logic, often involving LLM interactions, for TradeWizard.

Interpreter.py discovers and executes Modules based on an explicit registry.
"""

from typing import Dict, Type

# Import the base class to make it easily accessible
from .base import BaseModule, ModuleOutput

# Import specific Module implementations here
from .compliance_module import ComplianceModule
from .hscode_module import HSCodeMCP
from .website_analysis_module import WebsiteAnalysisModule

# Import helpers
from .helpers import log_mcp_run, handle_mcp_result

# Import registry
from .pipeline import MCP_REGISTRY as Module_REGISTRY, get_active_mcps

# --- Module Registration ---
# Explicitly register available Module classes
# The interpreter will use this registry to discover and instantiate Modules.
REGISTERED_ModuleS: Dict[str, Type[BaseModule]] = {
    ComplianceModule.name: ComplianceModule,
    HSCodeMCP.name: HSCodeMCP,
    WebsiteAnalysisModule.NAME: WebsiteAnalysisModule,
    # Add other Modules here as they are created, e.g.:
    # HSCodeModule.name: HSCodeModule,
}

__all__ = [
    "BaseModule",
    "ModuleOutput",
    "ComplianceModule",
    "HSCodeMCP",
    "WebsiteAnalysisModule",
    "log_mcp_run",
    "handle_mcp_result",
    "Module_REGISTRY",
    "get_active_mcps",
    "REGISTERED_ModuleS"
]
