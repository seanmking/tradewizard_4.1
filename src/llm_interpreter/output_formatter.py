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
    
    Args:
        assessment: The original assessment record
        mcp_outputs: Dictionary of MCP outputs keyed by MCP name
        
    Returns:
        A standardized JSON structure with products, certifications, summary, and contacts
    """
    try:
        # Initialize the standardized output structure
        standardized_output = {
            "summary": extract_summary(assessment, mcp_outputs),
            "products": extract_products(assessment, mcp_outputs),
            "certifications": extract_certifications(assessment, mcp_outputs),
            "contacts": extract_contacts(assessment, mcp_outputs),
            "confidence_score": calculate_overall_confidence(mcp_outputs),
            "social_links": extract_social_links(assessment),
            "llm_ready": False,  # Reset so it doesn't get processed again
            "llm_processed_at": assessment.get("llm_processed_at"),
            "fallback_reason": None
        }
        
        # Remove empty fields
        return {k: v for k, v in standardized_output.items() if v is not None}
    
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
    """Extract or generate a summary from the assessment and MCP outputs."""
    # First check if raw_content has a parsed JSON with a description
    raw_content = assessment.get("raw_content", "{}")
    try:
        content_json = json.loads(raw_content)
        if isinstance(content_json, dict) and "description" in content_json:
            return content_json["description"]
    except (json.JSONDecodeError, TypeError):
        pass
    
    # Default summary if nothing else is available
    return f"Analysis of {assessment.get('source_url', 'unknown website')}"

def extract_products(assessment: Dict[str, Any], mcp_outputs: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extract product information from MCP outputs."""
    products = []
    
    # Check HSCodeMCP output for product data
    if "HSCodeMCP" in mcp_outputs:
        hs_output = mcp_outputs["HSCodeMCP"]
        if "result" in hs_output and "products" in hs_output["result"]:
            for product_id, product_data in hs_output["result"]["products"].items():
                # Find the original product info
                product_info = next(
                    (p for p in assessment.get("products", []) if p.get("id") == product_id), 
                    {"id": product_id, "name": "Unknown Product"}
                )
                
                products.append({
                    "id": product_id,
                    "name": product_info.get("name", "Unknown Product"),
                    "description": product_info.get("description", ""),
                    "estimated_hs_code": product_data.get("suggestedHSCode", ""),
                    "category": product_info.get("category", "")
                })
    
    # Check WebsiteAnalysisMCP output
    if "WebsiteAnalysisMCP" in mcp_outputs:
        website_output = mcp_outputs["WebsiteAnalysisMCP"]
        # Look for pre-extracted products in the result, not raw_content
        if "result" in website_output and isinstance(website_output["result"], dict):
            # Check common keys where products might be placed by the MCP
            potential_products = website_output["result"].get("products") or website_output["result"].get("aggregated_products")
            
            if isinstance(potential_products, list):
                for i, product_data in enumerate(potential_products):
                    if isinstance(product_data, dict):
                        name = product_data.get("name", f"Unnamed Product {i}")
                        description = product_data.get("description", "")
                        category = product_data.get("category", "Extracted from website")
                        # Add more fields if available and needed
                        products.append({
                            "name": name,
                            "description": description,
                            "category": category
                        })
            else:
                # Log if products aren't found where expected, but don't treat it as an error parsing raw_content
                logger.debug("No 'products' or 'aggregated_products' list found in WebsiteAnalysisMCP result.")
        else:
            logger.debug("No 'result' dictionary found in WebsiteAnalysisMCP output.")
            
    # Check if raw_content itself is structured (less common for WebsiteAnalysisMCP)
    # This part is kept in case raw_content IS structured JSON sometimes, but separated from MCP results
    raw_content_data = assessment.get("raw_content")
    if isinstance(raw_content_data, dict) and "aggregated_products" in raw_content_data:
        logger.debug("Found 'aggregated_products' directly in assessment's raw_content.")
        for i, product_data in enumerate(raw_content_data["aggregated_products"]):
             if isinstance(product_data, dict):
                name = product_data.get("name", f"Unnamed Raw Product {i}")
                description = product_data.get("description", "")
                category = product_data.get("category", "Extracted from raw_content")
                # Avoid duplicates if already added from MCP output (simple check by name)
                if not any(p['name'] == name for p in products):
                    products.append({
                        "name": name,
                        "description": description,
                        "category": category
                    })

    return products

def extract_certifications(assessment: Dict[str, Any], mcp_outputs: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extract certification information from MCP outputs."""
    certifications = []
    
    # Check ComplianceMCP output for certification data
    if "ComplianceMCP" in mcp_outputs:
        compliance_output = mcp_outputs["ComplianceMCP"]
        if "result" in compliance_output and "required_certs" in compliance_output["result"]:
            required_certs = compliance_output["result"]["required_certs"]
            target_market = assessment.get("target_market", "Global")
            
            for cert in required_certs:
                certifications.append({
                    "name": cert,
                    "required_for": [target_market],
                    "status": "required"
                })
    
    return certifications

def extract_contacts(assessment: Dict[str, Any], mcp_outputs: Dict[str, Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Extract contact information from the assessment and MCP outputs."""
    # Try to extract from raw content first
    raw_content = assessment.get("raw_content", "{}")
    try:
        content_json = json.loads(raw_content)
        if isinstance(content_json, dict) and "mainContent" in content_json:
            # Very basic extraction - in production this would use regex or NLP
            main_content = content_json["mainContent"]
            contacts = {}
            
            # Simple email extraction
            import re
            email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', main_content)
            if email_match:
                contacts["email"] = email_match.group(0)
            
            # Simple phone extraction (very basic)
            phone_match = re.search(r'(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', main_content)
            if phone_match:
                contacts["phone"] = phone_match.group(0)
            
            return contacts if contacts else None
    except (json.JSONDecodeError, TypeError):
        pass
    
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
