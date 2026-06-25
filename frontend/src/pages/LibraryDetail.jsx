import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Brain, Trophy } from "lucide-react";
import { api } from "../lib/api";

export default function LibraryDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUploadDetail(id).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-slate-400 animate-pulse">Laden...</div>;
  if (!data) return <div className="text-red-400">Nicht gefunden</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/library" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition text-sm">
        <ArrowLeft size={16} /> Zurück zur Bibliothek
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center">
          <Brain size={24} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{data.title}</h1>
          <p className="text-sm text-slate-500">{new Date(data.created_at).toLocaleDateString("de-DE")}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-purple-300 mb-3">Zusammenfassung</h2>
        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{data.summary}</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-purple-300 mb-4">Quiz ({data.quiz.length} Fragen)</h2>
        <div className="space-y-3">
          {data.quiz.map((q, i) => (
            <div key={i} className="p-4 bg-slate-800 rounded-xl">
              <p className="text-sm font-medium text-slate-200">
                <span className="text-indigo-400 mr-2">{i + 1}.</span>{q.frage}
              </p>
              <p className="text-sm text-emerald-300 mt-1 pl-5">→ {q.antwort}</p>
            </div>
          ))}
        </div>
      </div>

      {data.results.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-purple-300 mb-4">Ergebnisse</h2>
          <div className="space-y-2">
            {data.results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
                <Trophy size={16} className="text-amber-400" />
                <span className="text-sm text-slate-300">{r.score}/{r.total} ({r.percentage}%)</span>
                <span className="text-xs text-slate-500 ml-auto">
                  {new Date(r.created_at).toLocaleDateString("de-DE")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        to={`/quiz/${data.id}`}
        className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium text-center transition"
      >
        Quiz starten
      </Link>
    </div>
  );
}
