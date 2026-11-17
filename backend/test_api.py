from fastapi.testclient import TestClient
from main import app
client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"

def test_simplify_offline():
    r = client.post("/api/simplify", json={"text":"The applicant shall submit the documentation prior to commencement."})
    assert r.status_code == 200
    body = r.json()
    assert body["original_grade"] is not None
    assert body["simplified_text"]

def test_stt_refine():
    r = client.post("/api/stt-refine", json={"transcript":"hello how are you"})
    assert r.status_code == 200 and r.json()["refined_transcript"]

def test_assistant_offline():
    r = client.post("/api/assistant", json={"message":"Help me plan my day"})
    assert r.status_code == 200 and r.json()["reply"]

def test_vision_rejects_invalid_image():
    r = client.post("/api/vision", files={"image":("bad.jpg",b"not-image","image/jpeg")})
    assert r.status_code == 415

def test_tts_returns_mp3():
    # The live Edge TTS service is external; skip only when network/voice service is unavailable.
    r = client.post("/api/tts", json={"text":"Hello from Cursorflow","lang":"en-IN"})
    if r.status_code == 503:
        return
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("audio/mpeg")
    assert len(r.content) > 100
