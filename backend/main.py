from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import json
import re
from typing import Optional

app = FastAPI(title="NeuroLearn AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen3"

SYSTEM_PROMPT = """Du bist ein Lernassistent.
Fasse den folgenden Inhalt einfach und verständlich zusammen.
Erstelle danach 10 Quizfragen mit Antworten.

Antworte IMMER in diesem exakten JSON-Format (keine Markdown-Codeblöcke, nur reines JSON):
{
  "zusammenfassung": "Deine Zusammenfassung hier...",
  "quiz": [
    {"frage": "Frage 1?", "antwort": "Antwort 1"},
    {"frage": "Frage 2?", "antwort": "Antwort 2"}
  ]
}

Wichtig:
- Genau 10 Quizfragen erstellen
- Nur valides JSON ausgeben, KEIN Markdown
- Keine zusätzlichen Erklärungen außerhalb des JSON"""


class AnalyzeRequest(BaseModel):
    text: str


class QuizItem(BaseModel):
    frage: str
    antwort: str


class AnalyzeResponse(BaseModel):
    zusammenfassung: str
    quiz: list[QuizItem]


def extract_json_from_response(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code blocks."""
    # Try to find JSON in code blocks first
    code_block_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if code_block_match:
        text = code_block_match.group(1).strip()

    # Try to find JSON object directly
    json_match = re.search(r"\{.*\}", text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass

    # Last resort: try parsing the whole text
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        raise ValueError("Could not parse JSON from LLM response")


async def call_ollama(text: str) -> dict:
    """Send text to Ollama and get structured response."""
    prompt = f"{SYSTEM_PROMPT}\n\nHier ist der Lerntext:\n\n{text}"

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 4096,
        },
    }

    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
        except httpx.ConnectError:
            raise HTTPException(
                status_code=503,
                detail="Ollama ist nicht erreichbar. Stelle sicher, dass Ollama auf localhost:11434 läuft.",
            )
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Ollama Fehler: {e.response.status_code}",
            )

    result = response.json()
    raw_response = result.get("response", "")

    try:
        parsed = extract_json_from_response(raw_response)
    except ValueError:
        raise HTTPException(
            status_code=500,
            detail="KI-Antwort konnte nicht verarbeitet werden. Bitte versuche es erneut.",
        )

    return parsed


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """Analyze learning text and return summary + quiz."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text darf nicht leer sein.")

    if len(request.text) > 50000:
        raise HTTPException(
            status_code=400, detail="Text ist zu lang (max. 50.000 Zeichen)."
        )

    result = await call_ollama(request.text)
    return AnalyzeResponse(
        zusammenfassung=result.get("zusammenfassung", "Keine Zusammenfassung generiert."),
        quiz=[
            QuizItem(frage=q.get("frage", ""), antwort=q.get("antwort", ""))
            for q in result.get("quiz", [])
        ],
    )


@app.post("/analyze-pdf", response_model=AnalyzeResponse)
async def analyze_pdf(file: UploadFile = File(...)):
    """Analyze uploaded PDF and return summary + quiz."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Nur PDF-Dateien sind erlaubt.")

    try:
        import PyPDF2
        import io

        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
    except Exception:
        raise HTTPException(
            status_code=400, detail="PDF konnte nicht gelesen werden."
        )

    if not text.strip():
        raise HTTPException(
            status_code=400, detail="PDF enthält keinen extrahierbaren Text."
        )

    if len(text) > 50000:
        text = text[:50000]

    result = await call_ollama(text)
    return AnalyzeResponse(
        zusammenfassung=result.get("zusammenfassung", "Keine Zusammenfassung generiert."),
        quiz=[
            QuizItem(frage=q.get("frage", ""), antwort=q.get("antwort", ""))
            for q in result.get("quiz", [])
        ],
    )


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
