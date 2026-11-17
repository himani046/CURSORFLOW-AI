from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Literal
from services.ai_provider import generate_text
from services.extractors import extract_pdf, extract_web
from services.readability import grade
from io import BytesIO

router = APIRouter()

class SimplifyRequest(BaseModel):
    text: str
    mode: Literal["easy_read", "eli5", "action_items"] = "easy_read"
    target_lang: str = "en-IN"

def build_result(source: str, mode: str, lang: str):
    if not source.strip():
        raise HTTPException(400, "No readable text was found.")
    prompt = (
        "Rewrite the supplied content accurately for accessibility. Do not invent facts or omit warnings. "
        "Use short sentences, common words, clear headings and actionable bullets. "
        f"Output language: {lang}. Format: {mode}. Include a concise plain-language version and key points.\n\n"
        f"CONTENT:\n{source[:24000]}"
    )
    simplified, provider, provider_error = generate_text(prompt, fallback=local_simplify(source, mode))
    return {
        "extracted_source_text": source[:24000], "simplified_text": simplified,
        "english_parallel": simplified if lang.startswith("en") else None,
        "bullet_points": [x.strip("- •") for x in simplified.splitlines() if x.strip().startswith(("-", "•"))][:12],
        "original_grade": grade(source), "simplified_grade": grade(simplified),
        "target_lang": lang, "mode": mode, "provider": provider,
        "provider_error": provider_error
    }

def local_simplify(source: str, mode: str) -> str:
    sentences = [s.strip() for s in source.replace("\n", " ").split(".") if s.strip()]
    if mode == "action_items":
        return "Steps to consider:\n" + "\n".join(f"- {s}." for s in sentences[:8])
    return "\n".join(f"- {s}." for s in sentences[:8]) if mode == "easy_read" else " ".join(s + "." for s in sentences[:6])

@router.post("/simplify")
def simplify_text(payload: SimplifyRequest):
    return build_result(payload.text, payload.mode, payload.target_lang)

@router.post("/simplify-source")
async def simplify_source(file: UploadFile | None = File(default=None),
                          url: str | None = Form(default=None),
                          mode: str = Form(default="easy_read"),
                          target_lang: str = Form(default="en-IN")):
    if bool(file) == bool(url):
        raise HTTPException(400, "Provide exactly one PDF/TXT file or a URL.")
    if file:
        data = await file.read()
        if len(data) > 12 * 1024 * 1024:
            raise HTTPException(413, "File exceeds 12 MB.")
        name = (file.filename or "").lower()
        if name.endswith(".pdf"):
            source = extract_pdf(BytesIO(data))
        elif name.endswith(".txt"):
            source = data.decode("utf-8", errors="replace")
        else:
            raise HTTPException(415, "Only PDF and TXT files are supported.")
    else:
        source = await extract_web(url)
    return build_result(source, mode, target_lang)
