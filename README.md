# CURSORFLOW — AI for Accessibility & Inclusion

CURSORFLOW is an inclusive, multilingual digital-accessibility workspace for reading, listening, speaking, understanding images, and completing everyday tasks more independently.

## Capabilities
- **Voice-first assistant:** Alt+V shortcut, voice dictation, and conversational task guidance.
- **Read aloud (TTS):** Neural MP3 generation using Edge TTS, with browser speech fallback in the UI.
- **Speech-to-text:** Browser microphone dictation, transcript cleanup, and AAC quick-communication phrases.
- **Visual access:** Image description, OCR, visual question answering, spatial zones, and safety cues.
- **Easy Read:** Text, PDF, and URL extraction; AI simplification where configured; readability grade scoring.
- **Adaptive accessibility:** Low-vision, Deaf/HoH, cognitive/dyslexia, and motor/hands-free profiles; language and contrast controls.

## Architecture
- `backend/`: Python 3.10+, FastAPI, Pydantic, Pillow, pypdf, BeautifulSoup, textstat, Edge TTS and optional Gemini.
- `frontend/`: React 18, Vite, TypeScript, Tailwind CSS, Motion and Lenis.

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Windows: copy .env.example .env
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the Vite URL (normally http://localhost:5173). Backend API docs: http://localhost:8000/docs.

## AI configuration
Set `GEMINI_API_KEY` in `backend/.env` to enable Gemini-powered simplification, vision analysis, and assistant responses. Without it, the service still performs real local PDF/HTML extraction, text-statistics scoring, image validation, OCR via Tesseract when installed, browser speech recognition, and neural TTS through Edge TTS; AI-specific functions return an explicit offline fallback rather than pretending model inference occurred.

Optional OCR system dependency: install the Tesseract executable and ensure it is on PATH.

## Accessibility notes
The UI supports keyboard navigation, visible focus, semantic labels, reduced-motion preferences, high contrast, scalable text, and large targets. Voice recognition is browser-dependent and normally requires HTTPS or localhost plus microphone permission. Always verify critical visual hazard descriptions with the environment; automated descriptions can be wrong.

## Tests
```bash
cd backend
pip install -r requirements.txt
pytest -q
```

## Privacy
Images, documents, and text are sent to the configured local backend. When Gemini is configured, relevant content is sent to Google's Gemini API for inference. Do not upload sensitive personal or medical information unless you have reviewed the applicable provider policies and consent requirements.

## License
MIT
