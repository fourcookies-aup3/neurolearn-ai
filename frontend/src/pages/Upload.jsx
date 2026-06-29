import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, FileText, Loader2, CheckCircle } from "lucide-react";
import { api } from "../lib/api";

export default function Upload() {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      let res;
      if (file) {
        res = await api.analyzePdf(file);
      } else {
        res = await api.analyze({ text, title: title || "Unbenannt" });
      }
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setText("");
    } else {
      setError("Nur PDF-Dateien sind erlaubt.");
    }
  };

  if (result) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle size={24} className="text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">Analyse fertig!</h1>
          <span className="ml-auto px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-sm text-indigo-300">
            +{result.xp_earned} XP
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-purple-300 mb-3">Zusammenfassung</h2>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{result.zusammenfassung}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-purple-300 mb-4">Quiz ({result.quiz.length} Fragen)</h2>
          <div className="space-y-3">
            {result.quiz.map((q, i) => (
              <div key={i} className="p-4 bg-slate-800 rounded-xl">
                <p className="text-sm font-medium text-slate-200 mb-2">
                  <span className="text-indigo-400 mr-2">{i + 1}.</span>
                  {q.frage}
                </p>
                <p className="text-sm text-emerald-300 pl-5">→ {q.antwort}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/quiz/${result.id}`)}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition"
          >
            Quiz starten
          </button>
          <button
            onClick={() => { setResult(null); setText(""); setTitle(""); setFile(null); }}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium text-slate-300 transition"
          >
            Neuer Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Neues Lernmaterial</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Titel (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            placeholder="z.B. Biologie Kapitel 3"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setFile(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${!file ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}
          >
            Text eingeben
          </button>
          <label className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition ${file ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}>
            PDF hochladen
            <input type="file" accept=".pdf" onChange={handleFileChange} hidden />
          </label>
        </div>

        {file ? (
          <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-xl">
            <FileText size={20} className="text-indigo-400" />
            <span className="text-slate-300 text-sm">{file.name}</span>
            <button onClick={() => setFile(null)} className="ml-auto text-slate-500 hover:text-red-400">&times;</button>
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-y min-h-[200px]"
            placeholder="Füge deinen Lerntext hier ein..."
          />
        )}

        {error && (
          <div className="px-4 py-3 bg-red-950/50 border border-red-800 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || (!text.trim() && !file)}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 rounded-xl font-medium transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analysiere mit KI...
            </>
          ) : (
            <>
              <UploadIcon size={18} />
              Analysieren
            </>
          )}
        </button>
      </div>
    </div>
  );
}
