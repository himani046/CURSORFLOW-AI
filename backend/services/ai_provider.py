import os, json
from google import genai
from google.genai import types

def _client():
    key = os.getenv("GEMINI_API_KEY")
    return genai.Client(api_key=key) if key else None

def generate_text(prompt: str, fallback: str):
    client = _client()
    if client is None:
        return fallback, "offline_fallback"
    try:
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"), contents=prompt)
        text = (response.text or "").strip()
        return (text or fallback), "gemini"
    except Exception:
        return fallback, "offline_fallback"

def generate_vision(prompt: str, image_b64: str, fallback: dict):
    client = _client()
    if client is None:
        return fallback, "offline_fallback"
    try:
        import base64
        image_bytes = base64.b64decode(image_b64)
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=[prompt, types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")])
        text = response.text or ""
        # Parse model JSON if it produced a JSON object; otherwise preserve the response as description.
        start, end = text.find("{"), text.rfind("}")
        if start >= 0 and end > start:
            parsed = json.loads(text[start:end+1])
            return parsed, "gemini"
        return {**fallback, "description": text.strip()}, "gemini"
    except Exception:
        return fallback, "offline_fallback"
