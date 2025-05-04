from .base_module import (
    MCPOutput,
    MCPProduct,
    MCPCertification,
    MCPContact,
    StandardizedMCPData,
    BaseMCP,
)

# Aliases for backward compatibility
BaseModule = BaseMCP
ModuleOutput = MCPOutput

__all__ = [
    "BaseModule",
    "ModuleOutput",
    "MCPOutput",
    "MCPProduct",
    "MCPCertification",
    "MCPContact",
    "StandardizedMCPData",
]
