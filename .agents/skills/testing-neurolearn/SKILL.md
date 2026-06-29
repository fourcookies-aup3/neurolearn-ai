---
name: testing-neurolearn-ai
description: Test the NeuroLearn AI app end-to-end. Use when verifying frontend UI, backend API, or Ollama integration changes.
---

# Testing NeuroLearn AI

## Architecture
- **Frontend:** React + Vite (default port 5173)
- **Backend:** FastAPI (default port 8000)
- **AI:** Ollama API at localhost:11434 (model: qwen3)

## Running Locally

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

### Ollama (required for full e2e)
```bash
ollama pull qwen3
ollama serve
```

## Key Test Flows

### 1. UI State Management
- Initial load: "Analysieren" button should be disabled (no text)
- After typing text: button should become enabled
- During analysis: button shows spinner + "Analysiere..." text and is disabled
- After error/success: button returns to normal enabled state

### 2. Error Handling (Ollama unavailable)
- Without Ollama running, clicking "Analysieren" should show red error banner
- Expected error message: "Ollama ist nicht erreichbar. Stelle sicher, dass Ollama auf localhost:11434 läuft."
- This proves the full request pipeline works (frontend → backend → Ollama attempt → error → display)

### 3. PDF Upload
- "PDF hochladen" tab opens native file picker filtered to *.pdf
- After selecting a PDF, textarea is replaced with file info display
- Clicking "Text eingeben" tab reverts to textarea mode

### 4. Backend API Validation
```bash
# Health check
curl http://localhost:8000/health
# Expected: {"status":"ok"}

# Empty text validation
curl -X POST http://localhost:8000/analyze -H "Content-Type: application/json" -d '{"text": ""}'
# Expected: 400 {"detail":"Text darf nicht leer sein."}

# Whitespace-only validation
curl -X POST http://localhost:8000/analyze -H "Content-Type: application/json" -d '{"text": "   "}'
# Expected: 400 {"detail":"Text darf nicht leer sein."}
```

### 5. Happy Path (requires Ollama)
- Enter text → click Analysieren → wait for response
- Expected: "Zusammenfassung" section with summary text
- Expected: "Quiz (10 Fragen)" section with 10 numbered questions
- Each question has "Antwort zeigen" button that reveals the answer

## Environment Notes
- Frontend default API URL is `http://localhost:8000` (configurable via VITE_API_URL env var)
- If port 5173 is in use, Vite auto-selects next available (5174, etc.)
- Backend timeout for Ollama is 300s (large texts may take time)
- Max text length: 50,000 characters

## Devin Secrets Needed
- None required for basic testing
- Ollama must be installed and running locally for full e2e AI testing
