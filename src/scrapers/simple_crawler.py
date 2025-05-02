"""
Simple Playwright-based website crawler for TradeWizard.
This module provides a more straightforward implementation focused on reliability.
"""

import asyncio
import json
import logging
import re
from datetime import datetime
from typing import Dict, List, Any, Set, Optional, Tuple
from urllib.parse import urljoin, urlparse

from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleCrawler:
    """
    A simplified website crawler using Playwright for JavaScript-rendered content.
    Focuses on reliability and product extraction.
    """
    
    def __init__(
        self,
        max_pages: int = 20,
        headless: bool = True,
        timeout: int = 30000  # 30 seconds in ms
    ):
        """
        Initialize the crawler with configuration parameters.
        
        Args:
            max_pages: Maximum number of pages to crawl per domain
            headless: Whether to run browser in headless mode
            timeout: Page load timeout in milliseconds
        """
        self.max_pages = max_pages
        self.headless = headless
        self.timeout = timeout
        
        # State tracking
        self.visited_urls: Set[str] = set()
        self.url_queue: List[str] = []
        self.results = {
            "metadata": {},
            "pages": []
        }
    
    async def crawl(self, start_url: str) -> Dict[str, Any]:
        """
        Crawl a website starting from the given URL.
        
        Args:
            start_url: The URL to start crawling from
            
        Returns:
            Dict containing the crawl results
        """
        # Reset state for new crawl
        self.visited_urls = set()
        self.url_queue = [start_url]
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
                url = self.url_queue.pop(0)
                
                # Skip if already visited
                if url in self.visited_urls:
                    continue
                
                page_data = {
                    "url": url,
                    "title": "N/A",
                    "text": "",
                    "page_type": "",
                    "html": "",
                    "found_links": [],
                    "products_found": []
                }

                # Process the page
                try:
                    page = await context.new_page()
                    await page.goto(url, wait_until="load", timeout=60000) # Try 'load' event, keep timeout
                    
                    # Get page content
                    html = await page.content()
                    title = await page.title()
                    page_data["title"] = title
                    
                    # Extract text using BeautifulSoup instead of JavaScript
                    soup = BeautifulSoup(html, 'html.parser')
                    text = self._extract_text_with_soup(soup)
                    page_data["text"] = text
                    
                    # Extract links
                    crawlable_links, all_found_links = await self._extract_links(page, url)
                    page_data["found_links"] = all_found_links
                    
                    # Classify page type
                    page_type = self._classify_page_type(url, title)
                    page_data["page_type"] = page_type
                    
                    # Extract products (this now gets body HTML)
                    try:
                        # Note: We are temporarily storing body HTML here
                        page_data["body_html_debug"] = await self._extract_products(page)
                        page_data["products_found"] = [] # Keep original structure, but empty for now
                    except Exception as prod_err:
                        logger.warning(f"Could not extract products from {url}: {prod_err}")
                        page_data["products_found"] = []
                    
                    # Add to results
                    self.results["pages"].append(page_data)
                    self.visited_urls.add(url)
                    
                    # Add new links to queue
                    for link in crawlable_links:
                        if link not in self.visited_urls and link not in self.url_queue:
                            self.url_queue.append(link)
                    
                    # Prioritize important pages
                    self._prioritize_queue()
                    
                    logger.info(f"Crawled {url} ({len(self.visited_urls)}/{self.max_pages})")
                    
                except Exception as e:
                    logger.error(f"Error crawling {url}: {str(e)}")
                
                finally:
                    await page.close()
            
            await browser.close()
        
        # Update metadata
        self.results["metadata"]["pages_crawled"] = len(self.visited_urls)
        
        logger.info(f"Crawl completed: {len(self.results['pages'])} pages crawled")
        
        return self.results
    
    def _extract_text_with_soup(self, soup: BeautifulSoup) -> str:
        """
        Extract text content using BeautifulSoup.
        
        Args:
            soup: BeautifulSoup object
            
        Returns:
            Extracted text
        """
        # Remove unwanted elements
        for element in soup(['script', 'style', 'noscript', 'iframe']):
            element.decompose()
        
        # Extract text with structure
        text_parts = []
        
        # Extract headings with hierarchy
        for i in range(1, 7):
            for heading in soup.find_all(f'h{i}'):
                text_parts.append(f"{'#' * i} {heading.get_text(strip=True)}")
        
        # Extract paragraphs
        for p in soup.find_all('p'):
            text = p.get_text(strip=True)
            if text:
                text_parts.append(text)
        
        # Extract list items
        for li in soup.find_all('li'):
            text = li.get_text(strip=True)
            if text:
                text_parts.append(f"- {text}")
        
        # Extract other text
        for div in soup.find_all(['div', 'span', 'td', 'th']):
            # Skip if parent is already processed
            if div.parent and div.parent.name in ['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                continue
                
            # Skip if it contains other content elements
            if div.find(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                continue
                
            text = div.get_text(strip=True)
            if text:
                text_parts.append(text)
        
        return "\n".join(text_parts)
    
    async def _extract_links(self, page: Page, base_url: str) -> Tuple[List[str], List[Dict[str, str]]]:
        """
        Extract links from the page.
        
        Args:
            page: Playwright page
            base_url: Base URL for resolving relative links
            
        Returns:
            A tuple containing:
            - List of normalized, internal, crawlable (http/https) URLs
            - List of all found links as dictionaries {'href': absolute_url, 'text': anchor_text}
        """
        base_domain = urlparse(base_url).netloc
        
        # Extract href and text content using Playwright
        # Returns a list of objects: [{href: '...', text: '...'}, ...]
        links = await page.query_selector_all("a[href]")
        
        crawlable_links = []
        all_found_links = []
        unique_crawlable_urls = set()

        skip_patterns = [
            r'/cart', r'/checkout', r'/my-account', r'/login', r'/register',
            r'\?add-to-cart=', r'/wp-admin', r'/wp-login'
        ]
        # File extensions to exclude from crawling directly
        non_crawlable_extensions = (
            '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar', '.doc',
            '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.mp3', '.mp4', '.avi'
        )
        
        for link_element in links:
            href = await link_element.get_attribute("href")
            
            text = await link_element.inner_text()
            text = text.strip() if text else ""
            
            # Create absolute URL first for the 'all_found_links' list
            absolute_url = urljoin(base_url, href).strip()
            all_found_links.append({'href': absolute_url, 'text': text})
            
            # Now, apply filtering for crawlable links
            parsed_link = urlparse(absolute_url)
            
            # Must be http or https
            if parsed_link.scheme not in ['http', 'https']: 
                continue

            # Skip external links
            if parsed_link.netloc and parsed_link.netloc != base_domain:
                continue
                
            # Skip URLs ending in non-crawlable file extensions
            if parsed_link.path.lower().endswith(non_crawlable_extensions):
                continue
            
            # Skip common non-content pages based on path
            if any(re.search(pattern, parsed_link.path, re.IGNORECASE) for pattern in skip_patterns):
                continue
            
            # Normalize the URL for the queue (remove fragment and query params)
            normalized_url = urljoin(base_url, parsed_link.path) # Re-join using only path
            
            # Add to crawlable list if not already present
            if normalized_url not in unique_crawlable_urls:
                crawlable_links.append(normalized_url)
                unique_crawlable_urls.add(normalized_url)

        return crawlable_links, all_found_links

    async def _extract_products(self, page: Page) -> list:
        """
        Extract product information from the page using BeautifulSoup and regex heuristics.
        Returns a list of product dicts with keys: name, category, price, image_url, description, found_on_pages
        """
        html = await page.content()
        soup = BeautifulSoup(html, 'html.parser')
        products = []
        found_on_page = getattr(page, 'url', None) or None

        # Heuristic 1: Common product containers
        product_selectors = [
            '[class*="product"]', '[id*="product"]', '[class*="item"]', '[class*="menu"]', '[class*="food"]', '[class*="dish"]',
            'li', 'article', 'section'
        ]
        containers = []
        for selector in product_selectors:
            containers.extend(soup.select(selector))

        seen_names = set()
        for container in containers:
            # Name
            name = None
            for tag in ['h1','h2','h3','h4','h5','h6','.title','.name']:
                el = container.select_one(tag) or container.find(class_='title') or container.find(class_='name')
                if el and el.get_text(strip=True):
                    name = el.get_text(strip=True)
                    break
            if not name:
                continue
            norm_name = name.lower().strip().rstrip('.,:;\u2022\u00b7')
            if norm_name in seen_names:
                continue
            seen_names.add(norm_name)

            # Category
            cat_el = container.find(class_='category') or container.find(class_='cat')
            category = cat_el.get_text(strip=True) if cat_el else None
            # Price
            price = None
            price_el = container.find(class_='price') or container.find(class_='cost')
            if price_el and price_el.get_text():
                price = price_el.get_text(strip=True)
            else:
                # Look for price pattern in text
                price_match = re.search(r'R\s*[\d,.]+', container.get_text())
                price = price_match.group(0) if price_match else None
            # Image
            img_el = container.find('img')
            image_url = img_el['src'] if img_el and img_el.has_attr('src') else None
            # Description
            desc_el = container.find('p')
            description = desc_el.get_text(strip=True) if desc_el else None
            # Found on pages
            found_on_pages = [found_on_page] if found_on_page else []

            products.append({
                "name": name,
                "category": category,
                "price": price,
                "image_url": image_url,
                "description": description,
                "found_on_pages": found_on_pages
            })
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
        def get_priority(url):
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
                
            # Default priority
            return 4
        
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
    crawler = SimpleCrawler(max_pages=max_pages)
    return await crawler.crawl(url)


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python simple_crawler.py <url> [max_pages]")
        sys.exit(1)
        
    url = sys.argv[1]
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    
    async def main():
        results = await crawl_website(url, max_pages)
        print(json.dumps(results, indent=2))
        
    asyncio.run(main())
