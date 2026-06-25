import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Brain, Trophy, Flame, Clock, ArrowRight } from "lucide-react";
import { api } from "../lib/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 animate-pulse">Laden...</div>;
  if (!data) return <div className="text-red-400">Fehler beim Laden</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">
          Hallo, {data.username}!
        </h1>
        <p className="text-slate-400">Bereit zum Lernen?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Brain, label: "XP", value: data.xp, color: "indigo" },
          { icon: Upload, label: "Uploads", value: data.stats.uploads_count, color: "purple" },
          { icon: Trophy, label: "Quizze", value: data.stats.quizzes_taken, color: "emerald" },
          { icon: Flame, label: "Durchschnitt", value: `${data.stats.avg_score}%`, color: "amber" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className={`w-10 h-10 bg-${color}-600/10 rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={`text-${color}-400`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Letzte Uploads</h2>
            <Link to="/library" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Alle <ArrowRight size={14} />
            </Link>
          </div>
          {data.recent_uploads.length === 0 ? (
            <p className="text-slate-500 text-sm">Noch keine Uploads</p>
          ) : (
            <div className="space-y-3">
              {data.recent_uploads.map((u) => (
                <Link key={u.id} to={`/library/${u.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition">
                  <div className="w-8 h-8 bg-purple-600/10 rounded-lg flex items-center justify-center">
                    <Brain size={16} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{u.title}</p>
                    <p className="text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString("de-DE")}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Aktivitäten</h2>
          {data.recent_activities.length === 0 ? (
            <p className="text-slate-500 text-sm">Noch keine Aktivitäten</p>
          ) : (
            <div className="space-y-3">
              {data.recent_activities.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                  <Clock size={14} className="text-slate-500" />
                  <p className="text-sm text-slate-300 flex-1">{a.description}</p>
                  {a.xp_earned > 0 && (
                    <span className="text-xs text-indigo-400 font-medium">+{a.xp_earned} XP</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Link
        to="/upload"
        className="block w-full p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-center hover:from-indigo-500 hover:to-purple-500 transition shadow-lg shadow-indigo-600/20"
      >
        <Upload size={24} className="mx-auto mb-2" />
        <span className="text-lg font-semibold">Neues Lernmaterial hochladen</span>
      </Link>
    </div>
  );
}
