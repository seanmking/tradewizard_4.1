# src/api/classification/routers/variants.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Variant, status_code=status.HTTP_201_CREATED)
def create_variant(
    variant: schemas.VariantCreate,
    db: Session = Depends(get_db)
):
    """Create a new variant for a product group."""
    # Check if group exists
    db_group = db.query(models.ProductGroup).filter(models.ProductGroup.id == variant.group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail=f"Product group {variant.group_id} not found")

    db_variant = models.Variant(**variant.dict())
    db.add(db_variant)

    # Add to group's sort order
    if not db_group.variant_sort_order:
        db_group.variant_sort_order = []
    new_sort_order = len(db_group.variant_sort_order)
    # Ensure variant has an ID before adding to sort order
    db.flush() # Assigns ID if using default
    db_group.variant_sort_order.append({'variantId': str(db_variant.id), 'sortOrder': new_sort_order})
    db.add(db_group) # Stage group change

    db.commit()
    db.refresh(db_variant)
    return db_variant

@router.get("/", response_model=List[schemas.Variant])
def read_variants(
    group_id: Optional[UUID] = None,
    assessment_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """Retrieve variants, optionally filtered by group ID or assessment ID."""
    query = db.query(models.Variant)
    if group_id:
        query = query.filter(models.Variant.group_id == group_id)
    if assessment_id:
        query = query.filter(models.Variant.assessment_id == assessment_id)

    # TODO: Add pagination?
    # TODO: Apply sort order?
    variants = query.all()
    return variants

@router.get("/{variant_id}", response_model=schemas.Variant)
def read_variant(
    variant_id: UUID,
    db: Session = Depends(get_db)
):
    """Retrieve details of a specific variant."""
    db_variant = db.query(models.Variant).filter(models.Variant.id == variant_id).first()
    if db_variant is None:
        raise HTTPException(status_code=404, detail="Variant not found")
    return db_variant

@router.put("/{variant_id}", response_model=schemas.Variant)
def update_variant(
    variant_id: UUID,
    variant_update: schemas.VariantUpdate,
    db: Session = Depends(get_db)
):
    """Update details of a specific variant."""
    db_variant = db.query(models.Variant).filter(models.Variant.id == variant_id).first()
    if db_variant is None:
        raise HTTPException(status_code=404, detail="Variant not found")

    update_data = variant_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_variant, key, value)

    db.commit()
    db.refresh(db_variant)
    return db_variant

@router.delete("/{variant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_variant(
    variant_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a specific variant."""
    db_variant = db.query(models.Variant).filter(models.Variant.id == variant_id).first()
    if db_variant is None:
        raise HTTPException(status_code=404, detail="Variant not found")

    group_id = db_variant.group_id
    db.delete(db_variant)

    # Remove from group's sort order
    db_group = db.query(models.ProductGroup).filter(models.ProductGroup.id == group_id).first()
    if db_group and db_group.variant_sort_order:
        db_group.variant_sort_order = [item for item in db_group.variant_sort_order if item['variantId'] != str(variant_id)]
        db.add(db_group) # Stage group change

    db.commit()
    return None
