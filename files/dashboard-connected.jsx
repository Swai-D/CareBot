// Full Dashboard — wired to real backend API
// Drop into your Next.js app as app/dashboard/page.jsx
// Requires: AuthProvider + SocketProvider in layout.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, MessageSquare, Cpu, Radio, BarChart2,
  CreditCard, Settings, Phone, Instagram, CheckCircle,
  AlertCircle, Clock, Zap, Plus, Search, Bell, LogOut,
  MoreVertical, Send, Star, ArrowUpRight, ArrowDownRight,
  Wifi, HelpCircle, Edit2, Trash2, Globe, Users, X,
  RefreshCw, ChevronDown, AlertTriangle
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

// ── Import your hooks ─────────────────────────────────────────────
// In real Next.js: import { useAuth } from "@/context/AuthContext"
// For demo we inline simplified versions below

const BASE_URL = "http://localhost:4000";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) { localStorage.removeItem("token"); window.location.href = "/auth"; return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function useFetch(fn, deps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fn()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refetch: load, setData };
}

// ── Theme ─────────────────────────────────────────────────────────
const C = {
  bg: "#0A0F1A", card: "#111827", card2: "#1A2235",
  border: "#1E2D42", teal: "#00D4AA", muted: "#64748B", text: "#E2E8F0",
};

const statusColor = { open: "#00D4AA", resolved: "#6366F1", escalated: "#F59E0B", waiting: "#94A3B8" };
const statusBg    = { open: "#00D4AA15", resolved: "#6366F115", escalated: "#F59E0B15", waiting: "#94A3B815" };
const statusLabel = { open: "Wazi", resolved: "Imeshughulikiwa", escalated: "Imepelekwa", waiting: "Inasubiri" };

// ── Shared components ─────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16, r = 6 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: C.card2, animation: "pulse 1.5s ease infinite" }} />;
}

function Toast({ msg, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const color = type === "success" ? "#00D4AA" : type === "error" ? "#EF4444" : "#F59E0B";
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: C.card, border: `1px solid ${color}40`, borderRadius: 12,
      padding: "12px 18px", display: "flex", alignItems: "center", gap: 10,
      boxShadow: `0 8px 32px rgba(0,0,0,0.4)`, animation: "slideUp 0.25s ease",
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 13, color: C.text }}>{msg}</span>
      <X size={14} color={C.muted} style={{ cursor: "pointer", marginLeft: 8 }} onClick={onClose} />
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 28, width: "100%", maxWidth: 480, animation: "scaleIn 0.2s ease",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16 }}>{title}</h3>
          <X size={18} color={C.muted} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text", multiline }) {
  const base = {
    width: "100%", background: C.card2, border: `1px solid ${C.border}`,
    borderRadius: 9, padding: "10px 13px", color: C.text, fontSize: 13,
    fontFamily: "inherit", outline: "none",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 11, color: C.muted }}>{label}</label>}
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            rows={3} style={{ ...base, resize: "none" }}
            onFocus={e => e.target.style.borderColor = C.teal}
            onBlur={e => e.target.style.borderColor = C.border} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} style={base}
            onFocus={e => e.target.style.borderColor = C.teal}
            onBlur={e => e.target.style.borderColor = C.border} />
      }
    </div>
  );
}

function Btn({ children, onClick, loading, variant = "primary", small, style: s = {} }) {
  const styles = {
    primary: { background: C.teal, color: "#000", border: "none" },
    ghost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    danger: { background: "#EF444418", color: "#EF4444", border: "1px solid #EF444440" },
  };
  return (
    <button onClick={onClick} disabled={loading} style={{
      ...styles[variant], borderRadius: 9, padding: small ? "7px 14px" : "10px 18px",
      fontSize: small ? 12 : 13, fontWeight: 600, cursor: loading ? "wait" : "pointer",
      display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", ...s,
    }}>
      {loading ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : children}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const [newMsgCount, setNewMsgCount] = useState(0);

  // Load business/user from /auth/me
  const { data: me, loading: meLoading } = useFetch(() => apiFetch("/auth/me"), []);
  const business = me?.business;
  const user = me?.user;

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // Socket.io real-time (simplified inline)
  useEffect(() => {
    if (!business?.id) return;
    let socket;
    import("socket.io-client").then(({ io }) => {
      socket = io(BASE_URL, { query: { businessId: business.id } });
      socket.on("new_message", () => setNewMsgCount(n => n + 1));
    }).catch(() => {});
    return () => socket?.disconnect();
  }, [business?.id]);

  const nav = [
    { id: "overview",       icon: LayoutDashboard, label: "Overview" },
    { id: "conversations",  icon: MessageSquare,   label: "Mazungumzo",  badge: newMsgCount || null },
    { id: "agent",          icon: Cpu,             label: "Agent Builder" },
    { id: "channels",       icon: Radio,           label: "Channels" },
    { id: "analytics",      icon: BarChart2,       label: "Analytics" },
    { id: "billing",        icon: CreditCard,      label: "Billing" },
    { id: "settings",       icon: Settings,        label: "Mipangilio" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.bg, minHeight: "100vh", display: "flex", color: C.text, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1E2D42; border-radius:2px; }
        input,textarea,select { outline:none; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn { from{transform:scale(.95);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        .nav-item:hover{background:#1A2235 !important}
        .nav-item.active{background:#00D4AA18 !important}
        .row-hover:hover{background:#1A2235 !important}
        .page{animation:fadeUp .3s ease}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: sidebarOpen ? 240 : 68, background: C.card, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", transition: "width .2s", flexShrink: 0 }}>
        <div style={{ padding: "18px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#00D4AA,#6366F1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={17} color="#fff" />
          </div>
          {sidebarOpen && <div><div style={{ fontWeight: 700, fontSize: 15 }}>CareBot</div><div style={{ fontSize: 11, color: C.muted }}>Customer Care AI</div></div>}
        </div>

        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map(({ id, icon: Icon, label, badge }) => (
            <div key={id} className={`nav-item${page === id ? " active" : ""}`} onClick={() => { setPage(id); if (id === "conversations") setNewMsgCount(0); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 8, cursor: "pointer", position: "relative" }}>
              <Icon size={17} color={page === id ? C.teal : C.muted} style={{ flexShrink: 0 }} />
              {sidebarOpen && <>
                <span style={{ fontSize: 13, fontWeight: page === id ? 600 : 400, color: page === id ? C.text : C.muted, flex: 1 }}>{label}</span>
                {badge > 0 && <span style={{ background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>{badge}</span>}
                {page === id && <div style={{ position: "absolute", right: 0, top: "20%", bottom: "20%", width: 3, background: C.teal, borderRadius: "3px 0 0 3px" }} />}
              </>}
            </div>
          ))}
        </nav>

        {sidebarOpen && (
          <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}` }}>
            {meLoading ? <Skeleton h={48} r={10} /> : (
              <div style={{ background: C.card2, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {business?.name?.[0] || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{business?.name || "Biashara yako"}</div>
                  <div style={{ fontSize: 10, color: C.teal, display: "flex", alignItems: "center", gap: 3 }}>
                    <div style={{ width: 5, height: 5, background: C.teal, borderRadius: "50%", animation: "pulse 2s infinite" }} />
                    {business?.plan || "free"}
                  </div>
                </div>
                <LogOut size={13} color={C.muted} style={{ cursor: "pointer" }} onClick={() => { localStorage.removeItem("token"); window.location.href = "/auth"; }} />
              </div>
            )}
          </div>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 58, display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}>
            <LayoutDashboard size={17} />
          </button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: C.card2, borderRadius: 8, padding: "7px 12px", maxWidth: 300, border: `1px solid ${C.border}` }}>
            <Search size={13} color={C.muted} />
            <input placeholder="Tafuta mazungumzo..." style={{ background: "none", border: "none", color: C.text, fontSize: 13, flex: 1, fontFamily: "inherit" }} />
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 11px", fontSize: 12 }}>
            <div style={{ width: 6, height: 6, background: C.teal, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            <span style={{ color: C.teal, fontWeight: 600 }}>AI Online</span>
          </div>
          <Bell size={17} color={C.muted} style={{ cursor: "pointer" }} />
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {user?.full_name?.[0] || "U"}
          </div>
        </header>

        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>

          {/* ─── OVERVIEW ─────────────────────────────────────────── */}
          {page === "overview" && <OverviewPage business={business} meLoading={meLoading} showToast={showToast} onNav={setPage} />}

          {/* ─── CONVERSATIONS ────────────────────────────────────── */}
          {page === "conversations" && <ConversationsPage showToast={showToast} />}

          {/* ─── AGENT BUILDER ────────────────────────────────────── */}
          {page === "agent" && <AgentPage showToast={showToast} />}

          {/* ─── CHANNELS ─────────────────────────────────────────── */}
          {page === "channels" && <ChannelsPage showToast={showToast} />}

          {/* ─── ANALYTICS ────────────────────────────────────────── */}
          {page === "analytics" && <AnalyticsPage />}

          {/* ─── BILLING ──────────────────────────────────────────── */}
          {page === "billing" && <BillingPage showToast={showToast} />}

          {/* ─── SETTINGS ─────────────────────────────────────────── */}
          {page === "settings" && <SettingsPage business={business} user={user} showToast={showToast} />}
        </div>
      </main>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// OVERVIEW PAGE
// ════════════════════════════════════════════════════════════════
function OverviewPage({ business, meLoading, showToast, onNav }) {
  const { data: analytics, loading: aLoading } = useFetch(() => apiFetch("/analytics/overview?days=7"), []);
  const { data: convsData, loading: cLoading } = useFetch(() => apiFetch("/conversations?limit=5"), []);

  const summary = analytics?.summary || {};
  const convs = convsData?.conversations || [];

  const stats = [
    { label: "Mazungumzo Wiki", value: summary.new_conversations ?? "—", change: "+12%", up: true, icon: MessageSquare, color: C.teal },
    { label: "Yameshughulikiwa", value: summary.resolved_conversations ?? "—", change: "+8%", up: true, icon: CheckCircle, color: "#6366F1" },
    { label: "Imepelekwa", value: summary.escalated_conversations ?? "—", change: "-25%", up: false, icon: AlertCircle, color: "#F59E0B" },
    { label: "Muda wa Kujibu", value: summary.avg_response_time ? `${Number(summary.avg_response_time).toFixed(1)}s` : "—", change: "AI", up: true, icon: Zap, color: "#10B981" },
  ];

  return (
    <div className="page">
      <div style={{ marginBottom: 24 }}>
        {meLoading ? <Skeleton w={220} h={28} /> : (
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>
            Habari, <span style={{ background: "linear-gradient(135deg,#00D4AA,#6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{business?.name || "Karibu"}!</span> 👋
          </h1>
        )}
        <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Hapa kuna muhtasari wa shughuli zako za wiki hii</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ width: 36, height: 36, background: `${s.color}18`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={16} color={s.color} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: s.up ? "#10B981" : "#EF4444", display: "flex", alignItems: "center", gap: 2 }}>
                {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{s.change}
              </span>
            </div>
            <div style={{ marginTop: 14, fontSize: 26, fontWeight: 700, letterSpacing: "-1px", fontFamily: "'DM Mono',monospace" }}>
              {aLoading ? <Skeleton w={60} h={28} /> : s.value}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Chart */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Ujumbe Wiki Hii</h3>
          {aLoading ? <Skeleton h={160} /> : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={analytics?.daily || []} margin={{ left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.teal} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: C.muted, fontSize: 10 }}
                  tickFormatter={d => d ? new Date(d).toLocaleDateString("sw-KE", { weekday: "short" }) : ""} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: C.muted, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="total_messages" stroke={C.teal} strokeWidth={2} fill="url(#g1)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent convs */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Mazungumzo ya Hivi</h3>
            <span onClick={() => onNav("conversations")} style={{ fontSize: 11, color: C.teal, cursor: "pointer" }}>Yote →</span>
          </div>
          {cLoading ? [1,2,3].map(i => <Skeleton key={i} h={44} r={8} style={{ marginBottom: 10 }} />) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {convs.slice(0, 5).map(c => (
                <div key={c.id} className="row-hover" style={{ display: "flex", gap: 8, alignItems: "center", padding: 8, borderRadius: 8, cursor: "pointer" }}>
                  <div style={{ width: 30, height: 30, background: c.channel_type === "whatsapp" ? "#25D36618" : "#E1306C18", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {c.channel_type === "whatsapp" ? <Phone size={12} color="#25D366" /> : <Instagram size={12} color="#E1306C" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.customer_name || c.customer_id}</div>
                    <div style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.last_message || "—"}</div>
                  </div>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor[c.status] || C.muted, flexShrink: 0 }} />
                </div>
              ))}
              {convs.length === 0 && <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "20px 0" }}>Hakuna mazungumzo bado</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CONVERSATIONS PAGE
// ════════════════════════════════════════════════════════════════
function ConversationsPage({ showToast }) {
  const [filter, setFilter] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [sending, setSending] = useState(false);
  const [msgText, setMsgText] = useState("");
  const chatBottom = useRef(null);

  const { data: listData, loading: listLoading, refetch } = useFetch(() => apiFetch("/conversations?" + new URLSearchParams(filter)), [JSON.stringify(filter)]);
  const { data: active, loading: activeLoading, setData: setActive } = useFetch(
    () => activeId ? apiFetch(`/conversations/${activeId}`) : Promise.resolve(null), [activeId]
  );

  useEffect(() => { chatBottom.current?.scrollIntoView({ behavior: "smooth" }); }, [active?.messages]);

  const sendMessage = async () => {
    if (!msgText.trim() || !activeId) return;
    setSending(true);
    try {
      const msg = await apiFetch(`/conversations/${activeId}/messages`, { method: "POST", body: { text: msgText } });
      setActive(prev => prev ? { ...prev, messages: [...(prev.messages || []), msg] } : prev);
      setMsgText("");
    } catch (e) { showToast(e.message, "error"); }
    finally { setSending(false); }
  };

  const updateStatus = async (status) => {
    await apiFetch(`/conversations/${activeId}`, { method: "PATCH", body: { status } });
    setActive(prev => prev ? { ...prev, status } : prev);
    refetch();
    showToast(status === "resolved" ? "Mazungumzo yameshughulikiwa ✓" : "Imepelekwa kwa mtu");
  };

  const convs = listData?.conversations || [];

  return (
    <div className="page" style={{ display: "flex", gap: 14, height: "calc(100vh - 110px)" }}>
      {/* List */}
      <div style={{ width: 300, flexShrink: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Mazungumzo</h2>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["", "Yote"], ["open", "Wazi"], ["resolved", "Yamekwisha"], ["escalated", "Imepelekwa"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val ? { status: val } : {})}
                style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
                  border: `1px solid ${JSON.stringify(filter) === JSON.stringify(val ? { status: val } : {}) ? C.teal : C.border}`,
                  background: JSON.stringify(filter) === JSON.stringify(val ? { status: val } : {}) ? `${C.teal}18` : "transparent",
                  color: JSON.stringify(filter) === JSON.stringify(val ? { status: val } : {}) ? C.teal : C.muted,
                }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {listLoading ? [1,2,3,4].map(i => (
            <div key={i} style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
              <Skeleton h={14} w="60%" /><div style={{ height: 6 }} /><Skeleton h={11} w="80%" />
            </div>
          )) : convs.length === 0 ? (
            <p style={{ textAlign: "center", color: C.muted, fontSize: 13, padding: "30px 0" }}>Hakuna mazungumzo</p>
          ) : convs.map(c => (
            <div key={c.id} className="row-hover" onClick={() => setActiveId(c.id)}
              style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: activeId === c.id ? C.card2 : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 24, height: 24, background: c.channel_type === "whatsapp" ? "#25D36618" : "#E1306C18", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {c.channel_type === "whatsapp" ? <Phone size={11} color="#25D366" /> : <Instagram size={11} color="#E1306C" />}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{c.customer_name || c.customer_phone || c.customer_id}</span>
                </div>
                <span style={{ fontSize: 9, color: C.muted }}>{c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString("sw-KE", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 11, color: C.muted, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 6 }}>{c.last_message || "—"}</p>
                <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 8, background: statusBg[c.status], color: statusColor[c.status] }}>{statusLabel[c.status]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      {activeId ? (
        <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {activeLoading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw size={20} color={C.muted} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : active ? (
            <>
              {/* Chat header */}
              <div style={{ padding: "13px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                    {(active.customer_name || active.customer_id || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{active.customer_name || active.customer_phone || active.customer_id}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{active.channel_type === "whatsapp" ? active.customer_phone : active.customer_ig_username} · {active.channel_type}</div>
                  </div>
                  {active.is_human_handling && (
                    <span style={{ fontSize: 10, background: "#F59E0B18", color: "#F59E0B", border: "1px solid #F59E0B40", padding: "2px 8px", borderRadius: 10 }}>👤 Mtu anashughulikia</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {active.status !== "resolved" && (
                    <Btn small variant="ghost" onClick={() => updateStatus("escalated")}>Peleka Mtu</Btn>
                  )}
                  {active.status === "open" && (
                    <Btn small onClick={() => updateStatus("resolved")}>
                      <CheckCircle size={13} /> Maliza
                    </Btn>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflow: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                {(active.messages || []).length === 0 && (
                  <p style={{ textAlign: "center", color: C.muted, fontSize: 13 }}>Hakuna ujumbe bado</p>
                )}
                {(active.messages || []).map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.sender_type === "customer" ? "flex-start" : "flex-end", gap: 8 }}>
                    {m.sender_type !== "customer" && (
                      <div style={{ width: 24, height: 24, background: m.sender_type === "ai" ? `${C.teal}22` : "#6366F122", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-end", flexShrink: 0 }}>
                        {m.sender_type === "ai" ? <Cpu size={11} color={C.teal} /> : <Users size={11} color="#6366F1" />}
                      </div>
                    )}
                    <div style={{ maxWidth: "60%" }}>
                      <div style={{
                        background: m.sender_type === "customer" ? C.card2 : m.sender_type === "ai" ? `${C.teal}15` : "#6366F115",
                        border: `1px solid ${m.sender_type === "customer" ? C.border : m.sender_type === "ai" ? C.teal + "30" : "#6366F130"}`,
                        borderRadius: m.sender_type === "customer" ? "12px 12px 12px 3px" : "12px 12px 3px 12px",
                        padding: "9px 13px", fontSize: 13, lineHeight: 1.5,
                      }}>{m.content}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 3, textAlign: m.sender_type === "customer" ? "left" : "right" }}>
                        {new Date(m.created_at).toLocaleTimeString("sw-KE", { hour: "2-digit", minute: "2-digit" })}
                        {m.sender_type === "ai" && m.openclaw_model_used && ` · ${m.openclaw_model_used}`}
                        {m.sender_type === "ai" && m.openclaw_latency_ms && ` · ${m.openclaw_latency_ms}ms`}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatBottom} />
              </div>

              {/* Input */}
              <div style={{ padding: 14, borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
                <textarea value={msgText} onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Andika kama human agent... (Enter kutuma)"
                  style={{ flex: 1, background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 13px", color: C.text, fontSize: 13, fontFamily: "inherit", resize: "none", height: 42 }} />
                <button onClick={sendMessage} disabled={sending || !msgText.trim()}
                  style={{ width: 42, height: 42, background: C.teal, border: "none", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: sending ? 0.5 : 1 }}>
                  {sending ? <RefreshCw size={14} color="#000" style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} color="#000" />}
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: C.muted }}>
          <MessageSquare size={38} strokeWidth={1} />
          <p style={{ fontSize: 13 }}>Chagua mazungumzo kuona</p>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// AGENT PAGE
// ════════════════════════════════════════════════════════════════
function AgentPage({ showToast }) {
  const { data: config, loading: cfgLoading, setData: setCfg } = useFetch(() => apiFetch("/agent/config"), []);
  const { data: faqs, loading: faqsLoading, setData: setFaqs } = useFetch(() => apiFetch("/agent/faqs"), []);
  const [saving, setSaving] = useState(false);
  const [faqModal, setFaqModal] = useState(null); // null | "add" | faq object
  const [localCfg, setLocalCfg] = useState(null);

  useEffect(() => { if (config) setLocalCfg(config); }, [config]);

  const setL = (k) => (v) => setLocalCfg(p => ({ ...p, [k]: v }));

  const saveConfig = async () => {
    setSaving(true);
    try {
      const updated = await apiFetch("/agent/config", { method: "PATCH", body: localCfg });
      setCfg(updated);
      showToast("Mipangilio imehifadhiwa ✓");
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const saveFaq = async (faqData) => {
    try {
      if (faqModal?.id) {
        const updated = await apiFetch(`/agent/faqs/${faqModal.id}`, { method: "PATCH", body: faqData });
        setFaqs(prev => prev?.map(f => f.id === faqModal.id ? updated : f));
        showToast("FAQ imesasishwa ✓");
      } else {
        const created = await apiFetch("/agent/faqs", { method: "POST", body: faqData });
        setFaqs(prev => [...(prev || []), created]);
        showToast("FAQ imeongezwa ✓");
      }
      setFaqModal(null);
    } catch (e) { showToast(e.message, "error"); }
  };

  const deleteFaq = async (id) => {
    if (!confirm("Futa FAQ hii?")) return;
    await apiFetch(`/agent/faqs/${id}`, { method: "DELETE" });
    setFaqs(prev => prev?.filter(f => f.id !== id));
    showToast("FAQ imefutwa");
  };

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px" }}>Agent Builder</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Sanidi jinsi OpenClaw anavyowasiliana na customers</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Config */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 18 }}>
            <Cpu size={15} color={C.teal} />
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Mipangilio ya Agent</h3>
          </div>
          {cfgLoading || !localCfg ? [1,2,3,4].map(i => <Skeleton key={i} h={38} r={8} style={{ marginBottom: 12 }} />) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <InputField label="JINA LA AGENT" value={localCfg.agent_name || ""} onChange={setL("agent_name")} placeholder="Msaidizi" />

              <div>
                <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 8 }}>TONE YA MAZUNGUMZO</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["friendly", "😊 Kirafiki"], ["professional", "👔 Rasmi"], ["casual", "💬 Casual"]].map(([val, lbl]) => (
                    <button key={val} onClick={() => setL("agent_tone")(val)}
                      style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                        border: `1px solid ${localCfg.agent_tone === val ? C.teal : C.border}`,
                        background: localCfg.agent_tone === val ? `${C.teal}18` : "transparent",
                        color: localCfg.agent_tone === val ? C.teal : C.muted,
                      }}>{lbl}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>AI MODEL (via OpenClaw)</label>
                <select value={localCfg.openclaw_model || "auto"} onChange={e => setL("openclaw_model")(e.target.value)}
                  style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: "inherit" }}>
                  <option value="auto">Auto (OpenClaw achague)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="llama3">Llama 3.1 (Local)</option>
                </select>
              </div>

              <InputField label="SYSTEM PROMPT" value={localCfg.system_prompt || ""} onChange={setL("system_prompt")}
                placeholder="Maelezo ya biashara yako kwa AI..." multiline />

              <InputField label="UJUMBE WA KWANZA (greeting)" value={localCfg.greeting_message || ""} onChange={setL("greeting_message")}
                placeholder="Habari! Karibu. Ninawezaje kukusaidia?" />

              <InputField label="UJUMBE WA TATIZO (fallback)" value={localCfg.fallback_message || ""} onChange={setL("fallback_message")}
                placeholder="Samahani, sijaweza kuelewa. Nitakusaidia..." />

              <Btn onClick={saveConfig} loading={saving}>
                Hifadhi Mabadiliko
              </Btn>
            </div>
          )}
        </div>

        {/* FAQs */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <HelpCircle size={15} color={C.teal} />
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>FAQs ({(faqs || []).length})</h3>
            </div>
            <Btn small onClick={() => setFaqModal("add")}>
              <Plus size={13} /> Ongeza
            </Btn>
          </div>

          {faqsLoading ? [1,2,3].map(i => <Skeleton key={i} h={64} r={8} style={{ marginBottom: 8 }} />) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflow: "auto" }}>
              {(faqs || []).length === 0 && (
                <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "20px 0" }}>
                  Hakuna FAQs bado. Ongeza swali la kwanza!
                </p>
              )}
              {(faqs || []).map(f => (
                <div key={f.id} className="row-hover" style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "11px 13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        {f.category && <span style={{ fontSize: 9, background: `${C.teal}18`, color: C.teal, padding: "2px 6px", borderRadius: 5, fontWeight: 600 }}>{f.category}</span>}
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: f.is_active ? C.teal : C.muted }} />
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{f.question}</p>
                      <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{f.answer}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginLeft: 8 }}>
                      <Edit2 size={12} color={C.muted} style={{ cursor: "pointer" }} onClick={() => setFaqModal(f)} />
                      <Trash2 size={12} color="#EF4444" style={{ cursor: "pointer" }} onClick={() => deleteFaq(f.id)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAQ Modal */}
      {faqModal && <FaqModal faq={faqModal === "add" ? null : faqModal} onSave={saveFaq} onClose={() => setFaqModal(null)} />}
    </div>
  );
}

function FaqModal({ faq, onSave, onClose }) {
  const [form, setForm] = useState({ question: faq?.question || "", answer: faq?.answer || "", category: faq?.category || "", is_active: faq?.is_active ?? true });
  const [saving, setSaving] = useState(false);
  const set = k => v => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.question || !form.answer) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Modal title={faq ? "Hariri FAQ" : "Ongeza FAQ Mpya"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <InputField label="SWALI" value={form.question} onChange={set("question")} placeholder="Mfano: Mnadelivery?" />
        <InputField label="JIBU" value={form.answer} onChange={set("answer")} placeholder="Jibu kamili la swali hili..." multiline />
        <InputField label="KATEGORIA (hiari)" value={form.category} onChange={set("category")} placeholder="Delivery, Bei, Returns..." />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" checked={form.is_active} onChange={e => set("is_active")(e.target.checked)} id="active" />
          <label htmlFor="active" style={{ fontSize: 13, color: C.muted, cursor: "pointer" }}>FAQ hii iwe active</label>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Ghairi</Btn>
          <Btn onClick={handleSave} loading={saving} style={{ flex: 1 }}>
            {faq ? "Hifadhi" : "Ongeza FAQ"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════
// CHANNELS PAGE
// ════════════════════════════════════════════════════════════════
function ChannelsPage({ showToast }) {
  const { data: channels, loading, refetch, setData: setChannels } = useFetch(() => apiFetch("/channels"), []);
  const [connectModal, setConnectModal] = useState(null); // "whatsapp" | "instagram" | null

  const waChannel = (channels || []).find(c => c.type === "whatsapp" && c.status === "connected");
  const igChannel = (channels || []).find(c => c.type === "instagram" && c.status === "connected");

  const disconnect = async (id) => {
    if (!confirm("Ondoa channel hii?")) return;
    await apiFetch(`/channels/${id}`, { method: "DELETE" });
    setChannels(prev => prev?.map(c => c.id === id ? { ...c, status: "disconnected" } : c));
    showToast("Channel imetenganishwa");
  };

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Channels</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Unganisha WhatsApp na Instagram</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          { key: "whatsapp", label: "WhatsApp Business", sub: "Meta Cloud API", icon: Phone, color: "#25D366", channel: waChannel },
          { key: "instagram", label: "Instagram DM", sub: "Instagram Graph API", icon: Instagram, color: "#E1306C", channel: igChannel },
        ].map(({ key, label, sub, icon: Icon, color, channel }) => (
          <div key={key} style={{ background: C.card, border: `1px solid ${channel ? color + "40" : C.border}`, borderRadius: 12, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, background: `${color}18`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={21} color={color} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 15 }}>{label}</h3>
                  <p style={{ fontSize: 11, color: C.muted }}>{sub}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: `${channel ? color : C.muted}18`, border: `1px solid ${channel ? color : C.muted}40`, borderRadius: 20, padding: "4px 10px" }}>
                {channel ? <Wifi size={11} color={color} /> : <WifiOff size={11} color={C.muted} />}
                <span style={{ fontSize: 11, color: channel ? color : C.muted, fontWeight: 600 }}>
                  {loading ? "..." : channel ? "Imeunganishwa" : "Haijaungwa"}
                </span>
              </div>
            </div>

            {channel ? (
              <>
                <div style={{ background: C.card2, borderRadius: 8, padding: 13, marginBottom: 14 }}>
                  {key === "whatsapp" ? (
                    <>
                      <Row label="Nambari" value={channel.wa_phone_number || "—"} />
                      <Row label="Phone Number ID" value={channel.wa_phone_number_id?.substring(0, 12) + "..." || "—"} />
                      <Row label="Webhook" value={channel.wa_webhook_verified ? "✓ Verified" : "⚠ Pending"} color={channel.wa_webhook_verified ? "#10B981" : "#F59E0B"} last />
                    </>
                  ) : (
                    <>
                      <Row label="Username" value={channel.ig_username ? `@${channel.ig_username}` : "—"} />
                      <Row label="Page ID" value={channel.ig_page_id?.substring(0, 12) + "..." || "—"} />
                      <Row label="DM Automation" value="✓ Active" color="#10B981" last />
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn small variant="ghost" style={{ flex: 1 }}>Mipangilio</Btn>
                  <Btn small variant="danger" style={{ flex: 1 }} onClick={() => disconnect(channel.id)}>Ondoa</Btn>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 8px" }}>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 14, textAlign: "center" }}>
                  Unganisha {label} kuanza kupokea majibu ya AI
                </p>
                <Btn onClick={() => setConnectModal(key)} style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
                  <Plus size={14} /> Unganisha {key === "whatsapp" ? "WhatsApp" : "Instagram"}
                </Btn>
              </div>
            )}
          </div>
        ))}
      </div>

      {connectModal && (
        <ConnectModal type={connectModal} onClose={() => setConnectModal(null)}
          onSuccess={(ch) => { setChannels(prev => [...(prev || []), ch]); setConnectModal(null); showToast(`${connectModal} imeunganishwa! ✓`); }} />
      )}
    </div>
  );
}

function Row({ label, value, color, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: last ? "none" : `1px solid ${C.border}` }}>
      <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 500, color: color || C.text, fontFamily: "'DM Mono',monospace" }}>{value}</span>
    </div>
  );
}

function WifiOff({ size, color }) {
  return <Wifi size={size} color={color} style={{ opacity: 0.4 }} />;
}

function ConnectModal({ type, onClose, onSuccess }) {
  const isWA = type === "whatsapp";
  const [form, setForm] = useState({ phone_number_id: "", phone_number: "", access_token: "", page_id: "", account_id: "", username: "", display_name: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = k => v => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true); setError("");
    try {
      const ch = await apiFetch(`/channels/${type}`, { method: "POST", body: form });
      onSuccess(ch);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={`Unganisha ${isWA ? "WhatsApp Business" : "Instagram DM"}`} onClose={onClose}>
      {error && <div style={{ background: "#EF444415", border: "1px solid #EF444440", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#EF4444" }}>{error}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {isWA ? (
          <>
            <InputField label="PHONE NUMBER ID (kutoka Meta Developer)" value={form.phone_number_id} onChange={set("phone_number_id")} placeholder="123456789012345" />
            <InputField label="NAMBARI YA SIMU" value={form.phone_number} onChange={set("phone_number")} placeholder="+254712345678" />
            <InputField label="ACCESS TOKEN" value={form.access_token} onChange={set("access_token")} placeholder="EAABsbCS..." />
          </>
        ) : (
          <>
            <InputField label="FACEBOOK PAGE ID" value={form.page_id} onChange={set("page_id")} placeholder="123456789" />
            <InputField label="INSTAGRAM ACCOUNT ID" value={form.account_id} onChange={set("account_id")} placeholder="987654321" />
            <InputField label="INSTAGRAM USERNAME" value={form.username} onChange={set("username")} placeholder="techstore_ke" />
            <InputField label="ACCESS TOKEN" value={form.access_token} onChange={set("access_token")} placeholder="EAABsbCS..." />
          </>
        )}
        <InputField label="JINA LA UONYESHO (hiari)" value={form.display_name} onChange={set("display_name")} placeholder={isWA ? "WhatsApp Kuu" : "Instagram Business"} />
      </div>
      <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 18 }}>
        <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
          💡 Credentials hizi unazipatia kutoka <strong style={{ color: C.text }}>Meta Developer Portal</strong> (developers.facebook.com). Zinahifadhiwa kwa usalama.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Ghairi</Btn>
        <Btn onClick={save} loading={saving} style={{ flex: 1 }}>Unganisha</Btn>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ════════════════════════════════════════════════════════════════
function AnalyticsPage() {
  const [days, setDays] = useState(7);
  const { data, loading } = useFetch(() => apiFetch(`/analytics/overview?days=${days}`), [days]);
  const summary = data?.summary || {};
  const daily = data?.daily || [];

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Analytics</h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Takwimu za mazungumzo yako</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px", color: C.text, fontSize: 13, fontFamily: "inherit" }}>
          <option value={7}>Wiki 1</option>
          <option value={14}>Wiki 2</option>
          <option value={30}>Mwezi 1</option>
        </select>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Ujumbe kwa Siku</h3>
        {loading ? <Skeleton h={200} /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily} margin={{ left: -20 }}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: C.muted, fontSize: 10 }}
                tickFormatter={d => d ? new Date(d).toLocaleDateString("sw-KE", { day: "numeric", month: "short" }) : ""} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: C.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="total_messages" fill={`${C.teal}88`} radius={[4, 4, 0, 0]} name="Ujumbe Wote" />
              <Bar dataKey="ai_messages" fill="#6366F188" radius={[4, 4, 0, 0]} name="AI" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {[
          { label: "Ujumbe Wote", value: summary.total_messages, color: C.teal },
          { label: "Imeshughulikiwa", value: summary.resolved_conversations, color: "#6366F1" },
          { label: "Imepelekwa", value: summary.escalated_conversations, color: "#F59E0B" },
          { label: "Muda wa Kujibu", value: summary.avg_response_time ? `${Number(summary.avg_response_time).toFixed(1)}s` : "—", color: "#10B981" },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
            {loading ? <Skeleton h={36} /> : <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'DM Mono',monospace" }}>{s.value ?? "—"}</div>}
            <div style={{ fontSize: 12, color: C.muted, marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// BILLING PAGE
// ════════════════════════════════════════════════════════════════
function BillingPage({ showToast }) {
  const { data: sub, loading } = useFetch(() => apiFetch("/billing"), []);

  const plans = [
    { id: "free", name: "Free", price: "0", limit: 50, color: C.muted, features: ["50 ujumbe/mwezi", "WhatsApp tu", "Dashboard ya msingi"] },
    { id: "basic", name: "Basic", price: "50,000", limit: 500, color: "#6366F1", features: ["500 ujumbe/mwezi", "WhatsApp tu", "Analytics", "Email support"] },
    { id: "pro", name: "Pro", price: "150,000", limit: 5000, color: C.teal, features: ["5,000 ujumbe/mwezi", "WhatsApp + Instagram", "Analytics kamili", "Support ya haraka", "Human handoff"] },
    { id: "enterprise", name: "Enterprise", price: "Custom", limit: null, color: "#F59E0B", features: ["Ujumbe usio na kikomo", "Channels zote", "Dedicated support", "Custom integrations"] },
  ];

  const pct = sub?.messages_limit ? Math.min((sub.messages_used / sub.messages_limit) * 100, 100) : 0;

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Billing & Subscription</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Dhibiti mpango wako</p>
      </div>

      {/* Current plan */}
      <div style={{ background: `linear-gradient(135deg,${C.teal}18,#6366F118)`, border: `1px solid ${C.teal}40`, borderRadius: 12, padding: 22, marginBottom: 20 }}>
        {loading ? <Skeleton h={60} /> : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Star size={14} color={C.teal} fill={C.teal} />
                <span style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 1 }}>MPANGO WA SASA</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, textTransform: "capitalize" }}>{sub?.plan || "free"}</h2>
              {sub?.current_period_end && <p style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>Inaisha: {new Date(sub.current_period_end).toLocaleDateString("sw-KE")}</p>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>{sub?.messages_used ?? 0}</div>
              <div style={{ fontSize: 11, color: C.muted }}>ya {sub?.messages_limit ?? 50} ujumbe imetumika</div>
              <div style={{ width: 180, height: 5, background: C.card2, borderRadius: 3, marginTop: 8 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${C.teal},#6366F1)`, borderRadius: 3, transition: "width 0.5s" }} />
              </div>
              {pct > 80 && <p style={{ fontSize: 10, color: "#F59E0B", marginTop: 4 }}>⚠ Karibu kikomo!</p>}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {plans.map(p => (
          <div key={p.id} style={{ background: C.card, border: `1px solid ${sub?.plan === p.id ? p.color : C.border}`, borderRadius: 12, padding: 18, position: "relative" }}>
            {sub?.plan === p.id && <div style={{ position: "absolute", top: 12, right: 12, background: C.teal, color: "#000", fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>SASA</div>}
            <div style={{ fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 3 }}>{p.name}</div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'DM Mono',monospace", marginBottom: 2 }}>
              {p.price === "Custom" ? "Custom" : `KES ${p.price}`}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 14 }}>/mwezi</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {p.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                  <CheckCircle size={11} color={p.color} /><span style={{ color: C.text }}>{f}</span>
                </div>
              ))}
            </div>
            <button style={{ width: "100%", padding: "8px", borderRadius: 8, cursor: sub?.plan === p.id ? "default" : "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600,
              border: `1px solid ${sub?.plan === p.id ? C.border : p.color}`,
              background: sub?.plan === p.id ? "transparent" : `${p.color}18`,
              color: sub?.plan === p.id ? C.muted : p.color,
            }} onClick={() => sub?.plan !== p.id && showToast("Stripe integration inakuja hivi karibuni!", "info")}>
              {sub?.plan === p.id ? "Mpango wa Sasa" : p.id === "enterprise" ? "Wasiliana Nasi" : "Badilisha"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ════════════════════════════════════════════════════════════════
function SettingsPage({ business, user, showToast }) {
  const [form, setForm] = useState({ name: business?.name || "", industry: business?.industry || "", timezone: business?.timezone || "Africa/Nairobi", language: business?.language || "sw" });
  const [saving, setSaving] = useState(false);
  const set = k => v => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (business) setForm({ name: business.name || "", industry: business.industry || "", timezone: business.timezone || "Africa/Nairobi", language: business.language || "sw" });
  }, [business]);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/businesses/me", { method: "PATCH", body: form });
      showToast("Mipangilio imehifadhiwa ✓");
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="page" style={{ maxWidth: 580 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Mipangilio</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Dhibiti akaunti na biashara yako</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
            <Building2 size={15} color={C.teal} />
            <h3 style={{ fontSize: 13, fontWeight: 700 }}>Taarifa za Biashara</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <InputField label="JINA LA BIASHARA" value={form.name} onChange={set("name")} placeholder="Jina la biashara yako" />
            <div>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>SEKTA</label>
              <select value={form.industry || ""} onChange={e => set("industry")(e.target.value)}
                style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: "inherit" }}>
                <option value="">Chagua sekta...</option>
                {["retail","food","services","fashion","electronics","health","real_estate","transport","other"].map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>TIMEZONE</label>
                <select value={form.timezone} onChange={e => set("timezone")(e.target.value)}
                  style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: "inherit" }}>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                  <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam</option>
                  <option value="Africa/Kampala">Africa/Kampala</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>LUGHA YA AI</label>
                <select value={form.language} onChange={e => set("language")(e.target.value)}
                  style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: "inherit" }}>
                  <option value="sw">Kiswahili</option>
                  <option value="en">English</option>
                  <option value="auto">Auto (detect)</option>
                </select>
              </div>
            </div>
            <Btn onClick={save} loading={saving}>Hifadhi Mabadiliko</Btn>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <Users size={15} color={C.teal} />
            <h3 style={{ fontSize: 13, fontWeight: 700 }}>Akaunti Yangu</h3>
          </div>
          <Row label="Jina" value={user?.full_name || "—"} />
          <Row label="Email" value={user?.email || "—"} last />
        </div>

        <div style={{ background: "#EF444410", border: "1px solid #EF444430", borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <AlertTriangle size={14} color="#EF4444" />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>Zona ya Hatari</h3>
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Kufuta akaunti kutaondoa data yote. Hatua hii haiwezi kutenduliwa.</p>
          <Btn variant="danger" small onClick={() => showToast("Wasiliana na support kufuta akaunti", "error")}>Futa Akaunti</Btn>
        </div>
      </div>
    </div>
  );
}
