from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Literal
import edge_tts
import io
from services.ai_provider import generate_text

router = APIRouter()
VOICES = {
 "en-IN":"en-IN-NeerjaNeural", "en-US":"en-US-AriaNeural",
 "hi-IN":"hi-IN-SwaraNeural", "mr-IN":"mr-IN-AarohiNeural",
 "bn-IN":"bn-IN-TanishaaNeural", "ta-IN":"ta-IN-PallaviNeural",
 "te-IN":"te-IN-ShrutiNeural", "gu-IN":"gu-IN-DhwaniNeural"
}
class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=12000)
    lang: str = "en-IN"
    rate: str = "+0%"
class RefineRequest(BaseModel):
    transcript: str = Field(min_length=1, max_length=10000)
    target_lang: str = "en-IN"
    simplify: bool = False

@router.post("/tts")
async def tts(payload: TTSRequest):
    voice = VOICES.get(payload.lang, VOICES["en-IN"])
    try:
        rate = payload.rate if payload.rate.endswith("%") and payload.rate[0] in "+-" else "+0%"
        communicate = edge_tts.Communicate(payload.text, voice, rate=rate)
        audio = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio.extend(chunk["data"])
        if not audio:
            raise RuntimeError("No audio bytes returned")
        return StreamingResponse(io.BytesIO(bytes(audio)), media_type="audio/mpeg",
                                 headers={"Content-Disposition":"inline; filename=cursorflow.mp3"})
    except Exception as exc:
        raise HTTPException(503, f"TTS generation failed: {exc}")

@router.post("/stt-refine")
def refine(payload: RefineRequest):
    prompt = ("Clean up this speech transcript with punctuation and paragraphing. "
              "Do not change its meaning. " + ("Use simpler language. " if payload.simplify else "") +
              f"Output language: {payload.target_lang}.\nTRANSCRIPT:\n{payload.transcript}")
    result, provider, provider_error = generate_text(prompt, fallback=payload.transcript.strip())
    return {"refined_transcript": result, "target_lang": payload.target_lang,
            "provider": provider, "provider_error": provider_error}
