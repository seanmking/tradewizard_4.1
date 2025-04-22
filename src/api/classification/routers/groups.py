# src/api/classification/routers/groups.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.ProductGroup, status_code=status.HTTP_201_CREATED)
def create_product_group(
    group: schemas.ProductGroupCreate,
    db: Session = Depends(get_db)
):
    """Create a new product group."""
    # TODO: Implement creation logic
    # - Create group record
    # - Handle initial_product_ids if provided
    # - Set default sort order
    # - Commit and return created group
    db_group = models.ProductGroup(
        name=group.name,
        assessment_id=group.assessment_id,
        # Initialize sort order if needed
        product_sort_order=[],
        variant_sort_order=[]
    )
    db.add(db_group)
    # Handle initial products if needed
    # if group.initial_product_ids:
    #     # Query products, update group_id, update sort order
    #     pass
    db.commit()
    db.refresh(db_group)
    return db_group

@router.get("/", response_model=List[schemas.ProductGroup])
def read_product_groups(
    assessment_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """Retrieve product groups, optionally filtered by assessment ID."""
    query = db.query(models.ProductGroup)
    if assessment_id:
        query = query.filter(models.ProductGroup.assessment_id == assessment_id)
    # TODO: Add pagination?
    groups = query.all()
    return groups

@router.get("/{group_id}", response_model=schemas.ProductGroupWithDetails)
def read_product_group_details(
    group_id: UUID,
    db: Session = Depends(get_db)
):
    """Retrieve details of a specific product group, including its products and variants."""
    # TODO: Implement logic to fetch group and eagerly load products/variants
    # Ensure products/variants respect the stored sort order
    db_group = db.query(models.ProductGroup).filter(models.ProductGroup.id == group_id).first()
    if db_group is None:
        raise HTTPException(status_code=404, detail="Product group not found")

    # Manually load products and variants based on sort order (example)
    # This should ideally be more efficient, perhaps using relationships + ordering
    products = []
    if db_group.product_sort_order:
        product_ids_ordered = {item['productId']: item['sortOrder'] for item in db_group.product_sort_order}
        db_products = db.query(models.Product).filter(models.Product.group_id == group_id).all()
        products = sorted(db_products, key=lambda p: product_ids_ordered.get(str(p.id), float('inf')))

    variants = []
    if db_group.variant_sort_order:
        variant_ids_ordered = {item['variantId']: item['sortOrder'] for item in db_group.variant_sort_order}
        db_variants = db.query(models.Variant).filter(models.Variant.group_id == group_id).all()
        variants = sorted(db_variants, key=lambda v: variant_ids_ordered.get(str(v.id), float('inf')))

    group_details = schemas.ProductGroupWithDetails.from_orm(db_group)
    group_details.products = products
    group_details.variants = variants
    return group_details


@router.put("/{group_id}", response_model=schemas.ProductGroup)
def update_product_group(
    group_id: UUID,
    group_update: schemas.ProductGroupUpdate,
    db: Session = Depends(get_db)
):
    """Update a product group (e.g., rename, reorder products/variants)."""
    db_group = db.query(models.ProductGroup).filter(models.ProductGroup.id == group_id).first()
    if db_group is None:
        raise HTTPException(status_code=404, detail="Product group not found")

    update_data = group_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_group, key, value)

    db.commit()
    db.refresh(db_group)
    return db_group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_group(
    group_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a product group. Products within the group will become ungrouped."""
    # Note: FK constraint on products.group_id is ON DELETE SET NULL
    db_group = db.query(models.ProductGroup).filter(models.ProductGroup.id == group_id).first()
    if db_group is None:
        raise HTTPException(status_code=404, detail="Product group not found")

    db.delete(db_group)
    db.commit()
    return None

# TODO: Add endpoint for Sarah suggestion acceptance?
# POST /suggested
