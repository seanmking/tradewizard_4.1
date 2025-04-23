"""
Website scraper package for TradeWizard.
Provides comprehensive website crawling and content extraction capabilities.
"""

# Don't import Playwright modules directly to avoid dependency errors
# These will be imported when actually needed

# Only expose the integration functions
from .crawler_integration import crawl_url_for_assessment

__all__ = [
    'crawl_url_for_assessment'
]
