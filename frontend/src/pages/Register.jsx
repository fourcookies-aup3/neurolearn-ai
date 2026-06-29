import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken, setUser } from "../lib/api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.register({ username, email, password });
      setToken(res.access_token);
      setUser(res.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            NeuroLearn AI
          </h1>
          <p className="text-slate-400">Account erstellen</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Benutzername</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              placeholder="dein_name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              placeholder="deine@email.de"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              placeholder="mind. 6 Zeichen"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-950/50 border border-red-800 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl font-medium transition"
          >
            {loading ? "Wird erstellt..." : "Account erstellen"}
          </button>

          <p className="text-center text-sm text-slate-400">
            Bereits einen Account?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
              Anmelden
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
