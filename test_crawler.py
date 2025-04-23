#!/usr/bin/env python3
"""
Test script for the simplified website crawler.

Test script for the Playwright-based website crawler.
"""

import asyncio
import json
from src.scrapers.crawler_integration import crawl_url_for_assessment

async def test_crawler(url, max_pages=5):
    """Test the crawler on a given URL."""
    print(f"Testing crawler on {url} with max_pages={max_pages}")
    
    # Run the crawler
    result = await crawl_url_for_assessment(url, max_pages=max_pages)
    
    # Print basic stats
    pages = result["raw_content"]["pages"]
    print(f"Pages crawled: {len(pages)}")
    
    # Collect all products
    products = []
    for page in pages:
        if "products_found" in page:
            products.extend(page["products_found"])
    
    print(f"Products found: {len(products)}")
    
    # Print sample products
    if products:
        print("\nSample products:")
        for p in products[:10]:  # Show up to 10 products
            print(f"- {p.get('name', 'Unknown')} | {p.get('price', 'No price')}")
    
    # Print page types
    page_types = {}
    for page in pages:
        page_type = page.get("type", "unknown")
        page_types[page_type] = page_types.get(page_type, 0) + 1
    
    print("\nPage types found:")
    for page_type, count in page_types.items():
        print(f"- {page_type}: {count}")
    
    return result

if __name__ == "__main__":
    import sys
    
    # Default to Global Cuisine if no URL provided
    url = sys.argv[1] if len(sys.argv) > 1 else "https://globalcuisine.co.za"
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    result = asyncio.run(test_crawler(url, max_pages))
    
    # Optionally save the full result to a file
    with open("crawler_result.json", "w") as f:
        json.dump(result["raw_content"], f, indent=2)
    
    print(f"\nFull result saved to crawler_result.json")
