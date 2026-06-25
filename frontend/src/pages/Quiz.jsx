import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Trophy, ArrowLeft } from "lucide-react";
import { api } from "../lib/api";

export default function Quiz() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getQuiz(id).then((data) => {
      setQuiz(data);
      setAnswers(new Array(data.questions.length).fill(""));
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.submitQuiz({ upload_id: parseInt(id), answers });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-400 animate-pulse">Laden...</div>;
  if (!quiz) return <div className="text-red-400">Quiz nicht gefunden</div>;

  if (result) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-indigo-600/20 flex items-center justify-center mb-4">
            <Trophy size={40} className="text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {result.score}/{result.total}
          </h1>
          <p className="text-lg text-slate-400">
            {result.percentage}% richtig
          </p>
          <span className="inline-block mt-2 px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-sm text-indigo-300">
            +{result.xp_earned} XP
          </span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-3 mb-6">
          <div
            className="h-3 rounded-full transition-all bg-gradient-to-r from-indigo-600 to-purple-600"
            style={{ width: `${result.percentage}%` }}
          />
        </div>

        <div className="space-y-3">
          {result.results.map((r, i) => (
            <div key={i} className={`p-4 rounded-xl border ${r.is_correct ? "bg-emerald-950/30 border-emerald-800" : "bg-red-950/30 border-red-800"}`}>
              <div className="flex items-start gap-2">
                {r.is_correct ? (
                  <CheckCircle size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-200">{r.frage}</p>
                  {!r.is_correct && (
                    <p className="text-xs text-slate-400 mt-1">
                      Deine Antwort: <span className="text-red-300">{r.user_answer || "(leer)"}</span>
                    </p>
                  )}
                  <p className="text-xs text-emerald-300 mt-1">Richtig: {r.correct_answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link to={`/library/${id}`} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium text-center text-slate-300 transition">
            Zurück zum Material
          </Link>
          <button
            onClick={() => { setResult(null); setCurrentQ(0); setAnswers(new Array(quiz.questions.length).fill("")); }}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition"
          >
            Nochmal versuchen
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQ];
  const progress = ((currentQ) / quiz.questions.length) * 100;

  return (
    <div className="max-w-2xl space-y-6">
      <Link to={`/library/${id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition text-sm">
        <ArrowLeft size={16} /> Abbrechen
      </Link>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold text-white">{quiz.title}</h1>
          <span className="text-sm text-slate-400">{currentQ + 1}/{quiz.questions.length}</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <p className="text-lg text-white font-medium mb-6">{question.frage}</p>
        <textarea
          value={answers[currentQ]}
          onChange={(e) => {
            const newAnswers = [...answers];
            newAnswers[currentQ] = e.target.value;
            setAnswers(newAnswers);
          }}
          rows={3}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
          placeholder="Deine Antwort..."
        />
      </div>

      <div className="flex gap-3">
        {currentQ > 0 && (
          <button
            onClick={() => setCurrentQ(currentQ - 1)}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium text-slate-300 transition"
          >
            Zurück
          </button>
        )}
        {currentQ < quiz.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQ(currentQ + 1)}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition"
          >
            Weiter
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium transition disabled:opacity-50"
          >
            {submitting ? "Wird ausgewertet..." : "Quiz abschließen"}
          </button>
        )}
      </div>
    </div>
  );
}
