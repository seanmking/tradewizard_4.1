"""
Full-site crawler using Playwright for JavaScript-rendered content extraction.
This module implements a comprehensive website crawler that captures both HTML and
rendered content from websites, with special focus on product information.
"""

import asyncio
import json
import logging
import re
import time
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple, Any
from urllib.parse import urljoin, urlparse

from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PlaywrightCrawler:
    """
    A comprehensive website crawler using Playwright for JavaScript-rendered content.
    Extracts both HTML and text content from websites, with special handling for
    product information and navigation structures.
    """
    
    def __init__(
        self,
        max_pages: int = 20,
        max_depth: int = 3,
        timeout: int = 30000,  # 30 seconds in ms
        wait_for_idle: int = 1000,  # 1 second in ms
        headless: bool = True
    ):
        """
        Initialize the crawler with configuration parameters.
        
        Args:
            max_pages: Maximum number of pages to crawl per domain
            max_depth: Maximum link depth to follow
            timeout: Page load timeout in milliseconds
            wait_for_idle: Wait time after page load for JS to settle (ms)
            headless: Whether to run browser in headless mode
        """
        self.max_pages = max_pages
        self.max_depth = max_depth
        self.timeout = timeout
        self.wait_for_idle = wait_for_idle
        self.headless = headless
        
        # State tracking
        self.visited_urls: Set[str] = set()
        self.url_queue: List[Tuple[str, int]] = []  # (url, depth)
        self.skipped_urls: List[str] = []
        self.crawl_stats: Dict[str, Any] = {
            "pages_crawled": 0,
            "pages_skipped": 0,
            "start_time": None,
            "end_time": None,
            "errors": []
        }
        
        # Results storage
        self.results: Dict[str, Any] = {
            "metadata": {},
            "pages": []
        }
    
    async def crawl(self, start_url: str) -> Dict[str, Any]:
        """
        Crawl a website starting from the given URL.
        
        Args:
            start_url: The URL to start crawling from
            
        Returns:
            Dict containing the crawl results with metadata and page content
        """
        # Reset state for new crawl
        self.visited_urls = set()
        self.url_queue = [(start_url, 0)]  # Start URL at depth 0
        self.skipped_urls = []
        self.crawl_stats = {
            "pages_crawled": 0,
            "pages_skipped": 0,
            "start_time": datetime.now().isoformat(),
            "end_time": None,
            "errors": []
        }
        self.results = {
            "metadata": {
                "domain": urlparse(start_url).netloc,
                "crawl_date": datetime.now().isoformat(),
                "start_url": start_url
            },
            "pages": []
        }
        
        logger.info(f"Starting crawl of {start_url} with max {self.max_pages} pages")
        
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=self.headless)
            context = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36 TradeWizard/1.0"
            )
            
            # Process the queue until empty or max pages reached
            while self.url_queue and len(self.visited_urls) < self.max_pages:
                url, depth = self.url_queue.pop(0)
                
                # Skip if already visited or beyond max depth
                if url in self.visited_urls or depth > self.max_depth:
                    self.skipped_urls.append(url)
                    self.crawl_stats["pages_skipped"] += 1
                    continue
                
                # Process the page
                try:
                    page_data = await self._process_page(context, url, depth)
                    self.results["pages"].append(page_data)
                    self.visited_urls.add(url)
                    self.crawl_stats["pages_crawled"] += 1
                    
                    # Add discovered links to the queue
                    for link in page_data.get("links_found", []):
                        if link not in self.visited_urls and link not in [u for u, _ in self.url_queue]:
                            self.url_queue.append((link, depth + 1))
                    
                    # Sort queue to prioritize important pages
                    self._prioritize_queue()
                    
                    logger.info(f"Crawled {url} ({len(self.visited_urls)}/{self.max_pages})")
                    
                except Exception as e:
                    logger.error(f"Error crawling {url}: {str(e)}")
                    self.crawl_stats["errors"].append({
                        "url": url,
                        "error": str(e),
                        "timestamp": datetime.now().isoformat()
                    })
            
            await browser.close()
        
        # Finalize results
        self.crawl_stats["end_time"] = datetime.now().isoformat()
        self.results["metadata"].update({
            "pages_crawled": self.crawl_stats["pages_crawled"],
            "pages_skipped": self.crawl_stats["pages_skipped"],
            "errors": len(self.crawl_stats["errors"])
        })
        
        logger.info(f"Crawl completed: {self.crawl_stats['pages_crawled']} pages crawled, "
                   f"{self.crawl_stats['pages_skipped']} skipped, "
                   f"{len(self.crawl_stats['errors'])} errors")
        
        return self.results
    
    async def _process_page(self, context: BrowserContext, url: str, depth: int) -> Dict[str, Any]:
        """
        Process a single page: load it, extract content, and find links.
        
        Args:
            context: Playwright browser context
            url: URL to process
            depth: Current depth level
            
        Returns:
            Dict containing the page data
        """
        page = await context.new_page()
        
        try:
            # Navigate to the page with timeout
            response = await page.goto(url, timeout=self.timeout, wait_until="networkidle")
            
            # Wait additional time for JS to settle
            await page.wait_for_timeout(self.wait_for_idle)
            
            # Get page type
            page_type = self._classify_page_type(url, await page.title())
            
            # Extract HTML content
            html_content = await page.content()
            
            # Extract text content
            text_content = await self._extract_text_content(page)
            
            # Extract links
            links = await self._extract_links(page, url)
            
            # Extract products if this looks like a product page
            products_found = []
            if "product" in page_type or "shop" in page_type or "menu" in page_type:
                products_found = await self._extract_products(page)
            
            # Create page data object
            page_data = {
                "url": url,
                "type": page_type,
                "title": await page.title(),
                "depth": depth,
                "html": html_content,
                "text": text_content,
                "links_found": links
            }
            
            # Add products if found
            if products_found:
                page_data["products_found"] = products_found
            
            return page_data
            
        finally:
            await page.close()
    
    async def _extract_text_content(self, page: Page) -> str:
        """
        Extract clean text content from the page.
        
        Args:
            page: Playwright page object
            
        Returns:
            Extracted text content
        """
        # Use a simpler approach to extract text
        text_content = await page.evaluate("""
        () => {
            // Helper function to get visible text
            function getVisibleText(element) {
                if (!element) return '';
                
                // Skip hidden elements
                const style = window.getComputedStyle(element);
                if (style && (style.display === 'none' || style.visibility === 'hidden')) {
                    return '';
                }
                
                // Skip script and style elements
                if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || 
                    element.tagName === 'NOSCRIPT' || element.tagName === 'IFRAME') {
                    return '';
                }
                
                // If it's a text node, return its text
                if (element.nodeType === Node.TEXT_NODE) {
                    return element.textContent.trim();
                }
                
                // For headings, add markdown-style formatting
                if (element.tagName && element.tagName.match(/^H[1-6]$/)) {
                    const level = element.tagName[1];
                    return '\n' + '#'.repeat(parseInt(level)) + ' ' + element.textContent.trim() + '\n';
                }
                
                // For paragraphs, add a newline after
                if (element.tagName === 'P') {
                    return element.textContent.trim() + '\n';
                }
                
                // For list items, add a bullet
                if (element.tagName === 'LI') {
                    return '- ' + element.textContent.trim() + '\n';
                }
                
                // For other elements, just return their text
                let result = '';
                if (element.childNodes && element.childNodes.length > 0) {
                    for (const child of element.childNodes) {
                        result += getVisibleText(child) + ' ';
                    }
                } else {
                    result = element.textContent.trim();
                }
                
                return result.trim();
            }
            
            // Get all elements that typically contain meaningful text
            const textContainers = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, td, th, div, span, a, button, label');
            
            // Extract and format the text
            let extractedText = '';
            for (const container of textContainers) {
                // Skip if parent is already processed to avoid duplication
                if (container.parentElement && 
                    (container.parentElement.tagName === 'LI' || 
                     container.parentElement.tagName === 'P')) {
                    continue;
                }
                
                const text = getVisibleText(container);
                if (text) {
                    extractedText += text + ' ';
                }
            }
            
            // Clean up the text
            return extractedText
                .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
                .replace(/\n\s+/g, '\n')  // Clean up newlines
                .trim();
        }
        """)
        
        return text_content
    
    async def _extract_links(self, page: Page, base_url: str) -> List[str]:
        """
        Extract and normalize all internal links from the page.
        
        Args:
            page: Playwright page object
            base_url: Base URL for resolving relative links
            
        Returns:
            List of normalized internal links
        """
        base_domain = urlparse(base_url).netloc
        
        # Extract links using Playwright's evaluate
        links = await page.evaluate("""() => {
            const links = Array.from(document.querySelectorAll('a[href]'))
                .map(a => a.href)
                .filter(href => href && !href.startsWith('javascript:') && !href.startsWith('#'));
            return [...new Set(links)]; // Remove duplicates
        }""")
        
        # Filter and normalize links
        normalized_links = []
        for link in links:
            parsed_link = urlparse(link)
            
            # Skip external links, anchors, javascript, etc.
            if parsed_link.netloc and parsed_link.netloc != base_domain:
                continue
                
            # Skip common non-content pages
            skip_patterns = [
                r'/cart', r'/checkout', r'/my-account', r'/login', r'/register',
                r'\?add-to-cart=', r'/wp-admin', r'/wp-login', r'/feed', r'/xmlrpc'
            ]
            if any(re.search(pattern, parsed_link.path, re.IGNORECASE) for pattern in skip_patterns):
                continue
            
            # Normalize the URL (remove fragments, etc.)
            normalized_url = urljoin(base_url, link.split('#')[0].split('?')[0])
            
            # Add trailing slash for consistency if needed
            if not parsed_link.path or parsed_link.path == '/':
                normalized_url = normalized_url.rstrip('/') + '/'
                
            normalized_links.append(normalized_url)
        
        return list(set(normalized_links))  # Remove any duplicates
    
    async def _extract_products(self, page: Page) -> List[Dict[str, str]]:
        """
        Extract product information from the page.
        
        Args:
            page: Playwright page object
            
        Returns:
            List of product dictionaries with name, price, and category
        """
        # This is a complex heuristic-based extraction that looks for common patterns
        products = await page.evaluate("""() => {
            const products = [];
            
            // Helper to extract text and clean it
            const getText = (el) => el ? el.textContent.trim() : null;
            
            // Helper to extract price (looking for currency patterns)
            const extractPrice = (text) => {
                if (!text) return null;
                // Match common price patterns (R123, R123.45, R123,45, R123 - R456)
                const priceMatch = text.match(/R\\s*[\\d,.]+(?:\\s*-\\s*R\\s*[\\d,.]+)?/g);
                return priceMatch ? priceMatch[0].trim() : null;
            };
            
            // Strategy 1: Look for product grids/lists with common classes
            const productContainers = [
                ...document.querySelectorAll('.product, .products li, .woocommerce-product, [class*="product-"], [id*="product-"]'),
                ...document.querySelectorAll('[class*="shop"] [class*="item"], [class*="catalog"] [class*="item"]'),
                ...document.querySelectorAll('[class*="menu-item"], .item, .food-item, .dish')
            ];
            
            for (const container of productContainers) {
                // Look for name (usually in headings or strong elements)
                const nameEl = container.querySelector('h1, h2, h3, h4, h5, h6, .title, .name, [class*="title"], [class*="name"]') 
                    || container.querySelector('strong, b, [class*="product"]');
                
                // Look for price (usually contains currency symbol)
                const priceEl = container.querySelector('.price, [class*="price"], [class*="cost"], [class*="amount"]');
                
                // If we found at least a name, consider it a product
                if (nameEl) {
                    const name = getText(nameEl);
                    const priceText = getText(priceEl);
                    const price = extractPrice(priceText);
                    
                    // Try to find category
                    const categoryEl = container.closest('[class*="category"], [class*="cat-"]');
                    const category = categoryEl ? 
                        getText(categoryEl.querySelector('h1, h2, h3, .title, [class*="title"]')) : null;
                    
                    products.push({
                        name: name,
                        price: price,
                        category: category
                    });
                }
            }
            
            // Strategy 2: Look for add-to-cart buttons and work backwards
            const cartButtons = document.querySelectorAll('[class*="add-to-cart"], [class*="buy-now"], [id*="add-to-cart"]');
            for (const button of cartButtons) {
                const container = button.closest('li, .item, .product, div[class*="product"], article');
                if (!container) continue;
                
                const nameEl = container.querySelector('h1, h2, h3, h4, h5, h6, .title, .name, [class*="title"], [class*="name"]');
                const priceEl = container.querySelector('.price, [class*="price"], [class*="cost"], [class*="amount"]');
                
                if (nameEl) {
                    const name = getText(nameEl);
                    const priceText = getText(priceEl);
                    const price = extractPrice(priceText);
                    
                    // Check if this product is already in our list
                    if (!products.some(p => p.name === name)) {
                        products.push({
                            name: name,
                            price: price,
                            category: null
                        });
                    }
                }
            }
            
            // Strategy 3: Look for price patterns and work backwards
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
                const text = getText(el);
                if (!text) continue;
                
                // If element contains price pattern but isn't already part of a product
                const price = extractPrice(text);
                if (price && !products.some(p => p.price === price)) {
                    // Look for a nearby name
                    const container = el.closest('div, li, article, section');
                    if (!container) continue;
                    
                    const nameEl = container.querySelector('h1, h2, h3, h4, h5, h6, .title, .name, [class*="title"], [class*="name"]');
                    if (nameEl) {
                        const name = getText(nameEl);
                        
                        // Check if this product is already in our list
                        if (!products.some(p => p.name === name)) {
                            products.push({
                                name: name,
                                price: price,
                                category: null
                            });
                        }
                    }
                }
            }
            
            // Filter out likely non-products (too short names, etc.)
            return products.filter(p => p.name && p.name.length > 2);
        }""")
        
        return products
    
    def _classify_page_type(self, url: str, title: str) -> str:
        """
        Classify the page type based on URL and title.
        
        Args:
            url: Page URL
            title: Page title
            
        Returns:
            Page type classification
        """
        path = urlparse(url).path.lower()
        
        # Check for homepage
        if path == "/" or path == "" or path == "/index.html" or path == "/home":
            return "homepage"
            
        # Check for common page types
        if re.search(r'/(shop|store|products?|buy)', path):
            return "product_listing"
            
        if re.search(r'/(menu|food|dishes|meals)', path):
            return "menu"
            
        if re.search(r'/about', path):
            return "about"
            
        if re.search(r'/(contact|reach-us|find-us)', path):
            return "contact"
            
        if re.search(r'/(category|cat|collection|tag)', path):
            return "category"
            
        if re.search(r'/(product|item)/[^/]+', path):
            return "product_detail"
            
        # Check title for clues
        title_lower = title.lower()
        if any(term in title_lower for term in ["shop", "store", "products", "buy"]):
            return "product_listing"
            
        if any(term in title_lower for term in ["about", "our story", "history"]):
            return "about"
            
        if any(term in title_lower for term in ["contact", "reach us", "find us"]):
            return "contact"
            
        # Default
        return "other"
    
    def _prioritize_queue(self):
        """
        Prioritize the URL queue to crawl important pages first.
        """
        # Define priority scores for different URL patterns
        def get_priority(url_depth_tuple):
            url, depth = url_depth_tuple
            path = urlparse(url).path.lower()
            
            # Highest priority: product/shop pages
            if re.search(r'/(shop|store|products?|menu)', path):
                return 0
                
            # High priority: about/contact pages
            if re.search(r'/(about|contact)', path):
                return 1
                
            # Medium priority: category pages
            if re.search(r'/(category|cat|collection|tag)', path):
                return 2
                
            # Lower priority: individual product pages (we want categories first)
            if re.search(r'/product/[^/]+', path):
                return 3
                
            # Default priority based on depth (deeper = lower priority)
            return 4 + depth
        
        # Sort the queue by priority
        self.url_queue.sort(key=get_priority)


async def crawl_website(url: str, max_pages: int = 20) -> Dict[str, Any]:
    """
    Convenience function to crawl a website and return the results.
    
    Args:
        url: Starting URL to crawl
        max_pages: Maximum number of pages to crawl
        
    Returns:
        Dict containing the crawl results
    """
    crawler = PlaywrightCrawler(max_pages=max_pages)
    return await crawler.crawl(url)


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python playwright_crawler.py <url> [max_pages]")
        sys.exit(1)
        
    url = sys.argv[1]
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    
    async def main():
        results = await crawl_website(url, max_pages)
        print(json.dumps(results, indent=2))
        
    asyncio.run(main())
