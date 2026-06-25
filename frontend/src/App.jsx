import { useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [revealedAnswers, setRevealedAnswers] = useState({});

  const handleAnalyze = async () => {
    setError("");
    setResult(null);
    setRevealedAnswers({});
    setLoading(true);

    try {
      let response;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        response = await fetch(`${API_URL}/analyze-pdf`, {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch(`${API_URL}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Ein Fehler ist aufgetreten.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Verbindung zum Server fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (index) => {
    setRevealedAnswers((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setText("");
    } else {
      setFile(null);
      setError("Nur PDF-Dateien sind erlaubt.");
    }
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>NeuroLearn AI</h1>
        <p className="subtitle">
          Lerntext eingeben &rarr; KI-Zusammenfassung + Quiz erhalten
        </p>
      </header>

      <main className="main">
        <section className="input-section">
          <div className="input-tabs">
            <button
              className={`tab ${!file ? "active" : ""}`}
              onClick={clearFile}
            >
              Text eingeben
            </button>
            <label className={`tab ${file ? "active" : ""}`}>
              PDF hochladen
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                hidden
              />
            </label>
          </div>

          {file ? (
            <div className="file-info">
              <span>📄 {file.name}</span>
              <button className="clear-btn" onClick={clearFile}>
                &times;
              </button>
            </div>
          ) : (
            <textarea
              className="text-input"
              placeholder="Füge deinen Lerntext hier ein..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
            />
          )}

          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading || (!text.trim() && !file)}
          >
            {loading ? (
              <span className="loading-text">
                <span className="spinner"></span> Analysiere...
              </span>
            ) : (
              "Analysieren"
            )}
          </button>

          {error && <p className="error">{error}</p>}
        </section>

        {result && (
          <section className="result-section">
            <div className="result-block">
              <h2>Zusammenfassung</h2>
              <p className="summary">{result.zusammenfassung}</p>
            </div>

            <div className="result-block">
              <h2>Quiz ({result.quiz.length} Fragen)</h2>
              <ol className="quiz-list">
                {result.quiz.map((item, index) => (
                  <li key={index} className="quiz-item">
                    <p className="question">{item.frage}</p>
                    <button
                      className="reveal-btn"
                      onClick={() => toggleAnswer(index)}
                    >
                      {revealedAnswers[index]
                        ? "Antwort verbergen"
                        : "Antwort zeigen"}
                    </button>
                    {revealedAnswers[index] && (
                      <p className="answer">{item.antwort}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
