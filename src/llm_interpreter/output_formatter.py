#!/usr/bin/env python
# /Users/seanking/Projects/tradewizard_4.1/src/llm_interpreter/output_formatter.py

import json
import logging
from typing import Dict, Any, List, Optional

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def format_mcp_results(assessment: Dict[str, Any], mcp_outputs: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Formats multiple MCP outputs into a standardized JSON structure for frontend consumption.
    Aggregates from all MCPs and assessment record, logs every extraction and fallback.
    """
    try:
        logger.info("[format_mcp_results] Starting output aggregation for assessment %s", assessment.get("id"))
        summary = extract_summary(assessment, mcp_outputs)
        logger.info("[format_mcp_results] Extracted summary: %r", summary)
        products = extract_products(assessment, mcp_outputs)
        logger.info("[format_mcp_results] Extracted products: %r", products)
        certifications = extract_certifications(assessment, mcp_outputs)
        logger.info("[format_mcp_results] Extracted certifications: %r", certifications)
        contacts = extract_contacts(assessment, mcp_outputs)
        logger.info("[format_mcp_results] Extracted contacts: %r", contacts)
        confidence_score = calculate_overall_confidence(mcp_outputs)
        logger.info("[format_mcp_results] Calculated confidence score: %r", confidence_score)
        social_links = extract_social_links(assessment)
        logger.info("[format_mcp_results] Extracted social links: %r", social_links)
        standardized_output = {
            "summary": summary,
            "products": products,
            "certifications": certifications,
            "contacts": contacts,
            "confidence_score": confidence_score,
            "social_links": social_links,
            "llm_ready": False,  # Reset so it doesn't get processed again
            "llm_processed_at": assessment.get("llm_processed_at"),
            "fallback_reason": None
        }
        # Remove empty fields, but log what is being removed
        cleaned_output = {}
        for k, v in standardized_output.items():
            if v is not None and (not isinstance(v, list) or len(v) > 0):
                cleaned_output[k] = v
            else:
                logger.debug(f"[format_mcp_results] Removing empty field: {k}")
        logger.info("[format_mcp_results] Final standardized output: %r", cleaned_output)
        return cleaned_output
    except Exception as e:
        logger.error(f"Error formatting MCP results: {e}", exc_info=True)
        return {
            "summary": "Error formatting results",
            "products": [],
            "certifications": [],
            "fallback_reason": f"Error: {str(e)}",
            "llm_ready": False
        }

def extract_summary(assessment: Dict[str, Any], mcp_outputs: Dict[str, Dict[str, Any]]) -> str:
    """Extract or generate a summary from any available MCP or assessment."""
    # 1. Try to extract from any MCP output (prioritize WebsiteAnalysisMCP, fallback to others)
    for mcp_name in ["WebsiteAnalysisMCP", "HSCodeMCP", "ComplianceMCP"]:
        mcp = mcp_outputs.get(mcp_name)
        if mcp and "result" in mcp and isinstance(mcp["result"], dict):
            summary = mcp["result"].get("summary")
            if summary:
                logger.debug(f"[extract_summary] Found summary in {mcp_name}: {summary}")
                return summary
    # 2. Try to extract from assessment raw_content
    raw_content = assessment.get("raw_content", "{}")
    try:
        content_json = json.loads(raw_content)
        if isinstance(content_json, dict) and "description" in content_json:
            logger.debug(f"[extract_summary] Found description in assessment raw_content: {content_json['description']}")
            return content_json["description"]
    except (json.JSONDecodeError, TypeError):
        logger.debug("[extract_summary] Could not parse assessment raw_content for description.")
    # 3. Fallback
    fallback = f"Analysis of {assessment.get('source_url', 'unknown website')}"
    logger.debug(f"[extract_summary] Using fallback summary: {fallback}")
    return fallback

def extract_products(assessment: Dict[str, Any], mcp_outputs: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Robustly extract products from MCP outputs or assessment, unify, deduplicate, and ensure all fields are present.
    Order:
      1. WebsiteAnalysisMCP (preferred)
      2. Other MCP keys
      3. assessment['products']
      4. assessment['output_json']['products']
    """
    print("[extract_products] assessment dict at extraction:", json.dumps(assessment, default=str, indent=2))
    products = []

    # 1. Try the expected MCP key
    products = mcp_outputs.get("WebsiteAnalysisMCP", {}).get("result", {}).get("products", [])

    # 2. If not found, check other known MCP keys (e.g., legacy or aliased names)
    if not products:
        for key in mcp_outputs:
            maybe = mcp_outputs[key].get("result", {}).get("products", [])
            if maybe:
                products = maybe
                break

    # 3. Fallback to assessment-level storage
    if not products:
        products = assessment.get("products", [])

    # 4. Fallback to output_json (if used)
    if not products:
        products = assessment.get("output_json", {}).get("products", [])

    # Debug logging
    print("[extract_products] Final products found:", products)

    # Unification/deduplication/field shaping (as before)
    def normalize_name(name):
        if not name:
            return ''
        return name.lower().strip().rstrip('.,:;•·')

    deduped = {}
    for p in products:
        key = normalize_name(p.get("name"))
        if key not in deduped:
            deduped[key] = {"regex": None, "llm": None, "both": None}
        src = p.get("source")
        if src == "regex":
            deduped[key]["regex"] = p
        elif src == "llm":
            deduped[key]["llm"] = p
        elif src == "both":
            deduped[key]["both"] = p
        else:
            # If no source, treat as llm by default for legacy
            deduped[key]["llm"] = p

    def shape_product(prod, default_source=None, default_confidence=None):
        return {
            "name": prod.get("name") or None,
            "category": prod.get("category") or None,
            "price": prod.get("price") if prod.get("price") is not None else None,
            "image_url": prod.get("image_url") if prod.get("image_url") is not None else None,
            "description": prod.get("description") if prod.get("description") is not None else None,
            "found_on_pages": prod.get("found_on_pages") if prod.get("found_on_pages") is not None else None,
            "source": prod.get("source") or default_source or None,
            "confidence": prod.get("confidence") if prod.get("confidence") is not None else default_confidence,
            "estimated_hs_code": prod.get("estimated_hs_code") if prod.get("estimated_hs_code") is not None else ""
        }

    merged_products = []
    for key, val in deduped.items():
        # Prefer both > llm > regex
        if val["both"]:
            merged_products.append(shape_product(val["both"], default_source="both", default_confidence=1.0))
        elif val["llm"] and val["regex"]:
            merged = {
                "name": val["regex"].get("name") or val["llm"].get("name"),
                "category": val["regex"].get("category") or val["llm"].get("category"),
                "price": val["regex"].get("price") or val["llm"].get("price"),
                "image_url": val["regex"].get("image_url") or val["llm"].get("image_url"),
                "description": val["llm"].get("description") or val["regex"].get("description"),
                "found_on_pages": list(set((val["regex"].get("found_on_pages") or []) + (val["llm"].get("found_on_pages") or []))),
                "source": "both",
                "confidence": 1.0,
                "estimated_hs_code": val["regex"].get("estimated_hs_code") or val["llm"].get("estimated_hs_code") or ""
            }
            merged_products.append(shape_product(merged, default_source="both", default_confidence=1.0))
        elif val["llm"]:
            merged_products.append(shape_product(val["llm"], default_source="llm", default_confidence=0.8))
        elif val["regex"]:
            merged_products.append(shape_product(val["regex"], default_source="regex", default_confidence=0.7))

    # Fallback: If nothing deduped, just shape all
    if not merged_products:
        merged_products = [shape_product(p, default_source=p.get("source", "unknown"), default_confidence=p.get("confidence", 0.6)) for p in products]

    # Robust fallbacks for product extraction
    if not products:
        products = assessment.get("products", [])
    if not products:
        products = assessment.get("output_json", {}).get("products", [])
    if not products:
        products = assessment.get("llm_raw_response", {}).get("products", [])
    print("[extract_products] Final products found:", products)
    if not merged_products:
        merged_products = [shape_product(p, default_source=p.get("source", "unknown"), default_confidence=p.get("confidence", 0.6)) for p in products]

    return merged_products


def extract_certifications(assessment: Dict[str, Any], mcp_outputs: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extract certification information from all MCP outputs and assessment."""
    certifications = []
    seen = set()
    # 1. Aggregate from ComplianceMCP
    mcp = mcp_outputs.get("ComplianceMCP")
    if mcp and "result" in mcp and "required_certs" in mcp["result"]:
        required_certs = mcp["result"]["required_certs"]
        target_market = assessment.get("target_market", "Global")
        for cert in required_certs:
            key = (cert, target_market)
            if key not in seen:
                certifications.append({
                    "name": cert,
                    "required_for": [target_market],
                    "status": "required"
                })
                seen.add(key)
    # 2. Assessment record (products array)
    for product in assessment.get("products", []):
        for cert in product.get("certifications", []):
            key = (cert, "from_product")
            if key not in seen:
                certifications.append({
                    "name": cert,
                    "required_for": ["from_product"],
                    "status": "from_product"
                })
                seen.add(key)
    logger.debug(f"[extract_certifications] Final certifications list: {certifications}")
    return certifications

def extract_contacts(assessment: Dict[str, Any], mcp_outputs: Dict[str, Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Extract contact information from MCP outputs and assessment."""
    # 1. Try to extract from WebsiteAnalysisMCP (if present)
    mcp = mcp_outputs.get("WebsiteAnalysisMCP")
    if mcp and "result" in mcp and isinstance(mcp["result"], dict):
        contacts = mcp["result"].get("contacts")
        if contacts:
            logger.debug(f"[extract_contacts] Found contacts in WebsiteAnalysisMCP: {contacts}")
            return contacts
    # 2. Try to extract from assessment raw_content
    raw_content = assessment.get("raw_content", "{}")
    try:
        content_json = json.loads(raw_content)
        if isinstance(content_json, dict) and "mainContent" in content_json:
            main_content = content_json["mainContent"]
            contacts = {}
            import re
            email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', main_content)
            if email_match:
                contacts["email"] = email_match.group(0)
            phone_match = re.search(r'(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', main_content)
            if phone_match:
                contacts["phone"] = phone_match.group(0)
            if contacts:
                logger.debug(f"[extract_contacts] Extracted contacts from raw_content: {contacts}")
                return contacts
    except (json.JSONDecodeError, TypeError):
        logger.debug("[extract_contacts] Could not parse assessment raw_content for contacts.")
    logger.debug("[extract_contacts] No contacts found.")
    return None

def extract_social_links(assessment: Dict[str, Any]) -> Optional[Dict[str, str]]:
    """Extract social media links from the assessment."""
    # Try to extract from raw content
    raw_content = assessment.get("raw_content", "{}")
    try:
        content_json = json.loads(raw_content)
        if isinstance(content_json, dict) and "mainContent" in content_json:
            main_content = content_json["mainContent"]
            social_links = {}
            
            # Simple extraction of common social media links
            import re
            facebook_match = re.search(r'facebook\.com/[\w.-]+', main_content)
            if facebook_match:
                social_links["facebook"] = f"https://www.{facebook_match.group(0)}"
            
            instagram_match = re.search(r'instagram\.com/[\w.-]+', main_content)
            if instagram_match:
                social_links["instagram"] = f"https://www.{instagram_match.group(0)}"
            
            twitter_match = re.search(r'twitter\.com/[\w.-]+', main_content)
            if twitter_match:
                social_links["twitter"] = f"https://www.{twitter_match.group(0)}"
            
            return social_links if social_links else None
    except (json.JSONDecodeError, TypeError):
        pass
    
    return None

def calculate_overall_confidence(mcp_outputs: Dict[str, Dict[str, Any]]) -> float:
    """Calculate an overall confidence score based on individual MCP confidences."""
    confidences = []
    
    for mcp_name, output in mcp_outputs.items():
        if "confidence" in output and output["confidence"] is not None:
            confidences.append(float(output["confidence"]))
    
    # Return average confidence if available, otherwise a default value
    return sum(confidences) / len(confidences) if confidences else 0.75
