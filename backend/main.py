from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from routers import simplify, vision, speech, assistant
from services.ai_provider import check_gemini_connection

load_dotenv()
app = FastAPI(title="CURSORFLOW Accessibility API", version="1.0.0",
              description="Accessible reading, vision, speech and everyday-task tools.")
origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(simplify.router, prefix="/api", tags=["Easy Read"])
app.include_router(vision.router, prefix="/api", tags=["Visual access"])
app.include_router(speech.router, prefix="/api", tags=["Speech"])
app.include_router(assistant.router, prefix="/api", tags=["Everyday assistant"])

@app.get("/")
def root():
    return {"name": "CURSORFLOW", "status": "ok", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok", "ai_configured": bool(os.getenv("GEMINI_API_KEY"))}

@app.get("/api/diagnostics/gemini")
def gemini_diagnostics():
    """Make a small live Gemini request; reports connection status without exposing the API key."""
    return check_gemini_connection()
