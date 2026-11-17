import os, json, logging
from google import genai
from google.genai import types

logger = logging.getLogger("cursorflow.ai")

def _model_name():
    configured = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
    # Gemini 2.5 Flash access is restricted for some newer projects.
    # Transparently migrate the old project default to Google's current stable Flash model.
    if configured == "gemini-2.5-flash":
        logger.warning("GEMINI_MODEL=gemini-2.5-flash is not available to some projects; using gemini-3.6-flash.")
        return "gemini-3.6-flash"
    return configured or "gemini-3.6-flash"

def _client():
    key = os.getenv("GEMINI_API_KEY")
    return genai.Client(api_key=key) if key else None

def _error_message(exc: Exception) -> str:
    """Return a useful, key-safe diagnostic for local development."""
    raw = str(exc).replace(os.getenv("GEMINI_API_KEY", "__NO_KEY__"), "[REDACTED]")
    lowered = raw.lower()
    if any(token in lowered for token in ("401", "api key not valid", "invalid api key", "unauthenticated")):
        return "Gemini rejected the API key. Check that GEMINI_API_KEY is valid and active."
    if any(token in lowered for token in ("403", "permission_denied", "permission denied")):
        return "Gemini access was denied. Check API access, project restrictions, and billing settings."
    if any(token in lowered for token in ("429", "resource_exhausted", "quota", "rate limit")):
        return "Gemini quota or rate limit reached. Check usage and quota in Google AI Studio."
    if any(token in lowered for token in ("404", "not found", "model not found")):
        return f"Gemini model '{os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')}' was not found or is unavailable to this API key."
    if any(token in lowered for token in ("timeout", "timed out", "connection", "network")):
        return "Could not reach Gemini. Check your internet connection and try again."
    return f"Gemini request failed ({type(exc).__name__}): {raw[:500] or 'No additional details returned.'}"

def generate_text(prompt: str, fallback: str):
    client = _client()
    if client is None:
        return fallback, "offline_fallback", "GEMINI_API_KEY is missing from the backend environment."
    try:
        response = client.models.generate_content(
            model=_model_name(), contents=prompt)
        text = (response.text or "").strip()
        if not text:
            return fallback, "offline_fallback", "Gemini returned an empty response."
        return text, "gemini", None
    except Exception as exc:
        diagnostic = _error_message(exc)
        logger.exception("Gemini text generation failed: %s", diagnostic)
        return fallback, "offline_fallback", diagnostic

def generate_vision(prompt: str, image_b64: str, fallback: dict):
    client = _client()
    if client is None:
        return fallback, "offline_fallback", "GEMINI_API_KEY is missing from the backend environment."
    try:
        import base64
        image_bytes = base64.b64decode(image_b64)
        response = client.models.generate_content(
            model=_model_name(),
            contents=[prompt, types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")])
        text = response.text or ""
        if not text.strip():
            return fallback, "offline_fallback", "Gemini returned an empty response."
        start, end = text.find("{"), text.rfind("}")
        if start >= 0 and end > start:
            try:
                parsed = json.loads(text[start:end+1])
                return parsed, "gemini", None
            except json.JSONDecodeError:
                logger.warning("Gemini vision response was not valid JSON; returning its text as description.")
        return {**fallback, "description": text.strip()}, "gemini", None
    except Exception as exc:
        diagnostic = _error_message(exc)
        logger.exception("Gemini vision generation failed: %s", diagnostic)
        return fallback, "offline_fallback", diagnostic

def check_gemini_connection():
    client = _client()
    model = _model_name()
    if client is None:
        return {"configured": False, "connected": False, "model": model,
                "message": "GEMINI_API_KEY is missing from the backend environment."}
    try:
        response = client.models.generate_content(model=model, contents="Reply with OK only.")
        if not (response.text or "").strip():
            return {"configured": True, "connected": False, "model": model,
                    "message": "Gemini API responded but returned an empty response."}
        return {"configured": True, "connected": True, "model": model,
                "message": "Gemini connection and text generation succeeded."}
    except Exception as exc:
        diagnostic = _error_message(exc)
        logger.exception("Gemini connection diagnostic failed: %s", diagnostic)
        return {"configured": True, "connected": False, "model": model, "message": diagnostic}
