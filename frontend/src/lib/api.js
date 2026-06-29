const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem("user");
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  clearToken();
  clearUser();
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !path.startsWith("/auth/")) {
    logout();
    window.location.href = "/login";
    throw new Error("Session abgelaufen");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unbekannter Fehler" }));
    throw new Error(err.detail || `Fehler ${res.status}`);
  }

  return res.json();
}

export const api = {
  register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getProfile: () => request("/user/profile"),
  getDashboard: () => request("/dashboard"),
  analyze: (data) => request("/analyze", { method: "POST", body: JSON.stringify(data) }),
  analyzePdf: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/analyze-pdf", { method: "POST", body: form });
  },
  getLibrary: () => request("/library"),
  getUploadDetail: (id) => request(`/library/${id}`),
  getQuiz: (uploadId) => request(`/quiz/${uploadId}`),
  submitQuiz: (data) => request("/quiz/submit", { method: "POST", body: JSON.stringify(data) }),
};
