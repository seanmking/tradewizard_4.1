# src/api/classification/models.py
import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Boolean,
    UUID,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


# Base model for common fields (optional, can add directly to models)
# class BaseEntityModel(Base):
#     __abstract__ = True
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
#     created_by = Column(String)
#     schema_version = Column(Integer, default=1, nullable=False)


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    image_url = Column(String)
    scraped_url = Column(String)
    raw_scraped_data = Column(JSONB)
    llm_insights = Column(JSONB)
    group_id = Column(UUID(as_uuid=True), ForeignKey("product_groups.id"), index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(String)
    schema_version = Column(Integer, default=1, nullable=False)

    group = relationship("ProductGroup", back_populates="products_association")


class ProductGroup(Base):
    __tablename__ = "product_groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String, nullable=False)
    product_sort_order = Column(JSONB) # e.g., [{"productId": "uuid1", "sortOrder": 0}]
    variant_sort_order = Column(JSONB) # e.g., [{"variantId": "uuidA", "sortOrder": 0}]

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(String)
    schema_version = Column(Integer, default=1, nullable=False)

    products_association = relationship("Product", back_populates="group") # Many-to-one from Product
    variants_association = relationship("Variant", back_populates="group") # One-to-many to Variant


class Variant(Base):
    __tablename__ = "variants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("product_groups.id"), nullable=False, index=True)
    assessment_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    attributes = Column(JSONB, nullable=False)
    sku = Column(String)
    hs_code = Column(String)
    compliance_data = Column(JSONB)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(String)
    schema_version = Column(Integer, default=1, nullable=False)

    group = relationship("ProductGroup", back_populates="variants_association")

