from fastapi import APIRouter
from pydantic import BaseModel, Field
from services.ai_provider import generate_text

router = APIRouter()
class AssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    history: list[dict] = []
    target_lang: str = "en-IN"
    bilingual: bool = False

@router.post("/assistant")
def assistant(payload: AssistantRequest):
    history = "\n".join(f"{x.get('role','user')}: {str(x.get('content',''))[:1000]}" for x in payload.history[-8:])
    prompt = (
      "You are CURSORFLOW, a patient accessibility assistant. Give practical, step-by-step help. "
      "Use plain language. For medical, legal, or financial topics, explain information but do not diagnose, "
      "make decisions, or replace a qualified professional. Never fabricate facts. "
      f"Answer in {payload.target_lang}. Bilingual requested: {payload.bilingual}.\n"
      f"Conversation:\n{history}\nUser: {payload.message}"
    )
    reply, provider = generate_text(prompt, fallback=(
      "I can help break this into steps.\n\n"
      "1. Tell me the goal and any important details.\n"
      "2. We can organise the information into small steps.\n"
      "3. Check important decisions with the relevant professional or official source."
    ))
    steps = [x.strip("- •0123456789.").strip() for x in reply.splitlines()
             if x.strip() and (x.strip().startswith(("-", "•")) or x.strip()[0].isdigit())]
    return {"reply": reply, "english_parallel": reply if payload.bilingual else None,
            "action_steps": steps[:10], "provider": provider}
