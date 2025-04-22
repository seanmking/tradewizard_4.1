# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy
from itemadapter import ItemAdapter
from typing import List, Dict, Optional, Any # Import necessary types

# Define the structure for a single product
class ProductItem(scrapy.Item):
    name = scrapy.Field()
    category = scrapy.Field()
    packaging = scrapy.Field()
    imageAlt = scrapy.Field()
    imageUrl = scrapy.Field() # Adding image URL if available
    specSheetUrl = scrapy.Field() # Adding spec sheet URL if available

# Define the structure for contact details
class ContactItem(scrapy.Item):
    email = scrapy.Field()
    phone = scrapy.Field()
    address = scrapy.Field()
    contact_page_url = scrapy.Field() # URL of the contact page

# Define the structure for social media links
class SocialLinksItem(scrapy.Item):
    instagram = scrapy.Field()
    linkedin = scrapy.Field()
    facebook = scrapy.Field()
    youtube = scrapy.Field()
    # Add others as needed

# Main item for the SME website data
class ScrapySmeScraperItem(scrapy.Item):
    # Core Identification
    assessment_id = scrapy.Field() # Keep this for matching in the pipeline
    source_url = scrapy.Field()    # The starting URL

    # Business Identity
    companyName = scrapy.Field()
    about = scrapy.Field()          # Corresponds to 'summary' in DB
    sectors_served = scrapy.Field() # New field for sectors

    # Product Information
    products: List[Dict[str, Any]] = scrapy.Field(default=[]) # List of ProductItem-like dicts

    # Certifications & Quality
    certifications: List[str] = scrapy.Field(default=[]) # List of strings (e.g., "HACCP", "Halal")

    # Contact & Location
    contacts: Dict[str, Any] = scrapy.Field(default={}) # ContactItem-like dict

    # Social Media & External Links
    socialLinks: Dict[str, Any] = scrapy.Field(default={}) # SocialLinksItem-like dict
    other_links = scrapy.Field(default={}) # For blog, newsletter etc.

    # Media
    images: List[str] = scrapy.Field(default=[]) # List of image URLs or relevant identifiers

    # New field for raw text content
    rawContent = scrapy.Field()

    # Metadata / Quality Fields
    confidence = scrapy.Field(default=1.0) # Default to high confidence
    llm_ready = scrapy.Field(default=True)  # Default to True, set False if confidence low
    fallback_reason = scrapy.Field(default=None) # Reason if confidence is low or extraction failed
