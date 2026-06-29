import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isLoggedIn } from "./lib/api";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Library from "./pages/Library";
import LibraryDetail from "./pages/LibraryDetail";
import Quiz from "./pages/Quiz";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  if (isLoggedIn()) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GuestRoute><Landing /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><Layout><Upload /></Layout></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><Layout><Library /></Layout></ProtectedRoute>} />
        <Route path="/library/:id" element={<ProtectedRoute><Layout><LibraryDetail /></Layout></ProtectedRoute>} />
        <Route path="/quiz/:id" element={<ProtectedRoute><Layout><Quiz /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
