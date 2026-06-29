import { Link } from "react-router-dom";
import { Brain, Zap, BarChart3, BookOpen } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          NeuroLearn AI
        </h1>
        <div className="flex gap-3">
          <Link to="/login" className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition">
            Login
          </Link>
          <Link to="/register" className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 rounded-xl transition">
            Registrieren
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 pt-24 pb-16">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/10 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-6">
            <Zap size={14} />
            KI-gestütztes Lernen
          </div>
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Lerne schneller<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              mit KI
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Lade deinen Lernstoff hoch und erhalte sofort KI-generierte Zusammenfassungen,
            Quizfragen und verfolge deinen Fortschritt.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium text-lg transition shadow-lg shadow-indigo-600/25">
              Jetzt starten
            </Link>
            <Link to="/login" className="px-8 py-3 border border-slate-700 hover:border-slate-500 rounded-xl font-medium text-lg text-slate-300 transition">
              Einloggen
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "KI-Zusammenfassung", desc: "Dein Lernstoff wird automatisch zusammengefasst und strukturiert." },
            { icon: BookOpen, title: "Quiz & Lernkarten", desc: "10 Quizfragen pro Upload - teste dein Wissen interaktiv." },
            { icon: BarChart3, title: "Fortschritt tracken", desc: "XP sammeln, Streaks halten und deinen Lernfortschritt verfolgen." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition">
              <div className="w-12 h-12 bg-indigo-600/10 rounded-xl flex items-center justify-center mb-4">
                <Icon size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
