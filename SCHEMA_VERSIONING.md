# Schema Versioning

This document tracks the evolution of the database schema for core TradeWizard classification entities.

## Version 1 (Initial Release - 2025-04-19)

This version establishes the foundational tables required for the Product Grouping and Variant Selection step (Step 1) of the classification workflow.

**Tables Introduced:**

*   `products`:
    *   Stores individual product information scraped or imported.
    *   Includes basic details (`name`, `description`, `imageUrl`, `scrapedUrl`).
    *   Contains `raw_scraped_data` and `llm_insights` (JSONB) for traceability and intelligence.
    *   Links to `product_groups` via `group_id` (nullable FK).
    *   Includes metadata: `id`, `assessment_id`, `createdAt`, `updatedAt`, `createdBy`, `schemaVersion` (default: 1).
*   `product_groups`:
    *   Represents a user-defined (or Sarah-suggested) grouping of similar products.
    *   Includes `name`, `assessment_id`.
    *   Manages sort order for contained products and variants via `product_sort_order` and `variant_sort_order` (JSONB fields).
    *   Includes metadata: `id`, `createdAt`, `updatedAt`, `createdBy`, `schemaVersion` (default: 1).
*   `variants`:
    *   Represents a specific variant within a `product_group`.
    *   Defined by `attributes` (JSONB, e.g., `{"size": "100g"}`).
    *   Includes optional `sku`.
    *   Links to `product_groups` via `group_id` (non-nullable FK).
    *   Includes metadata: `id`, `assessment_id` (denormalized), `createdAt`, `updatedAt`, `createdBy`, `schemaVersion` (default: 1).

**Key Features of v1:**

*   Support for grouping products.
*   Support for defining multi-attribute variants within groups.
*   User-definable sort order for products within groups and variants within groups.
*   Integration points for LLM insights.
*   Standard metadata fields for traceability.
*   Basic schema versioning field (`schemaVersion`).

**Future Considerations (Post-v1):**

*   Dedicated mapping tables for `product_sort_order` and `variant_sort_order` if JSONB proves insufficient.
*   Dedicated `assessments` table.
*   Fields for Step 2 (HS Codes) and Step 3 (Compliance) in `variants` table.
*   Refining LLM insights structure.
