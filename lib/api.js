// lib/api.js
// Central API client — all backend calls go through here

const BASE_URL = ""; // Empty string tells fetch to use the same origin (internal API)

// ── Token helpers ─────────────────────────────────────────────────
export const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

export const setToken = (t) => localStorage.setItem("token", t);
export const clearToken = () => localStorage.removeItem("token");

// ── Base fetch wrapper ────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();
  const fullUrl = `${BASE_URL}/api${path}`;
  console.log(`Requesting: ${fullUrl}`);

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Token expired — force logout
  if (res.status === 401) {
    clearToken();
    window.location.href = "/auth";
    return;
  }

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    console.error(`Expected JSON but got ${contentType}:`, text.substring(0, 100));
    throw new Error(`Server returned HTML instead of JSON. Check if API route exists: ${fullUrl}`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (body) => request("/auth/login", { method: "POST", body }),
    register: (body) => request("/auth/register", { method: "POST", body }),
    me: () => request("/auth/me"),
    logout: () => { clearToken(); window.location.href = "/auth"; },
  },

  // ── Business ───────────────────────────────────────────────────
  business: {
    get: () => request("/businesses/me"),
    update: (body) => request("/businesses/me", { method: "PATCH", body }),
  },

  // ── Channels ───────────────────────────────────────────────────
  channels: {
    list: () => request("/channels"),
    connectWhatsApp: (body) => request("/channels/whatsapp", { method: "POST", body }),
    getWhatsAppStatus: () => request("/channels/whatsapp"),
    connectInstagram: (body) => request("/channels/instagram", { method: "POST", body }),
    disconnect: (id, type) => request("/channels", { method: "DELETE", body: { id, type } }),
  },

  // ── Conversations ──────────────────────────────────────────────
  conversations: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/conversations${qs ? "?" + qs : ""}`);
    },
    get: (id) => request(`/conversations/${id}`),
    update: (id, body) => request(`/conversations/${id}`, { method: "PATCH", body }),
    sendMessage: (id, text) =>
      request(`/conversations/${id}/messages`, { method: "POST", body: { text } }),
  },

  // ── Agent ──────────────────────────────────────────────────────
  agent: {
    getConfig: () => request("/agent/config"),
    updateConfig: (body) => request("/agent/config", { method: "PATCH", body }),
    getFaqs: () => request("/agent/faqs"),
    addFaq: (body) => request("/agent/faqs", { method: "POST", body }),
    updateFaq: (id, body) => request(`/agent/faqs/${id}`, { method: "PATCH", body }),
    deleteFaq: (id) => request(`/agent/faqs/${id}`, { method: "DELETE" }),
  },

  // ── Analytics ──────────────────────────────────────────────────
  analytics: {
    overview: (days = 7) => request(`/analytics/overview?days=${days}`),
  },

  // ── Billing ────────────────────────────────────────────────────
  billing: {
    get: () => request("/billing"),
  },
};

export default api;
