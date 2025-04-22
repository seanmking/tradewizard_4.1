# src/api/classification/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

# --- Base Schemas ---
class BaseSchema(BaseModel):
    class Config:
        orm_mode = True # Compatibility with SQLAlchemy models
        # Use alias for camelCase conversion if needed for frontend
        # alias_generator = to_camel
        # allow_population_by_field_name = True

# --- LLM Insights Schemas ---
class LLMInsightsBase(BaseSchema):
    potentialCategory: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0, le=1)
    attributes: Optional[Dict[str, Any]] = None
    suggestedGroupName: Optional[str] = None
    suggestedVariantAttributes: Optional[List[str]] = None
    reasoning: Optional[str] = None

class LLMInsights(LLMInsightsBase):
    pass # No difference for initial schema

# --- Product Schemas ---
class ProductBase(BaseSchema):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    scraped_url: Optional[str] = None
    raw_scraped_data: Optional[Dict[str, Any]] = None
    llm_insights: Optional[LLMInsights] = None
    group_id: Optional[UUID] = None

class ProductCreate(ProductBase):
    assessment_id: UUID

class ProductUpdate(BaseSchema): # Allow partial updates
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    group_id: Optional[UUID] = None # Allow assigning/unassigning from group
    llm_insights: Optional[LLMInsights] = None

class Product(ProductBase):
    id: UUID
    assessment_id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    schema_version: int

# --- Variant Schemas ---
class VariantBase(BaseSchema):
    attributes: Dict[str, Any]
    sku: Optional[str] = None
    # Future fields
    # hs_code: Optional[str] = None
    # compliance_data: Optional[Dict[str, Any]] = None

class VariantCreate(VariantBase):
    group_id: UUID
    assessment_id: UUID # Required on creation

class VariantUpdate(BaseSchema):
    attributes: Optional[Dict[str, Any]] = None
    sku: Optional[str] = None

class Variant(VariantBase):
    id: UUID
    group_id: UUID
    assessment_id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    schema_version: int

# --- Product Group Schemas ---
# Helper schema for sort order items
class ProductSortOrderItem(BaseSchema):
    productId: UUID
    sortOrder: int

class VariantSortOrderItem(BaseSchema):
    variantId: UUID
    sortOrder: int

class ProductGroupBase(BaseSchema):
    name: str
    product_sort_order: Optional[List[ProductSortOrderItem]] = None
    variant_sort_order: Optional[List[VariantSortOrderItem]] = None

class ProductGroupCreate(ProductGroupBase):
    assessment_id: UUID
    # Optionally include initial products on creation?
    initial_product_ids: Optional[List[UUID]] = None

class ProductGroupUpdate(BaseSchema):
    name: Optional[str] = None
    product_sort_order: Optional[List[ProductSortOrderItem]] = None
    variant_sort_order: Optional[List[VariantSortOrderItem]] = None

# Full ProductGroup including relationships (read model)
class ProductGroup(ProductGroupBase):
    id: UUID
    assessment_id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    schema_version: int
    # Include populated products/variants when reading a group?
    # products: List[Product] = [] # Loaded via relationship
    # variants: List[Variant] = [] # Loaded via relationship


# --- API Specific Schemas ---
class ProductGroupWithDetails(ProductGroup):
    # Explicitly define products/variants if needed for specific endpoints
    products: List[Product] = []
    variants: List[Variant] = []

class AssignProductToGroupPayload(BaseSchema):
    group_id: Optional[UUID] # Use None to ungroup

class SuggestionAcceptPayload(BaseSchema):
    suggestionContext: Dict[str, Any] # Identifier for the suggestion made by Sarah
