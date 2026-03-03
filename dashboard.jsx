import { useState } from "react";
import {
  LayoutDashboard, MessageSquare, Radio, BarChart2,
  CreditCard, Settings, ChevronRight, Phone, Instagram,
  CheckCircle, AlertCircle, Clock, TrendingUp, Users,
  Zap, Plus, Search, Bell, LogOut, MoreVertical, Send,
  Star, ArrowUpRight, ArrowDownRight, Wifi, WifiOff,
  ChevronDown, X, Eye, Edit2, Trash2,
  Package, HelpCircle, Smile, Frown,
  Activity, Shield, Globe, Cpu
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const analyticsData = [
  { day: "Ju", messages: 120, resolved: 95, escalated: 8 },
  { day: "Wi", messages: 180, resolved: 150, escalated: 12 },
  { day: "Th", messages: 95, resolved: 80, escalated: 5 },
  { day: "Al", messages: 220, resolved: 190, escalated: 18 },
  { day: "Ij", messages: 160, resolved: 140, escalated: 9 },
  { day: "Si", messages: 310, resolved: 270, escalated: 22 },
  { day: "Sa", messages: 85, resolved: 75, escalated: 4 },
];

const conversations = [
  { id: 1, name: "Fatuma Ali", channel: "whatsapp", phone: "+254712345678", message: "Ninahitaji kujua bei ya product yenu...", time: "2 min", status: "open", ai: true },
  { id: 2, name: "John Kamau", channel: "instagram", handle: "@johnkamau", message: "Is your shop open on Sunday?", time: "8 min", status: "resolved", ai: true },
  { id: 3, name: "Amina Hassan", channel: "whatsapp", phone: "+255734567890", message: "Ninapenda kuorder lakini sijui...", time: "15 min", status: "escalated", ai: false },
  { id: 4, name: "David Ochieng", channel: "whatsapp", phone: "+254798765432", message: "Order yangu imefika lini?", time: "32 min", status: "open", ai: true },
  { id: 5, name: "Grace Wanjiku", channel: "instagram", handle: "@gracew", message: "Do you deliver to Eldoret?", time: "1 hr", status: "resolved", ai: true },
  { id: 6, name: "Mohamed Yusuf", channel: "whatsapp", phone: "+254711223344", message: "Bei ya wholesale ni ngapi?", time: "2 hr", status: "open", ai: true },
];

const faqs = [
  { id: 1, question: "Bei ya bidhaa ni ngapi?", answer: "Bidhaa zetu zinaanza KES 500 hadi KES 5,000 kulingana na aina.", category: "Pricing", active: true },
  { id: 2, question: "Mnadelivery?", answer: "Ndio! Tunadelivery Nairobi (bure kwa order above KES 2,000) na kote Kenya.", category: "Delivery", active: true },
  { id: 3, question: "Naweza kurudisha bidhaa?", answer: "Ndio, ndani ya siku 7 baada ya kupokea. Bidhaa iwe katika hali nzuri.", category: "Returns", active: true },
  { id: 4, question: "Mnafungua saa ngapi?", answer: "Tuko open Jumatatu-Jumamosi 8am-6pm. Jumapili tunapumzika.", category: "Hours", active: false },
];

const TEAL = "#00D4AA";
const TEAL_DARK = "#00A88A";
const BG = "#0A0F1A";
const CARD = "#111827";
const CARD2 = "#1A2235";
const BORDER = "#1E2D42";
const TEXT = "#E2E8F0";
const MUTED = "#64748B";

export default function Dashboard() {
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([
    { role: "customer", text: "Habari! Ninahitaji kujua bei ya bidhaa yenu.", time: "10:02" },
    { role: "ai", text: "Habari! Karibu TechStore. Bei zetu zinaanza KES 500. Je, unataka bidhaa gani hasa?", time: "10:02" },
    { role: "customer", text: "Nataka phone cover ya iPhone 14", time: "10:03" },
    { role: "ai", text: "Phone covers za iPhone 14 tuna bei ya KES 800 - KES 1,500 depending on the material. Tungependa kukuonyesha options zetu. Je, unataka leather au silicone?", time: "10:03" },
  ]);
  const [newMsg, setNewMsg] = useState("");
  const [agentTone, setAgentTone] = useState("friendly");
  const [agentName, setAgentName] = useState("Msaidizi");
  const [systemPrompt, setSystemPrompt] = useState("Wewe ni msaidizi wa customer care wa TechStore. Jibu maswali kuhusu bidhaa, bei, delivery, na return policy. Daima kuwa na heshima na msaada.");

  const nav = [
    { id: "overview", icon: LayoutDashboard, label: "Overview" },
    { id: "conversations", icon: MessageSquare, label: "Mazungumzo", badge: 3 },
    { id: "agent", icon: Cpu, label: "Agent Builder" },
    { id: "channels", icon: Radio, label: "Channels" },
    { id: "analytics", icon: BarChart2, label: "Analytics" },
    { id: "billing", icon: CreditCard, label: "Billing" },
    { id: "settings", icon: Settings, label: "Mipangilio" },
  ];

  const statusColor = { open: "#00D4AA", resolved: "#6366F1", escalated: "#F59E0B" };
  const statusBg = { open: "#00D4AA15", resolved: "#6366F115", escalated: "#F59E0B15" };
  const statusLabel = { open: "Wazi", resolved: "Imeshughulikiwa", escalated: "Imepelekwa" };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: BG, minHeight: "100vh", display: "flex", color: TEXT, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E2D42; border-radius: 2px; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, textarea, select { outline: none; }
        .nav-item { transition: all 0.15s ease; }
        .nav-item:hover { background: #1A2235 !important; }
        .nav-item.active { background: #00D4AA18 !important; }
        .card-hover { transition: transform 0.15s, box-shadow 0.15s; }
        .card-hover:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(0,212,170,0.08); }
        .conv-row { transition: background 0.1s; cursor: pointer; }
        .conv-row:hover { background: #1A2235 !important; }
        .send-btn:hover { background: #00A88A !important; }
        .toggle-btn { transition: all 0.2s; }
        .faq-row:hover { background: #1A2235 !important; }
        .channel-card { transition: all 0.2s; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        textarea { resize: none; }
        .gradient-text { background: linear-gradient(135deg, #00D4AA, #6366F1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: sidebarOpen ? 240 : 72, background: CARD, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${TEAL}, #6366F1)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={18} color="#fff" />
          </div>
          {sidebarOpen && <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px" }}>CareBot</div>
            <div style={{ fontSize: 11, color: MUTED }}>Customer Care AI</div>
          </div>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map(({ id, icon: Icon, label, badge }) => (
            <div key={id} className={`nav-item${page === id ? " active" : ""}`}
              onClick={() => setPage(id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", position: "relative", overflow: "hidden" }}>
              <Icon size={18} color={page === id ? TEAL : MUTED} style={{ flexShrink: 0 }} />
              {sidebarOpen && <>
                <span style={{ fontSize: 13.5, fontWeight: page === id ? 600 : 400, color: page === id ? TEXT : MUTED, flex: 1 }}>{label}</span>
                {badge && <span style={{ background: TEAL, color: "#000", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>{badge}</span>}
                {page === id && <div style={{ position: "absolute", right: 0, top: "20%", bottom: "20%", width: 3, background: TEAL, borderRadius: "3px 0 0 3px" }} />}
              </>}
            </div>
          ))}
        </nav>

        {/* Business */}
        {sidebarOpen && <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ background: CARD2, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>T</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>TechStore KE</div>
              <div style={{ fontSize: 10, color: TEAL, display: "flex", alignItems: "center", gap: 3 }}>
                <div className="pulse" style={{ width: 5, height: 5, background: TEAL, borderRadius: "50%" }} />
                Pro Plan
              </div>
            </div>
            <LogOut size={13} color={MUTED} style={{ cursor: "pointer" }} />
          </div>
        </div>}
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", padding: 4 }}>
            <LayoutDashboard size={18} />
          </button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: CARD2, borderRadius: 8, padding: "7px 12px", maxWidth: 320, border: `1px solid ${BORDER}` }}>
            <Search size={14} color={MUTED} />
            <input placeholder="Tafuta mazungumzo, customers..." style={{ background: "transparent", border: "none", color: TEXT, fontSize: 13, flex: 1 }} />
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
            <div className="pulse" style={{ width: 6, height: 6, background: TEAL, borderRadius: "50%" }} />
            <span style={{ color: TEAL, fontWeight: 600 }}>AI Online</span>
          </div>
          <div style={{ position: "relative", cursor: "pointer" }}>
            <Bell size={18} color={MUTED} />
            <div style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, background: "#EF4444", borderRadius: "50%", border: `2px solid ${CARD}` }} />
          </div>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>A</div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>

          {/* ─── OVERVIEW ─── */}
          {page === "overview" && <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>Habari, <span className="gradient-text">TechStore!</span> 👋</h1>
              <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>Leo ni Jumanne, Machi 3, 2026 — Hapa kuna muhtasari wa shughuli zako</p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Mazungumzo Leo", value: "47", change: "+12%", up: true, icon: MessageSquare, color: TEAL },
                { label: "Yameshughulikiwa", value: "38", change: "+8%", up: true, icon: CheckCircle, color: "#6366F1" },
                { label: "Imepelekwa", value: "3", change: "-25%", up: false, icon: AlertCircle, color: "#F59E0B" },
                { label: "Muda wa Kujibu", value: "1.2s", change: "-0.3s", up: true, icon: Zap, color: "#10B981" },
              ].map((s, i) => (
                <div key={i} className="card-hover" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 36, background: `${s.color}18`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <s.icon size={16} color={s.color} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: s.up ? "#10B981" : "#EF4444", display: "flex", alignItems: "center", gap: 2 }}>
                      {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{s.change}
                    </span>
                  </div>
                  <div style={{ marginTop: 14, fontSize: 26, fontWeight: 700, letterSpacing: "-1px", fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              {/* Chart */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>Ujumbe Wiki Hii</h3>
                    <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Jumla ya mazungumzo kwa siku</p>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                    {[{ color: TEAL, label: "Ujumbe" }, { color: "#6366F1", label: "Imeshughulikiwa" }].map((l, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, color: MUTED }}>
                        <div style={{ width: 8, height: 8, background: l.color, borderRadius: "50%" }} />{l.label}
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={analyticsData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={TEAL} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="messages" stroke={TEAL} strokeWidth={2} fill="url(#tealGrad)" dot={false} />
                    <Area type="monotone" dataKey="resolved" stroke="#6366F1" strokeWidth={2} fill="url(#purpleGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Recent */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Mazungumzo ya Hivi Karibuni</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {conversations.slice(0, 4).map((c) => (
                    <div key={c.id} className="conv-row" onClick={() => { setPage("conversations"); setActiveConv(c); }} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px", borderRadius: 8 }}>
                      <div style={{ width: 32, height: 32, background: c.channel === "whatsapp" ? "#25D36618" : "#E1306C18", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {c.channel === "whatsapp" ? <Phone size={13} color="#25D366" /> : <Instagram size={13} color="#E1306C" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.message}</div>
                      </div>
                      <div style={{ fontSize: 10, color: MUTED, flexShrink: 0 }}>{c.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>}

          {/* ─── CONVERSATIONS ─── */}
          {page === "conversations" && <div style={{ display: "flex", gap: 16, height: "calc(100vh - 108px)" }}>
            {/* List */}
            <div style={{ width: 320, flexShrink: 0, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "16px", borderBottom: `1px solid ${BORDER}` }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Mazungumzo</h2>
                <div style={{ display: "flex", gap: 6 }}>
                  {["Yote", "WhatsApp", "Instagram"].map((f, i) => (
                    <button key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `1px solid ${i === 0 ? TEAL : BORDER}`, background: i === 0 ? `${TEAL}18` : "transparent", color: i === 0 ? TEAL : MUTED, cursor: "pointer" }}>{f}</button>
                  ))}
                </div>
              </div>
              <div style={{ overflow: "auto", flex: 1 }}>
                {conversations.map((c) => (
                  <div key={c.id} className="conv-row" onClick={() => setActiveConv(c)}
                    style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, background: activeConv?.id === c.id ? CARD2 : "transparent" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 28, height: 28, background: c.channel === "whatsapp" ? "#25D36618" : "#E1306C18", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {c.channel === "whatsapp" ? <Phone size={12} color="#25D366" /> : <Instagram size={12} color="#E1306C" />}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                      </div>
                      <span style={{ fontSize: 10, color: MUTED }}>{c.time}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: 11, color: MUTED, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>{c.message}</p>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: statusBg[c.status], color: statusColor[c.status] }}>
                        {statusLabel[c.status]}
                      </span>
                    </div>
                    {c.ai && <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 3 }}>
                      <Cpu size={10} color={TEAL} /><span style={{ fontSize: 9, color: TEAL }}>OpenClaw AI</span>
                    </div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat View */}
            {activeConv ? (
              <div style={{ flex: 1, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                      {activeConv.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{activeConv.name}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>{activeConv.phone || activeConv.handle} · {activeConv.channel === "whatsapp" ? "WhatsApp" : "Instagram"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ padding: "6px 12px", borderRadius: 7, background: "#F59E0B18", border: `1px solid #F59E0B40`, color: "#F59E0B", fontSize: 11, cursor: "pointer" }}>
                      Peleka kwa Mtu
                    </button>
                    <button style={{ padding: "6px 12px", borderRadius: 7, background: `${TEAL}18`, border: `1px solid ${TEAL}40`, color: TEAL, fontSize: 11, cursor: "pointer" }}>
                      Maliza
                    </button>
                    <div style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <MoreVertical size={16} color={MUTED} />
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  {messages.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.role === "customer" ? "flex-start" : "flex-end", gap: 8 }}>
                      {m.role === "ai" && <div style={{ width: 26, height: 26, background: `${TEAL}22`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-end" }}><Cpu size={12} color={TEAL} /></div>}
                      <div style={{ maxWidth: "65%" }}>
                        <div style={{ background: m.role === "customer" ? CARD2 : `${TEAL}18`, border: `1px solid ${m.role === "customer" ? BORDER : TEAL + "40"}`, borderRadius: m.role === "customer" ? "12px 12px 12px 3px" : "12px 12px 3px 12px", padding: "10px 14px", fontSize: 13, lineHeight: 1.5 }}>
                          {m.text}
                        </div>
                        <div style={{ fontSize: 10, color: MUTED, marginTop: 4, textAlign: m.role === "customer" ? "left" : "right" }}>
                          {m.time} {m.role === "ai" && "· OpenClaw"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 16, borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Andika ujumbe... (Mtu anaweza kujibu hapa)"
                      style={{ flex: 1, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", color: TEXT, fontSize: 13, height: 44, lineHeight: 1.5 }} />
                    <button className="send-btn" onClick={() => { if (newMsg.trim()) { setMessages([...messages, { role: "ai", text: newMsg, time: "sasa" }]); setNewMsg(""); } }}
                      style={{ width: 44, height: 44, background: TEAL, border: "none", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <Send size={16} color="#000" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: MUTED }}>
                <MessageSquare size={40} strokeWidth={1} />
                <p style={{ fontSize: 13 }}>Chagua mazungumzo kuona</p>
              </div>
            )}
          </div>}

          {/* ─── AGENT BUILDER ─── */}
          {page === "agent" && <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>Agent Builder</h1>
              <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>Sanidi jinsi OpenClaw anavyowasiliana na customers wako</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Identity */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <Cpu size={16} color={TEAL} />
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>Utambulisho wa Agent</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 6 }}>Jina la Agent</label>
                    <input value={agentName} onChange={e => setAgentName(e.target.value)}
                      style={{ width: "100%", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", color: TEXT, fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 6 }}>Tone ya Mazungumzo</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["friendly", "professional", "casual"].map(t => (
                        <button key={t} onClick={() => setAgentTone(t)}
                          style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${agentTone === t ? TEAL : BORDER}`, background: agentTone === t ? `${TEAL}18` : "transparent", color: agentTone === t ? TEAL : MUTED, fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>
                          {t === "friendly" ? "😊 Rafiki" : t === "professional" ? "👔 Rasmi" : "💬 Casual"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 6 }}>System Prompt (Maelekezo ya OpenClaw)</label>
                    <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={5}
                      style={{ width: "100%", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", color: TEXT, fontSize: 12, lineHeight: 1.6, fontFamily: "'DM Mono', monospace" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 6 }}>AI Model (via OpenClaw)</label>
                    <select style={{ width: "100%", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", color: TEXT, fontSize: 13 }}>
                      <option>Auto (OpenClaw decides)</option>
                      <option>Claude 3.5 Sonnet</option>
                      <option>GPT-4o</option>
                      <option>Llama 3.1 (Local)</option>
                    </select>
                  </div>
                  <button style={{ background: TEAL, color: "#000", border: "none", borderRadius: 8, padding: "10px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    Hifadhi Mabadiliko
                  </button>
                </div>
              </div>

              {/* FAQs */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <HelpCircle size={16} color={TEAL} />
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>Maswali ya Mara kwa Mara (FAQs)</h3>
                  </div>
                  <button style={{ background: `${TEAL}18`, border: `1px solid ${TEAL}40`, borderRadius: 7, padding: "5px 10px", color: TEAL, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Plus size={12} /> Ongeza
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {faqs.map(f => (
                    <div key={f.id} className="faq-row" style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 9, background: `${TEAL}18`, color: TEAL, padding: "2px 6px", borderRadius: 5, fontWeight: 600 }}>{f.category}</span>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: f.active ? TEAL : MUTED, display: "inline-block" }} />
                          </div>
                          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{f.question}</p>
                          <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{f.answer}</p>
                        </div>
                        <div style={{ display: "flex", gap: 6, marginLeft: 8, flexShrink: 0 }}>
                          <Edit2 size={12} color={MUTED} style={{ cursor: "pointer" }} />
                          <Trash2 size={12} color="#EF4444" style={{ cursor: "pointer" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>}

          {/* ─── CHANNELS ─── */}
          {page === "channels" && <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>Channels</h1>
              <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>Unganisha akaunti zako za WhatsApp na Instagram</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* WhatsApp */}
              <div className="channel-card" style={{ background: CARD, border: `1px solid #25D36640`, borderRadius: 12, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, background: "#25D36618", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Phone size={22} color="#25D366" />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: 15 }}>WhatsApp Business</h3>
                      <p style={{ fontSize: 11, color: MUTED }}>Meta Cloud API</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#25D36618", border: "1px solid #25D36640", borderRadius: 20, padding: "4px 10px" }}>
                    <Wifi size={11} color="#25D366" />
                    <span style={{ fontSize: 11, color: "#25D366", fontWeight: 600 }}>Imeunganishwa</span>
                  </div>
                </div>
                <div style={{ background: CARD2, borderRadius: 8, padding: 14, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: MUTED }}>Nambari ya Simu</span>
                    <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace" }}>+254 712 345 678</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: MUTED }}>Phone Number ID</span>
                    <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: MUTED }}>123456789...</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: MUTED }}>Webhook Status</span>
                    <span style={{ fontSize: 11, color: "#25D366" }}>✓ Verified</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontSize: 12, cursor: "pointer" }}>Badilisha Mipangilio</button>
                  <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #EF444440", background: "#EF444418", color: "#EF4444", fontSize: 12, cursor: "pointer" }}>Ondoa</button>
                </div>
              </div>

              {/* Instagram */}
              <div className="channel-card" style={{ background: CARD, border: `1px solid #E1306C40`, borderRadius: 12, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, background: "#E1306C18", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Instagram size={22} color="#E1306C" />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: 15 }}>Instagram DM</h3>
                      <p style={{ fontSize: 11, color: MUTED }}>Instagram Graph API</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#E1306C18", border: "1px solid #E1306C40", borderRadius: 20, padding: "4px 10px" }}>
                    <Wifi size={11} color="#E1306C" />
                    <span style={{ fontSize: 11, color: "#E1306C", fontWeight: 600 }}>Imeunganishwa</span>
                  </div>
                </div>
                <div style={{ background: CARD2, borderRadius: 8, padding: 14, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: MUTED }}>Instagram Account</span>
                    <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace" }}>@techstore_ke</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: MUTED }}>Page ID</span>
                    <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: MUTED }}>987654321...</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: MUTED }}>DM Automation</span>
                    <span style={{ fontSize: 11, color: "#E1306C" }}>✓ Active</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontSize: 12, cursor: "pointer" }}>Badilisha Mipangilio</button>
                  <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #EF444440", background: "#EF444418", color: "#EF4444", fontSize: 12, cursor: "pointer" }}>Ondoa</button>
                </div>
              </div>

              {/* Add more channels */}
              <div style={{ background: CARD, border: `2px dashed ${BORDER}`, borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", opacity: 0.6 }}>
                <div style={{ width: 44, height: 44, background: CARD2, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus size={20} color={MUTED} />
                </div>
                <p style={{ fontSize: 13, color: MUTED }}>Ongeza Channel Mpya</p>
                <p style={{ fontSize: 11, color: MUTED }}>SMS, Telegram (inakuja...)</p>
              </div>
            </div>
          </div>}

          {/* ─── ANALYTICS ─── */}
          {page === "analytics" && <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>Analytics</h1>
              <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>Takwimu za mazungumzo yako</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, gridColumn: "1 / -1" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Ujumbe kwa Wiki</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analyticsData} margin={{ left: -20 }}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="messages" fill={`${TEAL}88`} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" fill="#6366F188" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="escalated" fill="#F59E0B88" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {[
                { label: "Wastani wa Muda wa Kujibu", value: "1.2s", sub: "OpenClaw response time", color: TEAL },
                { label: "Kiwango cha Ufumbuzi", value: "92%", sub: "AI imeshughulikia peke yake", color: "#10B981" },
                { label: "Customer Satisfaction", value: "4.7/5", sub: "Kutoka maoni ya customers", color: "#6366F1" },
                { label: "Ujumbe Uliobaki", value: "2,150", sub: "Kati ya 50,000 (Pro Plan)", color: "#F59E0B" },
              ].map((s, i) => (
                <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 30, fontWeight: 700, color: s.color, fontFamily: "'DM Mono', monospace", letterSpacing: "-1px" }}>{s.value}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>}

          {/* ─── BILLING ─── */}
          {page === "billing" && <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>Billing & Subscription</h1>
              <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>Dhibiti mpango wako na malipo</p>
            </div>

            {/* Current Plan */}
            <div style={{ background: `linear-gradient(135deg, ${TEAL}18, #6366F118)`, border: `1px solid ${TEAL}40`, borderRadius: 12, padding: 24, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Star size={16} color={TEAL} fill={TEAL} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: 1 }}>MPANGO WA SASA</span>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-1px" }}>Pro Plan</h2>
                <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>KES 150,000/mwezi · Inaisha Aprili 3, 2026</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1px", fontFamily: "'DM Mono', monospace" }}>2,150</div>
                <div style={{ fontSize: 11, color: MUTED }}>ujumbe umebaki wiki hii</div>
                <div style={{ width: 180, height: 6, background: CARD2, borderRadius: 3, marginTop: 8 }}>
                  <div style={{ width: "57%", height: "100%", background: `linear-gradient(90deg, ${TEAL}, #6366F1)`, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>2,850 / 5,000 imetumika mwezi huu</div>
              </div>
            </div>

            {/* Plans */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { name: "Basic", price: "50,000", msgs: "500", color: "#6366F1", features: ["WhatsApp tu", "500 ujumbe/mwezi", "Dashboard", "Support ya email"] },
                { name: "Pro", price: "150,000", msgs: "5,000", color: TEAL, current: true, features: ["WhatsApp + Instagram", "5,000 ujumbe/mwezi", "Analytics", "Support ya haraka", "Human handoff"] },
                { name: "Enterprise", price: "Custom", msgs: "∞", color: "#F59E0B", features: ["Channels zote", "Ujumbe usio na kikomo", "Dedicated support", "Custom integrations", "SLA guarantee"] },
              ].map(p => (
                <div key={p.name} style={{ background: CARD, border: `1px solid ${p.current ? p.color : BORDER}`, borderRadius: 12, padding: 20, position: "relative", overflow: "hidden" }}>
                  {p.current && <div style={{ position: "absolute", top: 12, right: 12, background: TEAL, color: "#000", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>SASA</div>}
                  <div style={{ fontSize: 14, fontWeight: 700, color: p.color, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>
                    {p.price === "Custom" ? "Custom" : `KES ${p.price}`}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>kwa mwezi</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                    {p.features.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <CheckCircle size={12} color={p.color} />
                        <span style={{ color: TEXT }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button style={{ width: "100%", padding: "9px", borderRadius: 8, border: `1px solid ${p.current ? BORDER : p.color}`, background: p.current ? "transparent" : `${p.color}18`, color: p.current ? MUTED : p.color, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                    {p.current ? "Mpango wa Sasa" : "Badilisha"}
                  </button>
                </div>
              ))}
            </div>
          </div>}

          {/* ─── SETTINGS ─── */}
          {page === "settings" && <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>Mipangilio</h1>
              <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>Dhibiti akaunti na mipangilio ya biashara yako</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 600 }}>
              {[
                { label: "Jina la Biashara", value: "TechStore KE", icon: Globe },
                { label: "Barua pepe", value: "admin@techstore.co.ke", icon: Users },
                { label: "Timezone", value: "Africa/Nairobi (EAT)", icon: Clock },
              ].map((s, i) => (
                <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <s.icon size={15} color={TEAL} />
                    <div>
                      <div style={{ fontSize: 11, color: MUTED }}>{s.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{s.value}</div>
                    </div>
                  </div>
                  <button style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 7, padding: "5px 12px", color: MUTED, fontSize: 11, cursor: "pointer" }}>Badilisha</button>
                </div>
              ))}
              <div style={{ background: "#EF444410", border: "1px solid #EF444430", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#EF4444", marginBottom: 4 }}>Zona ya Hatari</div>
                <p style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>Kufuta akaunti kutaondoa data yote. Hatua hii haiwezi kutenduliwa.</p>
                <button style={{ background: "#EF444418", border: "1px solid #EF444440", borderRadius: 7, padding: "7px 16px", color: "#EF4444", fontSize: 12, cursor: "pointer" }}>Futa Akaunti</button>
              </div>
            </div>
          </div>}

        </div>
      </main>
    </div>
  );
}
