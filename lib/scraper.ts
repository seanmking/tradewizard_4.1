// lib/scraper.ts
import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url'; // Add URL for validation

// Define a more detailed product interface including confidence score
interface ExtractedProduct {
  productId: string; // Changed from id
  name?: string;
  category?: string; // Consider removing if purely LLM-driven
  price?: number; // Should be number
  currency?: string; // Added currency
  imageUrl?: string;
  productUrl?: string;
  description?: string; // Optional details
  confidenceScore: number; // 0.0 to 1.0
}

// Define the structure for the final scraped output
interface ScrapedData {
  url?: string; // The final URL after redirects
  title?: string;
  description?: string;
  keywords?: string[];
  headings?: string[];
  mainContent?: string;
  // Make non-optional and initialize to []
  extractedProducts: ExtractedProduct[]; // Changed from optional
  contacts?: { emails?: string[]; phones?: string[] };
  // Update socialLinks structure
  socialLinks?: { platform: string; url: string }[]; // Changed structure
  scrapedAt: string;
  error?: string;
}

/**
 * Helper function to generate a simple hash-based ID for products
 * @param name Product name
 * @param description Product description
 * @returns A simple ID string
 */
function generateProductId(name: string, description: string, index: number): string {
  // Simple hash function (replace with something more robust if needed)
  const hash = (str: string) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return `prod_${h.toString(16)}_${index}`;
  };
  return hash(name + description);
}

/**
 * Normalizes a URL, ensuring it has a scheme and is absolute
 * @param url The URL string to normalize
 * @param baseUrl The base URL of the page for resolving relative URLs
 * @returns A normalized absolute URL string or null if invalid
 */
function normalizeUrl(url: string | undefined | null, baseUrl: string): string | null {
  if (!url) return null;
  try {
    // Attempt to resolve the URL relative to the base URL
    const absoluteUrl = new URL(url, baseUrl).toString();
    return absoluteUrl;
  } catch (e) {
    // If URL parsing fails, return null
    return null;
  }
}

/**
 * Scrapes a website and extracts relevant content for analysis
 * @param targetUrl The URL to scrape
 * @returns The extracted content as a ScrapedData object, serialized to JSON string
 */
export async function scrapeWebsite(url: string): Promise<string> {
  // Initialize ScrapedData with required fields and non-optional array
  // Fixes: f801a261-a146-43f7-b20b-baee0e7febcf (by initializing at declaration)
  const scrapedData: ScrapedData = {
    extractedProducts: [], // Initialize non-optional array here
    scrapedAt: new Date().toISOString(),
  };

  try {
    // Validate and normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    // Update the URL in scrapedData after normalization
    scrapedData.url = normalizedUrl;

    console.log(`Scraping website: ${scrapedData.url}`);
    const response = await axios.get(scrapedData.url, {
      headers: {
        // Use a more common user agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000 // Increased timeout to 15 seconds
    });

    // Load the HTML into cheerio
    // Explicitly cast response.data to string to address the lint error (ID: aa3f11d8-4ffd-42ee-b2bf-77773df86d2f)
    // Assuming response.data is typically a string for HTML content
    const $ = cheerio.load(response.data as string);
    const baseUrl = scrapedData.url!; // Use the final scraped URL as the base

    // Remove script, style, noscript, iframe, svg, and other non-content elements
    $('script, style, noscript, iframe, svg, header, footer, nav, aside, form, button, input').remove();

    // --- Extraction logic ---

    // 1. Extract Basic Metadata
    scrapedData.title = $('title').first().text().trim() || undefined;
    scrapedData.description = $('meta[name="description"]').first().attr('content')?.trim() || undefined;
    const keywordsString = $('meta[name="keywords"]').first().attr('content')?.trim();
    scrapedData.keywords = keywordsString ? keywordsString.split(',').map(k => k.trim()).filter(k => k) : undefined;

    // 2. Extract Headings (H1-H3)
    const headings: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text) {
        headings.push(text);
      }
    });
    scrapedData.headings = headings.length > 0 ? headings : undefined;

    // 3. Extract Main Content
    // Try common main content selectors first
    let mainContentText = $('main').first().text() ||
                          $('article').first().text() ||
                          $('[role="main"]').first().text() ||
                          $('#content').first().text() ||
                          $('.content').first().text() ||
                          $('.main').first().text();

    // Fallback: Combine text from all top-level divs/sections if specific tags fail
    if (!mainContentText) {
        let bodyText = '';
        $('body > div, body > section').each((_, el) => {
            bodyText += $(el).text() + '\n\n';
        });
        mainContentText = bodyText;
    }

    // Clean up extracted text (remove excessive whitespace)
    scrapedData.mainContent = mainContentText.replace(/\s\s+/g, ' ').trim() || undefined;

    // --- Product extraction logic (Corrected) ---
    const productSelectors = [
        '.product',
        '.product-item',
        '.product-card',
        '.item',
        '[data-productid]',
        '[itemtype="http://schema.org/Product"]',
        // Add more specific selectors based on observed patterns
    ];

    $(productSelectors.join(', ')).each((index, element) => {
        const productElement = $(element);
        const product: ExtractedProduct = {
            productId: '', // Will be generated
            name: undefined,
            category: undefined,
            price: undefined,
            currency: undefined, // Initialize currency
            imageUrl: undefined,
            productUrl: undefined,
            description: undefined,
            confidenceScore: 0.5,
        };

        // Name
        product.name = productElement.find('h2, h3, h4, .product-title, .product-name, .item-title, .item-name').first().text().trim() || undefined;

        // Price
        const priceElement = productElement.find('.price, .product-price, .price-amount, .product__price');
        let priceText = priceElement.first().text().trim();
        if (!priceText) {
            productElement.find('*').each((_, el) => {
                const potentialPrice = $(el).text().trim();
                 if (potentialPrice.match(/[\$£€]/)) {
                     priceText = potentialPrice;
                     return false;
                 }
             });
        }
        if (priceText) {
            const priceMatch = priceText.match(/([\d.,]+)/);
            // Assign price as number | undefined (Fixes: 16879480-3792-4981-b7c8-03e4bc48bdd9)
            product.price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : undefined;
             // Assign currency as string | undefined
             if (priceText.includes('$')) product.currency = 'USD';
             else if (priceText.includes('£')) product.currency = 'GBP';
             else if (priceText.includes('€')) product.currency = 'EUR';
        }


        // Image URL
        const imgElement = productElement.find('img').first();
        const rawSrc = imgElement.attr('src');
        const rawDataSrc = imgElement.attr('data-src');
        const rawDataOriginal = imgElement.attr('data-original');
        let imgSrc: string | undefined = rawSrc ?? undefined;
        if (!imgSrc) imgSrc = rawDataSrc ?? undefined;
        if (!imgSrc) imgSrc = rawDataOriginal ?? undefined;

        // Apply safer ternary pattern and coalesce null result from normalizeUrl
        // Fixes lint errors: b143b..., 0c0a..., 1642...
        product.imageUrl = typeof imgSrc === 'string' ? (normalizeUrl(baseUrl, imgSrc) ?? undefined) : undefined;

        // Product URL
        const linkElement = productElement.find('a').first();
        const rawLinkHref = linkElement.attr('href');
        let productHref: string | undefined = rawLinkHref ?? undefined;
         if (!productHref && productElement.is('a')) {
             const rawElementHref = productElement.attr('href');
             productHref = rawElementHref ?? undefined;
         }

        // Apply safer ternary pattern and coalesce null result from normalizeUrl
        // Fixes lint errors: de1b3..., 4c5e...
        product.productUrl = typeof productHref === 'string' ? (normalizeUrl(baseUrl, productHref) ?? undefined) : undefined;

        // Description
         product.description = productElement.find('.description, .product-description, .item-description').first().text().trim() || undefined;


        // Final checks and Add to list
        // Ensure name is defined before calling generateProductId
        // Ensure URL part for ID generation is a string
        // Fixes: c34ec18e-a1a1-4017-8db1-3b704bf3ca2c, 0b06ba22-7d30-43ac-8bce-1485bef5cca7, 671f4054-5778-462e-9256-4f1a91a8737f (by ensuring inputs to generateProductId are strings)
        if (product.name && (product.price || product.imageUrl || product.productUrl)) {
             const idUrlPart = product.productUrl || scrapedData.url || ''; // Provide empty string fallback
            product.productId = generateProductId(product.name, idUrlPart, index); // Pass index
            // Push is now safe due to initialization at declaration
            scrapedData.extractedProducts.push(product);
        }
    });


    // --- Contact/Social extraction logic ---
    const contactInfo: { emails?: string[]; phones?: string[] } = {};
    // Use array for normalized social links
    const normalizedSocialLinks: { platform: string; url: string }[] = [];
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    // Basic phone regex (can be improved for international numbers)
    const phoneRegex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/g;
    const socialDomains = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com', 'pinterest.com'];

    const uniqueEmails = new Set<string>();
    const uniquePhones = new Set<string>();

    // Search for mailto links and text content
    $('a[href^="mailto:"]').each((_, el) => {
        const email = $(el).attr('href')?.substring(7); // Remove mailto:
        if (email) uniqueEmails.add(email.toLowerCase());
    });

     // Search relevant text nodes for emails/phones
    $('body').find('*').contents().filter(function() {
        // Filter for text nodes only, avoiding script/style content
        return this.type === 'text' && !$(this).parent().is('script, style');
    }).each((_, node) => {
        const text = $(node).text();
        let match;
        while ((match = emailRegex.exec(text)) !== null) {
            uniqueEmails.add(match[0].toLowerCase());
        }
        while ((match = phoneRegex.exec(text)) !== null) {
            uniquePhones.add(match[0].replace(/[.\-()\s]/g, '')); // Basic normalization
        }
    });

    if (uniqueEmails.size > 0) {
        contactInfo.emails = Array.from(uniqueEmails);
    }
    if (uniquePhones.size > 0) {
        contactInfo.phones = Array.from(uniquePhones);
    }
     scrapedData.contacts = (contactInfo.emails || contactInfo.phones) ? contactInfo : undefined;


    // Search for social media links
    const foundPlatforms = new Set<string>(); // Avoid duplicates for the same platform
    $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
            try {
                const url = new URL(href); // Use original href for URL object
                const normalizedHref = normalizeUrl(baseUrl, href); // Normalize for storage
                const domain = url.hostname.replace(/^www\./, '');
                const platformDomain = socialDomains.find(d => domain.includes(d));

                 if (platformDomain) {
                     const platformName = platformDomain.split('.')[0];
                     // Capitalize first letter for display
                     const displayPlatform = platformName.charAt(0).toUpperCase() + platformName.slice(1);
                     // Avoid adding multiple links for the same platform
                     if (!foundPlatforms.has(displayPlatform)) {
                        normalizedSocialLinks.push({ platform: displayPlatform, url: normalizedHref });
                        foundPlatforms.add(displayPlatform); // Mark platform as found
                     }
                 }
            } catch (e) {
                // Ignore invalid URLs
            }
        }
    });
    // Assign the array to scrapedData
    scrapedData.socialLinks = normalizedSocialLinks.length > 0 ? normalizedSocialLinks : undefined;


    // Final JSON output
    console.log('Scraping finished successfully.');
    return JSON.stringify(scrapedData, null, 2);

  } catch (error: any) {
    console.error(`Error scraping website ${scrapedData.url}:`, error);
    scrapedData.error = error instanceof Error ? error.message : 'Unknown scraping error';
    // Return structured error response
    return JSON.stringify(scrapedData, null, 2);
  }
}

// --- Debug Runner ---
if (require.main === module) {
  const testUrl = process.argv[2]; // Get URL from command line argument
  if (!testUrl) {
    console.error('Please provide a URL as a command line argument.');
    process.exit(1);
  }
  console.log(`Running scraper directly for: ${testUrl}`);
  scrapeWebsite(testUrl)
    .then(output => {
      console.log('--- Scraper Output ---');
      console.log(output);
      console.log('----------------------');
    })
    .catch(error => {
      console.error('--- Scraper Error ---');
      console.error(error);
      console.log('---------------------');
      process.exit(1);
    });
}
