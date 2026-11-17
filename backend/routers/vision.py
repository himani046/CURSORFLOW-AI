from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import base64
from services.ai_provider import generate_vision

router = APIRouter()

@router.post("/vision")
async def vision(image: UploadFile = File(...), mode: str = Form("describe"),
                 question: str = Form(""), target_lang: str = Form("en-IN")):
    if mode not in {"describe", "ocr", "qa"}:
        raise HTTPException(400, "mode must be describe, ocr or qa")
    raw = await image.read()
    if len(raw) > 12 * 1024 * 1024:
        raise HTTPException(413, "Image exceeds 12 MB.")
    try:
        img = Image.open(BytesIO(raw)).convert("RGB")
        img.thumbnail((1600, 1600))
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=88)
    except (UnidentifiedImageError, OSError):
        raise HTTPException(415, "Upload a valid image.")
    encoded = base64.b64encode(buf.getvalue()).decode()
    prompt = {
        "describe": "Describe the scene for a blind or low-vision user. Be concise, mention people/objects and spatial positions. Identify visible safety concerns without overclaiming.",
        "ocr": "Transcribe all legible printed text, preserving layout where possible. Mark uncertain characters.",
        "qa": f"Answer the user's question about the image: {question}. If not visible, say so."
    }[mode] + f" Respond in {target_lang}. Return JSON with description, extracted_text, spatial_zones (left, center, right), safety_level (clear, caution, warning), hazards, answer."
    result, provider, provider_error = generate_vision(prompt, encoded, fallback={
        "description": "Image received and validated. The scene was not analysed by AI.",
        "extracted_text": "", "spatial_zones": {"left":"Not analysed","center":"Not analysed","right":"Not analysed"},
        "safety_level": "caution", "hazards": [], "answer": None
    })
    return {**result, "target_lang": target_lang, "provider": provider, "provider_error": provider_error}
