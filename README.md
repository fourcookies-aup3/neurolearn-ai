# NeuroLearn AI

KI-gestützte Lern-App: Texte eingeben, Zusammenfassung + Quiz erhalten.

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** FastAPI (Python)
- **KI:** Ollama (lokal, qwen3/llama3)

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

## API

- `POST /analyze` — Text analysieren (JSON: `{"text": "..."}`)
- `POST /analyze-pdf` — PDF hochladen und analysieren (multipart/form-data)
- `GET /health` — Health Check
