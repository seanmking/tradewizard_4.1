import re
from typing import List, Dict, Any
import json
from openai import OpenAI

# List of known material keywords for text detection
MATERIAL_KEYWORDS = ["cotton", "wool", "leather", "plastic", "metal", "wood", "silk", "linen"]

def classify_products(raw_products_json):
    # Debug input
    print(" DEBUG BACKEND  raw_products_json:", raw_products_json)

    # Call OpenAI
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{
            "role": "user",
            "content": (
                "You are an expert taxonomy classifier.\n\n"
                f"Raw data: {raw_products_json}\n\n"
                "Task: Return a JSON list of objects with fields 'parent', 'variants', and 'materials'."
            )
        }]
    )
    classified = json.loads(response.choices[0].message.content)

    # Debug output
    print(" DEBUG BACKEND  classify_products returned:", classified)

    return classified


def merge_classification_into_products(
    classified: List[Dict[str, Any]],
    raw_products_json: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Merge classification results back into raw product records.
    """
    merged = []
    for cls in classified:
        parent_name = cls.get("parent")
        rp = next((p for p in raw_products_json if p.get("name") == parent_name), None)
        if not rp:
            rp = {"name": parent_name, "category": None, "id": None}
        merged.append({
            "name": rp.get("name"),
            "category": rp.get("category"),
            "id": rp.get("id"),
            "parent_id": rp.get("id"),
            "variants": cls.get("variants", []),
            "materials": cls.get("materials", []),
            "classification_confidence": cls.get("classification_confidence", 0)
        })
    return merged


def detect_material(text: str, image_url: str) -> List[str]:
    """
    Detect materials from text using keyword matching, fallback to image analysis if needed.
    """
    text_lower = text.lower()
    found = [kw for kw in MATERIAL_KEYWORDS if kw in text_lower]
    if found:
        return found
    # Fallback: Could integrate an image-based model here.
    return ["unknown"]
