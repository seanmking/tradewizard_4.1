import json

from llm_interpreter.taxo_engine import classify_products, detect_material, merge_classification_into_products


def test_detect_material_found():
    text = "This shirt is made of cotton and leather"
    materials = detect_material(text, "")
    assert "cotton" in materials, f"Expected 'cotton' in materials, got {materials}"
    assert "leather" in materials, f"Expected 'leather' in materials, got {materials}"


def test_detect_material_unknown():
    text = "This is a random text without known materials"
    materials = detect_material(text, "")
    assert materials == ["unknown"], f"Expected ['unknown'], got {materials}"


def test_classify_and_merge():
    # Prepare raw products
    raw_products = [
        {"id": "p1", "name": "Wooden Table", "description": "A wooden table", "variants": ["p2"], "image_url": ""},
        {"id": "p2", "name": "Table Variant", "description": "Variant of table", "variants": [], "image_url": ""},
    ]
    classified = classify_products(raw_products)
    # Ensure classification output has expected keys
    for c in classified:
        assert "classification_confidence" in c, "classification_confidence missing"
        assert "materials" in c, "materials missing"
        assert "parent_id" in c, "parent_id missing"
        assert "variants" in c, "variants missing"

    merged = merge_classification_into_products(classified, raw_products)
    # merged list should match raw_products length
    assert len(merged) == len(raw_products), f"Expected {len(raw_products)} merged products, got {len(merged)}"
    for p in merged:
        assert "materials" in p, f"materials missing in merged product {p.get('id')}"
        assert "classification_confidence" in p, f"classification_confidence missing in merged product {p.get('id')}"
        assert "parent_id" in p, f"parent_id missing in merged product {p.get('id')}"
        assert "variants" in p, f"variants missing in merged product {p.get('id')}"


if __name__ == "__main__":
    test_detect_material_found()
    test_detect_material_unknown()
    test_classify_and_merge()
    print("All taxonomy engine tests passed.")
