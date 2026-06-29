import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Brain, Trophy } from "lucide-react";
import { api } from "../lib/api";

export default function Library() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLibrary().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 animate-pulse">Laden...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Bibliothek</h1>
        <Link to="/upload" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition">
          + Neuer Upload
        </Link>
      </div>

      {!data || data.items.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">Noch keine Lerninhalte gespeichert.</p>
          <Link to="/upload" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
            Ersten Upload erstellen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.map((item) => (
            <Link
              key={item.id}
              to={`/library/${item.id}`}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center shrink-0">
                  <Brain size={20} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-200 truncate group-hover:text-white transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(item.created_at).toLocaleDateString("de-DE")} · {item.quiz_count} Fragen
                  </p>
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2">{item.summary_preview}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Trophy size={12} />
                  Beste: {item.best_score}%
                </div>
                <div className="text-xs text-slate-500">
                  {item.attempts} Versuch{item.attempts !== 1 ? "e" : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
