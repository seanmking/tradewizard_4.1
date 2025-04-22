# src/api/classification/routers/products.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.get("/ungrouped", response_model=List[schemas.Product])
def read_ungrouped_products(
    assessment_id: UUID,
    db: Session = Depends(get_db)
):
    """Retrieve products that are not assigned to any group for a given assessment."""
    products = db.query(models.Product).filter(
        models.Product.assessment_id == assessment_id,
        models.Product.group_id == None
    ).all()
    return products

@router.get("/{product_id}", response_model=schemas.Product)
def read_product(
    product_id: UUID,
    db: Session = Depends(get_db)
):
    """Retrieve details of a specific product."""
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.put("/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: UUID,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update details of a specific product (e.g., name, description, assign group)."""
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_update.dict(exclude_unset=True)

    # Special handling if group_id is being changed
    old_group_id = db_product.group_id
    new_group_id = update_data.get('group_id')

    if 'group_id' in update_data and old_group_id != new_group_id:
        # TODO: Update product_sort_order in both old (if exists) and new (if exists) groups
        # Remove from old group's sort order
        if old_group_id:
            old_group = db.query(models.ProductGroup).filter(models.ProductGroup.id == old_group_id).first()
            if old_group and old_group.product_sort_order:
                old_group.product_sort_order = [item for item in old_group.product_sort_order if item['productId'] != str(product_id)]
                db.add(old_group) # Stage the change

        # Add to new group's sort order (append to end)
        if new_group_id:
            new_group = db.query(models.ProductGroup).filter(models.ProductGroup.id == new_group_id).first()
            if new_group:
                if not new_group.product_sort_order:
                    new_group.product_sort_order = []
                new_sort_order = len(new_group.product_sort_order)
                new_group.product_sort_order.append({'productId': str(product_id), 'sortOrder': new_sort_order})
                db.add(new_group) # Stage the change
            else:
                 # Trying to assign to a non-existent group
                 raise HTTPException(status_code=404, detail=f"Target group {new_group_id} not found")
        elif new_group_id is None and old_group_id is not None:
             # This case handles removing from a group, already handled by removing from old_group sort order
             pass

    # Apply other updates
    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.add(db_product) # Stage product changes
    db.commit()
    db.refresh(db_product)
    # Refresh groups if they were modified
    # if old_group_id: db.refresh(old_group)
    # if new_group_id: db.refresh(new_group)

    return db_product


@router.patch("/{product_id}/group", response_model=schemas.Product)
def assign_product_to_group(
    product_id: UUID,
    payload: schemas.AssignProductToGroupPayload,
    db: Session = Depends(get_db)
):
    """Assign or unassign a product to/from a group."""
    # This provides a more specific endpoint for just changing the group
    # It reuses the logic from the PUT endpoint
    update_payload = schemas.ProductUpdate(group_id=payload.group_id)
    return update_product(product_id=product_id, product_update=update_payload, db=db)

# Potentially add POST for creating products manually if needed
# POST / -> create_product

# Potentially add DELETE for products if needed
# DELETE /{product_id} -> delete_product
