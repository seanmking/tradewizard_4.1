from typing import Optional, Literal, List, Tuple
from pydantic import BaseModel, Field, HttpUrl, ValidationError, field_validator, ConfigDict
import logging

logger = logging.getLogger(__name__)

class Product(BaseModel):
    name: str = Field(..., description="Name of the product")
    description: Optional[str] = Field(None, description="Description of the product")
    # Allow source_url to be None or a valid HttpUrl string
    source_url: Optional[str] = Field(None, description="URL where product was found")
    # Allow image_url to be None or a valid HttpUrl string
    image_url: Optional[str] = Field(None, description="Image URL of the product")
    category: Optional[str] = Field(None, description="Inferred category")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="LLM confidence in extraction accuracy")
    extraction_method: Optional[Literal["css", "llm"]] = Field("llm", description="How the product was extracted")

    # Updated to Pydantic V2 style validator
    @field_validator('source_url', 'image_url', mode='before')
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            # Attempt to validate as HttpUrl, but return original string if valid
            # Pydantic V2 automatically tries to coerce, but explicit validation is clearer here
            HttpUrl(v) # type: ignore
            return str(v) # Return the string representation
        except (ValidationError, TypeError): # Catch TypeError as well for non-string inputs
            logger.warning(f"Invalid URL format encountered: {v}. Setting to None.")
            return None # Set to None if validation fails

    # Updated to Pydantic V2 ConfigDict
    model_config = ConfigDict(
        str_strip_whitespace=True, # Renamed from anystr_strip_whitespace
        extra="ignore", # Ignore extra fields from LLM output
        use_enum_values=True # Ensure Literal uses string values
    )


def validate_product_set(products_data: List[dict]) -> Tuple[List[Product], List[str]]:
    """Validate a list of product dictionaries against the Product model and run business logic."""
    valid_products = []
    warnings = []
    validation_errors = []

    for idx, data in enumerate(products_data):
        try:
            product = Product(**data)

            # Business Logic Checks
            if not product.name or product.name.strip() == "":
                warnings.append(f"Product at index {idx} has a missing or empty name.")
                # Decide if this is critical enough to invalidate the product
                # continue # Optionally skip products with empty names

            if product.confidence_score is not None and product.confidence_score < 0.2:
                warnings.append(f"Low confidence ({product.confidence_score:.2f}) for product: '{product.name or '[No Name]'}' at index {idx}.")

            # Add more domain-specific checks here (e.g., price checks, category validation)

            valid_products.append(product)

        except ValidationError as e:
            error_details = e.errors()
            msg = f"Validation failed for product at index {idx}: {error_details}. Original data: {data}"
            logger.warning(msg)
            validation_errors.append(msg)
            # Optionally decide whether to skip invalid items or attempt partial use
        except Exception as e:
            # Catch other unexpected errors during instantiation or checks
            msg = f"Unexpected error processing product at index {idx}: {e}. Original data: {data}"
            logger.error(msg, exc_info=True)
            validation_errors.append(msg)

    # Combine warnings and validation errors for reporting
    all_issues = warnings + validation_errors

    if all_issues:
        logger.warning(f"Validation finished with {len(all_issues)} issues for the product set.")

    return valid_products, all_issues
