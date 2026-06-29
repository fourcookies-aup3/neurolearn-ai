import { useEffect, useState } from "react";
import { Brain, Trophy, Upload, Flame, Calendar, TrendingUp } from "lucide-react";
import { api } from "../lib/api";

export default function Profile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProfile().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 animate-pulse">Laden...</div>;
  if (!data) return <div className="text-red-400">Fehler beim Laden</div>;

  const level = Math.floor(data.xp / 100) + 1;
  const xpInLevel = data.xp % 100;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold">
            {data.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{data.username}</h1>
            <p className="text-slate-400 text-sm">{data.email}</p>
            <p className="text-slate-500 text-xs mt-1">
              Dabei seit {new Date(data.created_at).toLocaleDateString("de-DE")}
            </p>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-slate-400">Level {level}</span>
          <span className="text-sm text-indigo-400">{xpInLevel}/100 XP</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all"
            style={{ width: `${xpInLevel}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Brain, label: "Gesamt-XP", value: data.xp, color: "text-indigo-400" },
          { icon: Upload, label: "Uploads", value: data.stats.uploads_count, color: "text-purple-400" },
          { icon: Trophy, label: "Quizze", value: data.stats.quizzes_taken, color: "text-emerald-400" },
          { icon: TrendingUp, label: "Durchschnitt", value: `${data.stats.avg_score}%`, color: "text-amber-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
            <Icon size={24} className={`mx-auto mb-2 ${color}`} />
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Letzte Aktivitäten</h2>
        {data.recent_activities.length === 0 ? (
          <p className="text-slate-500 text-sm">Noch keine Aktivitäten</p>
        ) : (
          <div className="space-y-2">
            {data.recent_activities.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                <Calendar size={14} className="text-slate-500 shrink-0" />
                <p className="text-sm text-slate-300 flex-1">{a.description}</p>
                {a.xp_earned > 0 && (
                  <span className="text-xs text-indigo-400 font-medium shrink-0">+{a.xp_earned} XP</span>
                )}
                <span className="text-xs text-slate-600 shrink-0">
                  {new Date(a.created_at).toLocaleDateString("de-DE")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
