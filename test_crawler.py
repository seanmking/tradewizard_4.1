#!/usr/bin/env python3
"""
Test script for the simplified website crawler.

Test script for the Playwright-based website crawler.
"""

import asyncio
import json
import pytest
from src.scrapers.crawler_integration import crawl_url_for_assessment

@pytest.mark.asyncio
@pytest.mark.parametrize(
    "url, max_pages, min_expected_pages",
    [
        ("https://globalcuisine.co.za", 3, 1), 
        # ("https://toscrape.com/", 2, 2), 
    ]
)
async def test_crawler(url, max_pages, min_expected_pages):
    """Test the crawler on a given URL."""
    print(f"Testing crawler on {url} with max_pages={max_pages}")
    
    # Run the crawler
    result = await crawl_url_for_assessment(url, max_pages=max_pages)
    
    # Print basic stats
    pages = result["pages"]
    print(f"Pages crawled: {len(pages)}")
    assert len(pages) >= min_expected_pages, f"Expected at least {min_expected_pages} page(s), found {len(pages)}"
    assert isinstance(result.get("aggregated_products"), list), "Aggregated products should be a list (even if empty)"
    
    # Collect all products
    products = []
    for page in pages:
        if "products_found" in page:
            products.extend(page["products_found"])
    
    print(f"Products found: {len(products)}")
    
    # Print sample products
    if products:
        print("\nSample products:")
        for p in products[:10]:  
            print(f"- {p.get('name', 'Unknown')} | {p.get('price', 'No price')}")
    
    # Print page types
    page_types = {}
    for page in pages:
        page_type = page.get("type", "unknown")
        page_types[page_type] = page_types.get(page_type, 0) + 1
    
    print("\nPage types found:")
    for page_type, count in page_types.items():
        print(f"- {page_type}: {count}")
