# scraping/scrapy_sme_scraper/scrapy_sme_scraper/spiders/sme_spider.py
import scrapy
import logging
import re # Import regex for email/phone fallbacks
import json # Import json for schema parsing
from urllib.parse import urlparse, urljoin
# Ensure you import the specific Item classes you defined
from ..items import ScrapySmeScraperItem, ProductItem, ContactItem, SocialLinksItem

logger = logging.getLogger(__name__)

class SmeSpider(scrapy.Spider):
    name = "sme_spider"
    # We will set allowed_domains and start_urls dynamically

    def __init__(self, start_url=None, assessment_id=None, *args, **kwargs):
        super(SmeSpider, self).__init__(*args, **kwargs)

        if not start_url or not assessment_id:
            raise ValueError("Both 'start_url' and 'assessment_id' arguments are required.")

        parsed_uri = urlparse(start_url)
        self.start_urls = [start_url]
        self.assessment_id = assessment_id
        # Allow both base domain and www. subdomain
        domain = parsed_uri.netloc
        self.allowed_domains = [domain]
        if domain.startswith('www.'):
            self.allowed_domains.append(domain[4:])
        else:
            self.allowed_domains.append(f'www.{domain}')

        logger.info(f"Spider initialized with start_url: {start_url}, assessment_id: {assessment_id}, allowed_domains: {self.allowed_domains}")

    def start_requests(self):
        for url in self.start_urls:
            # Pass assessment_id through cb_kwargs
            yield scrapy.Request(url, self.parse_main)

    def parse_main(self, response):
        """
        Parses the main landing page (designed for Browns Foods structure),
        extracting all info directly. Yields one complete item.
        """
        logger.info(f"Parsing main page: {response.url} for all content")
        # Create a single item for this assessment ID
        item = ScrapySmeScraperItem(assessment_id=self.assessment_id, source_url=response.url)
        item['confidence'] = 1.0 # Start assuming good confidence
        item['llm_ready'] = True # Assume ready unless issues found
        item['fallback_reason'] = "" # Initialize fallback reason string

        # --- Extract Basic Info ---
        item['companyName'] = response.css('meta[property="og:site_name"]::attr(content)').get()
        if not item['companyName']:
            item['companyName'] = response.xpath('//title/text()').get(default='').strip()
            # Clean up title if needed (e.g., "Home | Browns Foods")
            if '|' in item['companyName']:
                parts = item['companyName'].split('|', 1)
                item['companyName'] = parts[1].strip() if len(parts) > 1 else parts[0].strip()
        logger.info(f"Extracted company name: {item['companyName']}")

        # --- Extract Social Links (Commonly in header/footer) ---
        social_links_data = SocialLinksItem() # Use the sub-item
        base_url = urlparse(response.url).netloc # Use current response URL base

        def find_social_link(platform_domain):
             selector = f'footer a[href*="{platform_domain}"], header a[href*="{platform_domain}"]'
             # Add specific selectors if needed for Browns Foods structure
             selector += f', a[href*="{platform_domain}"]' # General search as fallback
             links = response.css(selector)
             for link in links:
                  href = link.attrib.get('href')
                  # Basic check to avoid internal links styled as social
                  if href and platform_domain in href and base_url not in href:
                      # Prioritize links that look like actual profile URLs
                      if f'{platform_domain}/' in href:
                           return response.urljoin(href)
             # If specific profile link not found, check again for any valid external link
             for link in links:
                 href = link.attrib.get('href')
                 if href and platform_domain in href and base_url not in href:
                     return response.urljoin(href)
             return None

        social_links_data['instagram'] = find_social_link('instagram.com')
        social_links_data['facebook'] = find_social_link('facebook.com')
        social_links_data['linkedin'] = find_social_link('linkedin.com')
        social_links_data['youtube'] = find_social_link('youtube.com')

        # Assign if any social links found
        valid_social_links = {k: v for k, v in social_links_data.items() if v}
        if valid_social_links:
            item['socialLinks'] = valid_social_links
            logger.info(f"Found social links: {item['socialLinks']}")
        else:
             logger.info("No social links found using common selectors.")
             item['socialLinks'] = None # Explicitly set to None if empty


        # --- Extract About Text (From Main Page Section) ---
        # Find the 'About Us' h2 and get following paragraphs
        about_text_parts = response.xpath('//h2[contains(translate(., "ABOUTUS", "aboutus"), "about us")]/following-sibling::p//text()').getall()
        if not about_text_parts:
             # Fallback: search broader areas if specific structure fails
             about_text_parts = response.xpath('//section[contains(.//h2, "About Us")]//p//text()').getall()

        if about_text_parts:
            full_about_text = ' '.join(part.strip() for part in about_text_parts if part.strip())
            item['about'] = re.sub(r'\s+', ' ', full_about_text).strip()[:5000] # Limit length
            logger.info(f"Extracted 'About' text (truncated): {item['about'][:100]}...")
        else:
            logger.warning(f"Could not extract 'About' text from main page {response.url}")
            item['about'] = None
            item['confidence'] = max(0.7, item.get('confidence', 1.0) - 0.1) # Lower confidence slightly
            item['fallback_reason'] += " Failed to find About text."


        # --- Extract Certifications (Look for keywords/images on main page) ---
        certifications_found = []
        page_text_lower = response.body.decode(response.encoding, errors='ignore').lower()
        # Expanded list of potential cert keywords
        possible_certs = ["haccp", "iso 22000", "iso22000", "iso9001", "iso 9001", "halal", "halaal", "kosher", "organic", "sabs", "fda", "gmp", "fssc 22000", "fssc22000", "brc"]
        for cert in possible_certs:
            # Use word boundaries to avoid partial matches (e.g., 'isoline' matching 'iso')
            if re.search(r'\b' + re.escape(cert) + r'\b', page_text_lower):
                normalized_cert = cert.upper().replace("ISO ", "ISO").replace(" ", "")
                certifications_found.append(normalized_cert)

        # Look for image alt text or filenames
        for img in response.css('img'):
            alt_text = img.attrib.get('alt', '').lower()
            src_text = img.attrib.get('src', '').lower()
            img_text = alt_text + ' ' + src_text
            for cert_keyword in possible_certs:
                 if len(cert_keyword) > 3 and re.search(r'\b' + re.escape(cert_keyword) + r'\b', img_text):
                     normalized_cert = cert_keyword.upper().replace("ISO ", "ISO").replace(" ", "")
                     certifications_found.append(normalized_cert)

        item['certifications'] = sorted(list(set(certifications_found))) # Remove duplicates and sort
        if item['certifications']:
            logger.info(f"Found potential certifications: {item['certifications']}")
        else:
             logger.info("No certifications explicitly found on main page.")
             item['certifications'] = None # Explicitly set to None


        # --- Extract Contact Details (From Main Page Section) ---
        contacts_data = ContactItem() # Use the sub-item
        contacts_data['contact_page_url'] = response.url # Source is the main page

        # Find the 'Contact Us' section/heading
        contact_section = response.xpath('//section[contains(.//h2, "Contact Us")] | //div[contains(.//h2, "Contact Us")]')
        if not contact_section:
             contact_section = response.xpath('//h2[contains(translate(., "CONTACTUS", "contactus"), "contact us")]/parent::div | //h2[contains(translate(., "CONTACTUS", "contactus"), "contact us")]/parent::section')
        if not contact_section:
            contact_section = response # Fallback to searching whole response if section not found
            logger.debug("Contact section not specifically found, searching whole page.")
        else:
             logger.debug(f"Found {len(contact_section)} potential contact section(s). Using first one.")
             contact_section = contact_section[0] # Use the first match


        # Email
        email = contact_section.xpath('.//a[starts-with(@href, "mailto:")]/@href').re_first(r'mailto:([\w\.-]+@[\w\.-]+\.\w+)')
        if not email:
             # Check specific labels based on sample
             email = contact_section.xpath('.//h4[contains(text(), "Email")]/following-sibling::*/text() | .//p[contains(text(), "Email:")]/text()').re_first(r'[\w\.-]+@[\w\.-]+\.\w+')
        if not email:
             # Fallback: Regex on the whole section text
             section_text_nodes = contact_section.xpath('.//text()').getall()
             section_text = ' '.join(t.strip() for t in section_text_nodes if t.strip())
             email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w{2,}', section_text)
             if email_match: email = email_match.group(0)
        if email:
            contacts_data['email'] = email.lower().strip()
            logger.info(f"Found email: {contacts_data['email']}")

        # Phone
        phone = contact_section.xpath('.//a[starts-with(@href, "tel:")]/@href').re_first(r'tel:([+\d\s\(\)-]+)')
        if not phone:
             # Check specific labels based on sample
             phone = contact_section.xpath('.//h4[contains(text(), "Call")]/following-sibling::*/text() | .//p[contains(text(), "Call:")]/text()').get()
        if not phone:
             # Regex Fallback on section text
             section_text_nodes = contact_section.xpath('.//text()').getall()
             section_text = ' '.join(t.strip() for t in section_text_nodes if t.strip())
             # Use the more robust patterns from previous attempt
             phone_patterns = [
                r'\+?27[\s.-]?\(?0?\)?\d{1,2}[\s.-]?\d{3}[\s.-]?\d{4}',
                r'\(?0?\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}',
                r'\+\d{1,3}[\s.-]?\d{1,14}(?:[\s.-]?\d{1,13})?'
             ]
             for pattern in phone_patterns:
                 matches = sorted(re.findall(pattern, section_text), key=len, reverse=True)
                 if matches:
                     best_match = matches[0].strip()
                     if len(re.sub(r'\D', '', best_match)) >= 7:
                         phone = best_match
                         break
        if phone:
            contacts_data['phone'] = phone.strip()
            logger.info(f"Found phone: {contacts_data['phone']}")

        # Address
        address_lines = contact_section.xpath('.//h4[contains(text(), "Location")]/following-sibling::*//text() | .//p[contains(text(), "Address:")]/following-sibling::*//text()').getall()
        if not address_lines:
            # Fallback: Look for multi-line text near 'Location' or 'Address' keywords
             address_lines = contact_section.xpath('.//*[contains(text(), "Location") or contains(text(), "Address")]/following-sibling::div/p/text() | .//*[contains(text(), "Location") or contains(text(), "Address")]/following-sibling::p/text()').getall()

        if address_lines:
            full_address = ' '.join(line.strip() for line in address_lines if line.strip())
            contacts_data['address'] = re.sub(r'\s{2,}', ' ', full_address).strip()
            logger.info(f"Found address: {contacts_data['address']}")

        # Only add contacts if we found something significant
        if contacts_data.get('email') or contacts_data.get('phone') or contacts_data.get('address'):
             item['contacts'] = contacts_data
        else:
            logger.warning(f"Could not extract significant Contact details from {response.url}")
            item['contacts'] = None
            item['confidence'] = max(0.7, item.get('confidence', 1.0) - 0.1)
            item['fallback_reason'] += " Failed to find Contact details."


        # --- Extract Products (From Main Page Section) ---
        products_list = []
        # Find the 'Our Products' heading first, more reliably
        products_heading = response.xpath('//h2[contains(translate(., "OURPRODUCTS", "ourproducts"), "our products")]')

        if not products_heading:
             logger.warning(f"Could not find 'Our Products' heading (h2) on {response.url}")
             products_section = response # Fallback: search whole page if heading not found
        else:
             # Try to find the parent section/div containing the heading
             products_section = products_heading.xpath('./ancestor::section[1] | ./ancestor::div[contains(@class, "section") or contains(@class, "container")][1] | ./parent::div[1]')
             if not products_section:
                 products_section = products_heading.xpath('./parent::*') # Direct parent as fallback
             if not products_section:
                 products_section = response # Ultimate fallback
             else:
                  products_section = products_section[0] # Use the first container found
             logger.debug("Located 'Our Products' section/container.")

        # Get all H4 elements within the identified section
        all_h4_elements = products_section.xpath('.//h4')
        logger.info(f"Found {len(all_h4_elements)} h4 elements within the products section.")

        # List of heading texts to exclude (adjust as needed)
        exclude_texts = [
            "order your corn dogs and snack pockets today",
            "corn dogs",
            "snack pockets",
            "wholesale corndogs",
            "other products" # Add any other known non-product headings
        ]

        if not all_h4_elements:
             logger.warning(f"Could not identify any h4 elements within the product section on {response.url}")
             item['products'] = None
             if item['fallback_reason'] is None: item['fallback_reason'] = "" # Ensure init
             item['confidence'] = max(0.6, item.get('confidence', 1.0) - 0.2)
             item['fallback_reason'] += " Failed to find any h4 in product section."
        else:
            for heading_element in all_h4_elements:
                name = heading_element.xpath('string(.)').get() # Extracts all text content within the h4
                if name:
                    name_cleaned = name.strip().lower()
                    # Check if the cleaned name is in the exclusion list
                    if name_cleaned and name_cleaned not in exclude_texts:
                        product_data = ProductItem() # Use the sub-item
                        product_data['name'] = name.strip() # Store original case name
                        logger.debug(f"Found potential product name: {product_data['name']}")
                        products_list.append(product_data)
                    else:
                         logger.debug(f"Skipping excluded h4 text: {name.strip()}")
                else:
                     logger.debug("Skipping h4 element with no text content.")


            if products_list:
                item['products'] = products_list
                logger.info(f"Extracted {len(products_list)} products from main page {response.url} after filtering.")
                # Reset product-specific fallback reason if successful
                if item['fallback_reason'] and "Product structure" in item['fallback_reason']:
                     item['fallback_reason'] = item['fallback_reason'].replace("Failed to find Product structure.","").replace("Failed to find any h4 in product section.","").strip()
                     # Recalculate confidence if product issue was the only major one? Optional.
                     # item['confidence'] = min(1.0, item.get('confidence', 0.8) + 0.2) # Example adjustment
            else:
                logger.warning(f"Found h4 elements but failed to extract usable product names after filtering from {response.url}.")
                item['products'] = None
                if item['fallback_reason'] is None: item['fallback_reason'] = "" # Ensure init
                item['confidence'] = max(0.6, item.get('confidence', 1.0) - 0.2)
                # Ensure reason reflects the filtering outcome
                if "Product structure" not in item['fallback_reason'] and "any h4" not in item['fallback_reason']:
                     item['fallback_reason'] += " Found h4s but none matched product criteria after filtering."


        # --- Extract Raw Visible Content ---
        raw_text_parts = []
        # Select text from common content tags, excluding nav/footer/script/style
        # This XPath tries to be comprehensive yet avoid noise. Adjust as needed.
        text_nodes = response.xpath(
            '//body//*[not(self::script or self::style or self::nav or self::footer or ancestor::nav or ancestor::footer or ancestor::script or ancestor::style)]//text()[normalize-space()]'
        ).getall()

        if text_nodes:
            for text in text_nodes:
                cleaned_text = ' '.join(text.split()) # Normalize whitespace within the node
                if cleaned_text: # Avoid adding empty strings
                    raw_text_parts.append(cleaned_text)

            item['rawContent'] = '\n'.join(raw_text_parts).strip() # Join parts with newline for readability
            logger.info(f"Extracted raw content (approx. {len(item['rawContent'])} chars).")
            # Set llm_ready based primarily on rawContent presence
            item['llm_ready'] = True if item['rawContent'] else False
            if not item['llm_ready']:
                 logger.warning("Failed to extract significant raw content.")
                 if item['fallback_reason'] is None: item['fallback_reason'] = ""
                 item['fallback_reason'] += " Failed to extract raw page content."
                 item['confidence'] = max(0.4, item.get('confidence', 1.0) - 0.4) # Reduce confidence more if no raw text
            else:
                 # If raw content IS present, llm_ready should be true,
                 # even if other parts failed (confidence reflects those failures)
                 item['llm_ready'] = True
                 logger.info("Setting llm_ready=True based on successful rawContent extraction.")
        else:
            logger.warning("Could not extract any text nodes for raw content.")
            item['rawContent'] = None
            item['llm_ready'] = False
            if item['fallback_reason'] is None: item['fallback_reason'] = ""
            item['fallback_reason'] += " Failed to extract raw page content."
            item['confidence'] = max(0.4, item.get('confidence', 1.0) - 0.4)

        # --- Determine Final Confidence & LLM Readiness ---
        # Confidence is already adjusted by specific extractors.
        # llm_ready is now primarily driven by rawContent success.
        # If rawContent failed, llm_ready is False.
        # If rawContent succeeded, llm_ready is True.
        # We might slightly penalize confidence further if *both* structured products *and* rawContent failed.
        if item['products'] is None and item['rawContent'] is None:
             logger.warning("Extraction failed for both structured products and raw content.")
             # Confidence might already be low, potentially lower it further?
             # item['confidence'] = max(0.2, item.get('confidence', 0.6) - 0.2)

        # Final check on fallback reason formatting
        if item.get('fallback_reason'): # Check if it exists and has content
            item['fallback_reason'] = item['fallback_reason'].strip()
            if not item['fallback_reason']:
                item['fallback_reason'] = None # Ensure None if empty after stripping
        else:
            item['fallback_reason'] = None # Ensure None if it wasn't set

        logger.info(f"Final item details before yield: Confidence={item.get('confidence', 'N/A')}, LLM_Ready={item.get('llm_ready', 'N/A')}, Fallback='{item.get('fallback_reason', '')}'")
 
        # Yield the completed item to the pipeline
        yield item


    # --- Keep other parsers empty for now, not used for this structure ---
    def parse_about(self, response, assessment_id):
        pass

    def parse_contact(self, response, assessment_id):
        pass

    def parse_products(self, response, assessment_id):
        pass
