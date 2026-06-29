# NeuroLearn AI

KI-gestützte Lern-App: Texte hochladen, Zusammenfassung + Quiz erhalten, Fortschritt tracken.

## Tech Stack

- **Frontend:** React (Vite) + TailwindCSS + React Router
- **Backend:** FastAPI (Python) + SQLAlchemy + SQLite
- **Auth:** JWT Authentication
- **KI:** Ollama (lokal, qwen3/llama3)

## Features

- User Accounts (Register/Login)
- Dashboard mit Fortschrittsübersicht und XP-System
- Lernmaterial Upload (Text + PDF)
- KI-Analyse (Zusammenfassung + 10 Quizfragen)
- Bibliothek mit gespeicherten Inhalten
- Quiz-System mit Score Tracking
- Profil mit Lernstatistiken

## Voraussetzungen

- Node.js 18+
- Python 3.11+
- [Ollama](https://ollama.ai) mit einem Modell (z.B. `ollama pull qwen3`)

## Schnellstart

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Ollama

```bash
ollama pull qwen3
ollama serve
```

Dann im Browser: http://localhost:5173

## API Endpoints

### Auth
- `POST /auth/register` — Neuen Account erstellen
- `POST /auth/login` — Einloggen (JWT Token)

### User
- `GET /user/profile` — Profil + Statistiken
- `GET /dashboard` — Dashboard-Daten

### Content
- `POST /analyze` — Text analysieren
- `POST /analyze-pdf` — PDF analysieren
- `GET /library` — Alle Uploads
- `GET /library/{id}` — Upload-Details

### Quiz
- `GET /quiz/{upload_id}` — Quiz laden
- `POST /quiz/submit` — Quiz-Antworten abgeben
