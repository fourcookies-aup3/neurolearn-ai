from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import httpx
import json
import re

from database import Base, engine, get_db
from models import User, Upload, QuizResult, Activity
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="NeuroLearn AI", version="0.2.0")

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


# ==================== SCHEMAS ====================


class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class AnalyzeRequest(BaseModel):
    text: str
    title: str = "Unbenannt"


class QuizItem(BaseModel):
    frage: str
    antwort: str


class AnalyzeResponse(BaseModel):
    id: int
    title: str
    zusammenfassung: str
    quiz: list[QuizItem]
    xp_earned: int


class QuizSubmitRequest(BaseModel):
    upload_id: int
    correct_indices: list[int]  # indices of questions the user self-assessed as correct


# ==================== HELPERS ====================


def extract_json_from_response(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code blocks."""
    code_block_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if code_block_match:
        text = code_block_match.group(1).strip()

    json_match = re.search(r"\{.*\}", text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass

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
        "options": {"temperature": 0.3, "num_predict": 4096},
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
            raise HTTPException(status_code=502, detail=f"Ollama Fehler: {e.response.status_code}")

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


def add_activity(db: Session, user: User, action: str, description: str, xp: int = 0):
    activity = Activity(user_id=user.id, action=action, description=description, xp_earned=xp)
    db.add(activity)
    user.xp += xp
    db.commit()


# ==================== AUTH ENDPOINTS ====================


@app.post("/auth/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert.")
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Benutzername bereits vergeben.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 6 Zeichen haben.")

    user = User(
        email=req.email,
        username=req.username,
        hashed_password=get_password_hash(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    add_activity(db, user, "register", "Account erstellt", xp=10)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "username": user.username, "xp": user.xp},
    )


@app.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Ungültige Anmeldedaten.")

    # Only award XP for first login of the day
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    login_today = (
        db.query(Activity)
        .filter(Activity.user_id == user.id, Activity.action == "login", Activity.created_at >= today_start)
        .first()
    )
    xp = 1 if not login_today else 0
    add_activity(db, user, "login", "Angemeldet", xp=xp)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "username": user.username, "xp": user.xp},
    )


# ==================== USER ENDPOINTS ====================


@app.get("/user/profile")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    uploads_count = db.query(Upload).filter(Upload.user_id == user.id).count()
    quiz_results = db.query(QuizResult).filter(QuizResult.user_id == user.id).all()
    quizzes_taken = len(quiz_results)
    avg_score = sum(r.percentage for r in quiz_results) / quizzes_taken if quizzes_taken > 0 else 0

    activities = (
        db.query(Activity)
        .filter(Activity.user_id == user.id)
        .order_by(Activity.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "xp": user.xp,
        "streak_days": user.streak_days,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "stats": {
            "uploads_count": uploads_count,
            "quizzes_taken": quizzes_taken,
            "avg_score": round(avg_score, 1),
        },
        "recent_activities": [
            {
                "action": a.action,
                "description": a.description,
                "xp_earned": a.xp_earned,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in activities
        ],
    }


# ==================== UPLOAD / ANALYZE ENDPOINTS ====================


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text darf nicht leer sein.")
    if len(req.text) > 50000:
        raise HTTPException(status_code=400, detail="Text ist zu lang (max. 50.000 Zeichen).")

    result = await call_ollama(req.text)

    title = req.title if req.title != "Unbenannt" else req.text[:50].strip() + "..."
    quiz_list = result.get("quiz", [])

    upload = Upload(
        user_id=user.id,
        title=title,
        original_text=req.text,
        summary=result.get("zusammenfassung", ""),
        quiz_data=json.dumps(quiz_list, ensure_ascii=False),
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    xp_earned = 25
    add_activity(db, user, "upload", f"Neues Material: {title}", xp=xp_earned)

    return AnalyzeResponse(
        id=upload.id,
        title=title,
        zusammenfassung=result.get("zusammenfassung", "Keine Zusammenfassung generiert."),
        quiz=[QuizItem(frage=q.get("frage", ""), antwort=q.get("antwort", "")) for q in quiz_list],
        xp_earned=xp_earned,
    )


@app.post("/analyze-pdf", response_model=AnalyzeResponse)
async def analyze_pdf(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
        raise HTTPException(status_code=400, detail="PDF konnte nicht gelesen werden.")

    if not text.strip():
        raise HTTPException(status_code=400, detail="PDF enthält keinen extrahierbaren Text.")
    if len(text) > 50000:
        text = text[:50000]

    result = await call_ollama(text)
    title = file.filename[:file.filename.lower().rfind(".pdf")] or file.filename
    quiz_list = result.get("quiz", [])

    upload = Upload(
        user_id=user.id,
        title=title,
        original_text=text,
        summary=result.get("zusammenfassung", ""),
        quiz_data=json.dumps(quiz_list, ensure_ascii=False),
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    xp_earned = 25
    add_activity(db, user, "upload", f"PDF hochgeladen: {title}", xp=xp_earned)

    return AnalyzeResponse(
        id=upload.id,
        title=title,
        zusammenfassung=result.get("zusammenfassung", "Keine Zusammenfassung generiert."),
        quiz=[QuizItem(frage=q.get("frage", ""), antwort=q.get("antwort", "")) for q in quiz_list],
        xp_earned=xp_earned,
    )


# ==================== LIBRARY ENDPOINTS ====================


@app.get("/library")
def get_library(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    uploads = (
        db.query(Upload)
        .filter(Upload.user_id == user.id)
        .order_by(Upload.created_at.desc())
        .all()
    )

    items = []
    for u in uploads:
        quiz_results = db.query(QuizResult).filter(QuizResult.upload_id == u.id).all()
        best_score = max((r.percentage for r in quiz_results), default=0)
        items.append({
            "id": u.id,
            "title": u.title,
            "summary_preview": u.summary[:150] + "..." if len(u.summary) > 150 else u.summary,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "quiz_count": len(json.loads(u.quiz_data)),
            "best_score": round(best_score, 1),
            "attempts": len(quiz_results),
        })

    return {"items": items, "total": len(items)}


@app.get("/library/{upload_id}")
def get_upload_detail(upload_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id, Upload.user_id == user.id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Inhalt nicht gefunden.")

    quiz_data = json.loads(upload.quiz_data)
    quiz_results = (
        db.query(QuizResult)
        .filter(QuizResult.upload_id == upload.id)
        .order_by(QuizResult.created_at.desc())
        .all()
    )

    return {
        "id": upload.id,
        "title": upload.title,
        "summary": upload.summary,
        "original_text": upload.original_text,
        "quiz": quiz_data,
        "created_at": upload.created_at.isoformat() if upload.created_at else None,
        "results": [
            {
                "score": r.score,
                "total": r.total,
                "percentage": r.percentage,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in quiz_results
        ],
    }


# ==================== QUIZ ENDPOINTS ====================


@app.get("/quiz/{upload_id}")
def get_quiz(upload_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id, Upload.user_id == user.id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Quiz nicht gefunden.")

    quiz_data = json.loads(upload.quiz_data)
    return {
        "upload_id": upload.id,
        "title": upload.title,
        "questions": [{"id": i, "frage": q["frage"], "antwort": q["antwort"]} for i, q in enumerate(quiz_data)],
    }


@app.post("/quiz/submit")
def submit_quiz(req: QuizSubmitRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == req.upload_id, Upload.user_id == user.id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Quiz nicht gefunden.")

    quiz_data = json.loads(upload.quiz_data)
    total = len(quiz_data)
    score = len(req.correct_indices)

    results = []
    for i, q in enumerate(quiz_data):
        is_correct = i in req.correct_indices
        results.append({
            "frage": q["frage"],
            "correct_answer": q.get("antwort", ""),
            "is_correct": is_correct,
        })

    percentage = (score / total * 100) if total > 0 else 0

    quiz_result = QuizResult(
        user_id=user.id,
        upload_id=req.upload_id,
        score=score,
        total=total,
        percentage=percentage,
    )
    db.add(quiz_result)

    xp_earned = 10 + int(percentage / 10)
    add_activity(db, user, "quiz", f"Quiz: {upload.title} ({score}/{total})", xp=xp_earned)

    db.commit()

    return {
        "score": score,
        "total": total,
        "percentage": round(percentage, 1),
        "xp_earned": xp_earned,
        "results": results,
    }


# ==================== DASHBOARD ====================


@app.get("/dashboard")
def get_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    uploads_count = db.query(Upload).filter(Upload.user_id == user.id).count()
    quiz_results = db.query(QuizResult).filter(QuizResult.user_id == user.id).all()
    quizzes_taken = len(quiz_results)
    avg_score = sum(r.percentage for r in quiz_results) / quizzes_taken if quizzes_taken > 0 else 0
    total_xp = user.xp

    recent_uploads = (
        db.query(Upload)
        .filter(Upload.user_id == user.id)
        .order_by(Upload.created_at.desc())
        .limit(5)
        .all()
    )

    recent_activities = (
        db.query(Activity)
        .filter(Activity.user_id == user.id)
        .order_by(Activity.created_at.desc())
        .limit(8)
        .all()
    )

    return {
        "username": user.username,
        "xp": total_xp,
        "streak_days": user.streak_days,
        "stats": {
            "uploads_count": uploads_count,
            "quizzes_taken": quizzes_taken,
            "avg_score": round(avg_score, 1),
        },
        "recent_uploads": [
            {"id": u.id, "title": u.title, "created_at": u.created_at.isoformat() if u.created_at else None}
            for u in recent_uploads
        ],
        "recent_activities": [
            {
                "action": a.action,
                "description": a.description,
                "xp_earned": a.xp_earned,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in recent_activities
        ],
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
