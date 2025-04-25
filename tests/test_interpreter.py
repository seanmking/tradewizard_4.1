import os
import json
import pytest
import importlib.util

# Load the interpreter module
src_path = os.path.join(os.getcwd(), "src", "llm_interpreter", "interpreter.py")
spec = importlib.util.spec_from_file_location("interpreter", src_path)
interpreter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(interpreter)
process_assessment = interpreter.process_assessment
openai_mod = interpreter.openai

# Dummy response to simulate OpenAI output
class DummyResp:
    def __init__(self, text):
        msg = type("m", (), {"content": text})
        choice = type("c", (), {"message": msg()})
        self.choices = [choice()]

# Fake Supabase table client to capture updates
class FakeTable:
    def __init__(self):
        self.updated_data = None
        self.eq_called = None
    def update(self, data):
        self.updated_data = data
        return self
    def eq(self, field, value):
        self.eq_called = (field, value)
        return self
    def execute(self):
        return None

class FakeSB:
    def __init__(self, table):
        self._table = table
    def table(self, name):
        return self._table

@pytest.fixture(autouse=True)
def fake_environment(monkeypatch):
    table = FakeTable()
    # Override sb client
    monkeypatch.setattr(interpreter, "sb", FakeSB(table))
    yield table

# Success scenario: valid JSON
def test_process_success(fake_environment, monkeypatch):
    valid = {"summary": "Test", "products": [], "certifications": [], "contacts": {"email": "", "phone": "", "address": ""}}
    resp_text = json.dumps(valid)
    monkeypatch.setattr(openai_mod.chat.completions, "create", lambda *a, **k: DummyResp(resp_text))
    record = {"id": "ID1", "raw_content": "data"}
    process_assessment(record)
    upd = fake_environment.updated_data
    assert upd["summary"] == "Test"
    assert upd["status"] == "completed"
    assert upd["llm_ready"] is False

# Error scenario: LLM throws
def test_process_error(fake_environment, monkeypatch):
    monkeypatch.setattr(openai_mod.chat.completions, "create", lambda *a, **k: (_ for _ in ()).throw(ValueError("fail")))
    record = {"id": "ID2", "raw_content": "data"}
    process_assessment(record)
    upd = fake_environment.updated_data
    assert upd["status"] == "error"
    assert "fail" in upd["fallback_reason"]
    assert upd["llm_ready"] is False
