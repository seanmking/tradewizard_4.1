# src/api/classification/main.py
from fastapi import FastAPI

# TODO: Import routers
from .routers import groups, products, variants

app = FastAPI(
    title="TradeWizard Classification API",
    description="API for managing product grouping, variants, and classification.",
    version="0.1.0",
)

# TODO: Include routers
app.include_router(groups.router, prefix="/groups", tags=["Product Groups"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(variants.router, prefix="/variants", tags=["Variants"])


@app.get("/health", tags=["Health"])
async def health_check():
    """Basic health check endpoint."""
    return {"status": "ok"}

# Placeholder for running with uvicorn (for local dev)
# if __name__ == "__main__":
#     import uvicorn
#     # Ensure the app object is passed correctly, relative to this file's location
#     # e.g., uvicorn.run("src.api.classification.main:app", host="0.0.0.0", port=8001, reload=True)
#     # The exact command might depend on how the project is structured and run.
#     pass
