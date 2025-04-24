import re
from bs4 import BeautifulSoup, NavigableString, Tag
import logging
from src.models.product import Product

logger = logging.getLogger(__name__)

def estimate_tokens(text: str) -> int:
    """Roughly estimates the number of tokens based on character count."""
    if not text:
        return 0
    # Simple heuristic: average token length is around 4 characters
    return len(text) // 4

def extract_main_content(html: str) -> str:
    """Extracts the main content block likely containing products, removing common noise.
    Uses heuristics like tag decomposition and text density.
    """
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")

    # Remove common noise elements
    for tag in soup.find_all(["nav", "header", "footer", "script", "style", "aside", "form"]):
        tag.decompose()

    candidates = soup.find_all(["main", "article", "section", "ul", "div"])

    def text_density(element):
        """Calculate the density of text within an element relative to its tags."""
        text = element.get_text(strip=True)
        num_tags = len(element.find_all())
        # Avoid division by zero if element has no tags; add 1 to denominator
        return len(text) / (1 + num_tags)

    # Sort candidates by text density, descending
    candidates = sorted(candidates, key=text_density, reverse=True)[:5] # Consider top 5

    def has_repetitive_structure(element, min_repeats=3):
        """Checks if an element likely contains a list/grid by looking for repetitive child tags."""
        children = list(element.find_all(recursive=False)) # Only direct children
        if not children:
            return False
        child_tags = [c.name for c in children if hasattr(c, 'name') and c.name]
        if not child_tags:
            return False
        # Heuristic: If less than half the tags are unique, it's likely repetitive
        # (e.g., a list of <li> or <div> items)
        return len(set(child_tags)) < len(child_tags) * 0.5 and len(child_tags) >= min_repeats

    # Prefer candidates with repetitive structure, assuming they are product lists/grids
    for candidate in candidates:
        if has_repetitive_structure(candidate):
            # print(f"DEBUG: Found repetitive structure in candidate: {candidate.name} {candidate.attrs.get('class', '')[:50]}")
            return str(candidate)

    # Fallback: return the highest text-density candidate if no repetitive structure found
    # print(f"DEBUG: No repetitive structure found, falling back to highest density candidate.")
    return str(candidates[0]) if candidates else str(soup) # Return whole soup if no candidates found

def chunk_html(html: str, max_tokens: int = 8000) -> list[str]:
    """Chunks HTML semantically by sections/articles/divs if possible,
    otherwise falls back to token-based chunking.
    """
    if not html:
        return []

    # Check total estimated tokens first
    if estimate_tokens(html) <= max_tokens:
        return [html]

    # Try semantic chunking first (by top-level block elements)
    soup = BeautifulSoup(html, "html.parser")
    # Find direct children that are potential semantic blocks
    sections = soup.find_all(["section", "article", "div"], recursive=False)

    # Check if semantic chunking makes sense and if the total is large enough to warrant it
    if sections and sum(estimate_tokens(str(s)) for s in sections) > max_tokens * 0.5: # Heuristic check
        chunks, current_chunk = [], ""
        for section in sections:
            section_html = str(section)
            section_tokens = estimate_tokens(section_html)
            current_chunk_tokens = estimate_tokens(current_chunk)

            if current_chunk_tokens + section_tokens > max_tokens and current_chunk:
                chunks.append(current_chunk)
                current_chunk = section_html
            else:
                # Append section only if it doesn't exceed max_tokens on its own
                if section_tokens <= max_tokens:
                    current_chunk += section_html
                else:
                    # If a single section is too big, chunk it using token fallback
                    if current_chunk:
                         chunks.append(current_chunk)
                    # print(f"DEBUG: Chunking oversized section using token fallback (estimated tokens: {section_tokens})")
                    chunks.extend(_chunk_html_by_token(section_html, max_tokens))
                    current_chunk = "" # Reset current chunk after handling oversized section

        if current_chunk:
            chunks.append(current_chunk)
        
        # Filter out potentially empty chunks from failed appends
        chunks = [c for c in chunks if c.strip()]
        if chunks: # Only return if semantic chunking produced results
             # print(f"DEBUG: Semantic chunking produced {len(chunks)} chunks.")
             return chunks

    # Fallback to token-based chunking if semantic chunking fails or isn't applicable
    # print(f"DEBUG: Falling back to token-based chunking.")
    return _chunk_html_by_token(html, max_tokens)

def _chunk_html_by_token(html: str, max_tokens: int) -> list[str]:
    """Helper function for pure token-based HTML chunking."""
    if not html:
        return []
        
    # Regex to find HTML tags or text content between tags
    tokens = re.findall(r'<[^>]+>|[^<]+', html)
    chunks, current_chunk = [], ""
    current_token_count = 0

    for token in tokens:
        token_estimate = estimate_tokens(token)

        if current_token_count + token_estimate > max_tokens and current_chunk:
            chunks.append(current_chunk)
            current_chunk = token
            current_token_count = token_estimate
        else:
            current_chunk += token
            current_token_count += token_estimate

    if current_chunk:
        chunks.append(current_chunk)

    return chunks

def extract_text_with_context(html: str) -> str:
    """Extracts text content using BeautifulSoup, preserving some structure with newlines."""
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    # Use newline separator to maintain some structure, strip extra whitespace
    return soup.get_text(separator="\n", strip=True)

def deduplicate_products(products: list[Product]) -> list[Product]:
    """Removes duplicate products based on name and price, keeping the first encountered."""
    seen = set()
    deduped_list = []
    for product in products:
        # Create a unique identifier tuple (handle None price/name)
        identifier = (
            product.name.strip().lower() if product.name else None, 
            product.price if product.price is not None else None
        )
        # Add slightly more robust check if name/price are None
        if identifier == (None, None):
             # If both are None, maybe use image URL or description as fallback? For now, treat as unique.
             # Let's add a check for image_url as a fallback identifier
             fallback_identifier = str(product.image_url) if product.image_url else None
             if fallback_identifier and fallback_identifier not in seen:
                 seen.add(fallback_identifier)
                 deduped_list.append(product)
             elif not fallback_identifier:
                 # If no name, price, or image_url, consider it unique for now or log?
                 deduped_list.append(product)
                 logger.debug("Product with no name, price, or image_url treated as unique.")
             else:
                 logger.debug(f"Deduplicating product based on fallback identifier (image_url): {fallback_identifier}")
                 
        elif identifier not in seen:
            seen.add(identifier)
            deduped_list.append(product)
        else:
            logger.debug(f"Deduplicating product: Name='{product.name}', Price={product.price}")
            
    return deduped_list
