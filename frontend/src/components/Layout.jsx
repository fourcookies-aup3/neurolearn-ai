import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Upload, BookOpen, Brain, User, LogOut } from "lucide-react";
import { logout, getUser } from "../lib/api";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const links = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/upload", icon: Upload, label: "Lernen" },
    { to: "/library", icon: BookOpen, label: "Bibliothek" },
    { to: "/profile", icon: User, label: "Profil" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            NeuroLearn AI
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || "?"}
            </div>
            <span className="text-sm text-slate-300 truncate">{user?.username || "User"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 w-full transition-all"
          >
            <LogOut size={18} />
            Abmelden
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
