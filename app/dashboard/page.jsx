"use client";

import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, MessageSquare, Radio, BarChart2,
  CreditCard, Settings, ChevronRight, Phone, Instagram,
  CheckCircle, AlertCircle, Clock, TrendingUp, Users,
  Zap, Plus, Search, Bell, LogOut, MoreVertical, Send,
  Star, ArrowUpRight, ArrowDownRight, Wifi, WifiOff,
  ChevronDown, X, Eye, Edit2, Trash2,
  Package, HelpCircle, Smile, Frown,
  Activity, Shield, Globe, Cpu, RefreshCw
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import QRCodeLib from "qrcode";

// ── Real API & Hooks ─────────────────────────────────────────────
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { 
  useConversations, useConversation, useChannels, 
  useAgentConfig, useAnalyticsOverview, useBilling 
} from "@/hooks/useData";

const analyticsData = [
  { day: "Ju", messages: 120, resolved: 95, escalated: 8 },
  { day: "Wi", messages: 180, resolved: 150, escalated: 12 },
  { day: "Th", messages: 95, resolved: 80, escalated: 5 },
  { day: "Al", messages: 220, resolved: 190, escalated: 18 },
  { day: "Ij", messages: 160, resolved: 140, escalated: 9 },
  { day: "Si", messages: 310, resolved: 270, escalated: 22 },
  { day: "Sa", messages: 85, resolved: 75, escalated: 4 },
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
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, business, logout } = useAuth();

  // ── Channels Logic ─────────────────────────────────────────────
  const { channels, loading: channelsLoading, refetch: refetchChannels, disconnect } = useChannels();
  const [showWAConnect, setShowWAConnect] = useState(false);
  const [waStep, setWAStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const pollRef = useRef(null);

  const waChannel = channels?.find(c => c.type === "WHATSAPP");

  const startWhatsAppConnect = async () => {
    console.log("[Frontend] Starting connection for:", phoneNumber);
    setConnecting(true);
    try {
      const res = await api.channels.connectWhatsApp({ phoneNumber });
      console.log("[Frontend] Init response:", res);
      setWAStep(2);
      setQrCodeUrl(null);

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const data = await api.channels.getWhatsAppStatus();
          if (data.qr) {
            setQrCodeUrl(await QRCodeLib.toDataURL(data.qr));
          }
          if (data.status === 'open' || data.status === 'CONNECTED') {
            console.log("[Frontend] Connected successfully!");
            clearInterval(pollRef.current);
            setShowWAConnect(false);
            setWAStep(1);
            refetchChannels();
          }
        } catch (e) { console.error("[Frontend] Poll error:", e); }
      }, 3000);
    } catch (err) {
      console.error("[Frontend] Init error:", err);
      alert(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (id, type) => {
    if (!confirm("Je, una uhakika unataka kuondoa WhatsApp?")) return;
    try {
      await api.channels.disconnect(id, type);
      refetchChannels();
    } catch (err) { alert(err.message); }
  };

  // ── Conversations Real Integration ───────────────────────────────
  const { data: convsList, loading: listLoading, refetch: refetchConvs } = useConversations();
  const [activeConvId, setActiveConvId] = useState(null);
  const { conversation: active, loading: activeLoading, sendMessage, resolve, escalate, refetch: refetchActive } = useConversation(activeConvId);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    if (page === "conversations") {
      const interval = setInterval(() => {
        refetchConvs();
        if (activeConvId) refetchActive();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [page, activeConvId]);

  const handleSendMessage = async () => {
    if (!newMsg.trim() || !activeConvId) return;
    try {
      await sendMessage(newMsg);
      setNewMsg("");
    } catch (e) { alert(e.message); }
  };

  // ── Agent Builder Logic ──────────────────────────────────────────
  const { config, faqs, loading: agentLoading, saving, saveConfig, addFaq, updateFaq, deleteFaq } = useAgentConfig();
  const [agentName, setAgentName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [agentTone, setAgentTone] = useState("friendly");
  const [agentModel, setAgentModel] = useState("auto");
  const [faqModal, setFaqModal] = useState(null); // { question, answer, id } au "add"
  
  // New AI Settings
  const [models, setModels] = useState([]);
  const [testMsg, setTestMsg] = useState("");
  const [testReply, setTestReply] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (page === "agent") {
      api.agent.getModels().then(data => setModels(data.models || [])).catch(console.error);
    }
  }, [page]);

  useEffect(() => {
    if (config) {
      setAgentName(config.agentName || "");
      setSystemPrompt(config.systemPrompt || "");
      setAgentTone(config.agentTone || "friendly");
      setAgentModel(config.openclawModel || "auto");
    }
  }, [config]);

  const handleSaveAgent = async () => {
    try {
      await saveConfig({ 
        agentName, 
        systemPrompt, 
        agentTone, 
        openclawModel: agentModel 
      });
      alert("Mabadiliko yamehifadhiwa!");
    } catch (e) { alert(e.message); }
  };

  const testAgent = async () => {
    if (!testMsg.trim()) return;
    setTesting(true);
    try {
      const res = await api.agent.test({ message: testMsg });
      setTestReply(res);
    } catch (e) { alert(e.message); }
    finally { setTesting(false); }
  };

  const handleFaqAction = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = { question: formData.get("question"), answer: formData.get("answer") };
    try {
      if (faqModal?.id) {
        await updateFaq(faqModal.id, data);
      } else {
        await addFaq(data);
      }
      setFaqModal(null);
    } catch (e) { alert(e.message); }
  };

  // ── Billing Logic ───────────────────────────────────────────────
  const { data: billingData, loading: billingLoading } = useBilling();

  const statusColor = { open: "#00D4AA", resolved: "#6366F1", escalated: "#F59E0B" };
  const statusBg = { open: "#00D4AA15", resolved: "#6366F115", escalated: "#F59E0B15" };
  const statusLabel = { open: "Wazi", resolved: "Imeshughulikiwa", escalated: "Imepelekwa" };

  useEffect(() => {
    setMounted(true);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  if (!mounted) return null;

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
        .gradient-text { background: linear-gradient(135deg, #00D4AA, #6366F1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: sidebarOpen ? 240 : 72, background: CARD, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${TEAL}, #6366F1)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Zap size={18} color="#fff" /></div>
          {sidebarOpen && <div><div style={{ fontWeight: 700, fontSize: 15 }}>CareBot</div><div style={{ fontSize: 11, color: MUTED }}>Customer Care AI</div></div>}
        </div>
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { id: "overview", icon: LayoutDashboard, label: "Overview" },
            { id: "conversations", icon: MessageSquare, label: "Mazungumzo", badge: convsList?.length },
            { id: "agent", icon: Cpu, label: "Agent Builder" },
            { id: "channels", icon: Radio, label: "Channels" },
            { id: "analytics", icon: BarChart2, label: "Analytics" },
            { id: "billing", icon: CreditCard, label: "Billing" },
            { id: "settings", icon: Settings, label: "Mipangilio" },
          ].map(({ id, icon: Icon, label, badge }) => (
            <div key={id} className={`nav-item${page === id ? " active" : ""}`} onClick={() => setPage(id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", position: "relative" }}>
              <Icon size={18} color={page === id ? TEAL : MUTED} style={{ flexShrink: 0 }} />
              {sidebarOpen && <><span style={{ fontSize: 13.5, fontWeight: page === id ? 600 : 400, color: page === id ? TEXT : MUTED, flex: 1 }}>{label}</span>{badge > 0 && <span style={{ background: TEAL, color: "#000", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>{badge}</span>}</>}
            </div>
          ))}
        </nav>
        {sidebarOpen && <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ background: CARD2, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{business?.name?.[0] || "?"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{business?.name}</div>
              <div style={{ fontSize: 10, color: TEAL }}>{business?.plan || "FREE"} Plan</div>
            </div>
            <LogOut size={13} color={MUTED} style={{ cursor: "pointer" }} onClick={logout} />
          </div>
        </div>}
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer" }}><LayoutDashboard size={18} /></button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: CARD2, borderRadius: 8, padding: "7px 12px", maxWidth: 320, border: `1px solid ${BORDER}` }}>
            <Search size={14} color={MUTED} />
            <input placeholder="Tafuta..." style={{ background: "transparent", border: "none", color: TEXT, fontSize: 13, flex: 1 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
            <div className="pulse" style={{ width: 6, height: 6, background: TEAL, borderRadius: "50%" }} />
            <span style={{ color: TEAL, fontWeight: 600 }}>AI Online</span>
          </div>
          <Bell size={18} color={MUTED} />
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{user?.name?.[0]}</div>
        </header>

        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {/* OVERVIEW */}
          {page === "overview" && <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Habari, <span className="gradient-text">{business?.name}!</span> 👋</h1>
            <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>Muhtasari wa leo Machi 3, 2026</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, margin: "24px 0" }}>
              {[
                { label: "Mazungumzo Leo", value: convsList?.length || 0, icon: MessageSquare, color: TEAL },
                { label: "Resolution Rate", value: "92%", icon: CheckCircle, color: "#6366F1" },
                { label: "Muda wa Kujibu", value: "1.2s", icon: Zap, color: "#10B981" },
                { label: "Hali ya WhatsApp", value: waChannel?.status === 'CONNECTED' ? "Online" : "Offline", icon: Phone, color: waChannel?.status === 'CONNECTED' ? TEAL : "#EF4444" },
              ].map((s, i) => (
                <div key={i} className="card-hover" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ width: 36, height: 36, background: `${s.color}18`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <s.icon size={16} color={s.color} />
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>}

          {/* CONVERSATIONS */}
          {page === "conversations" && <div style={{ display: "flex", gap: 16, height: "calc(100vh - 108px)" }}>
            <div style={{ width: 320, flexShrink: 0, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: 16, borderBottom: `1px solid ${BORDER}` }}><h2 style={{ fontSize: 15, fontWeight: 700 }}>Mazungumzo</h2></div>
              <div style={{ overflow: "auto", flex: 1 }}>
                {listLoading ? <div style={{ padding: 20, textAlign: "center" }}><RefreshCw className="spin" color={MUTED} /></div> : 
                 (convsList || []).map((c) => (
                  <div key={c.id} className="conv-row" onClick={() => setActiveConvId(c.id)}
                    style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, background: activeConvId === c.id ? CARD2 : "transparent" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{c.customerName || c.customerId || "Mteja"}</span>
                      <span style={{ fontSize: 10, color: MUTED }}>{c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ""}</span>
                    </div>
                    <p style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.messages?.[0]?.content || "Hakuna ujumbe"}</p>
                  </div>
                ))}
              </div>
            </div>
            {activeConvId ? (
              <div style={{ flex: 1, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 600 }}>{active?.customerName || active?.customerId}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => resolve()} style={{ padding: "6px 12px", borderRadius: 7, background: `${TEAL}18`, border: `1px solid ${TEAL}40`, color: TEAL, fontSize: 11, cursor: "pointer" }}>Maliza</button>
                  </div>
                </div>
                <div style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  {activeLoading ? <div style={{ textAlign: "center" }}><RefreshCw className="spin" /></div> : 
                   active?.messages?.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.senderType === "CUSTOMER" ? "flex-start" : "flex-end" }}>
                      <div style={{ 
                        background: m.senderType === "CUSTOMER" ? CARD2 : `${TEAL}18`, 
                        border: `1px solid ${m.senderType === "CUSTOMER" ? BORDER : TEAL + "40"}`, 
                        borderRadius: 12, padding: "10px 14px", fontSize: 13, maxWidth: "70%" 
                      }}>
                        {m.content}
                        {m.openclawModelUsed && <div style={{ fontSize: 9, color: MUTED, marginTop: 4 }}>via {m.openclawModelUsed}</div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 16, borderTop: `1px solid ${BORDER}`, display: "flex", gap: 8 }}>
                  <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Andika ujumbe..." style={{ flex: 1, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 10, color: TEXT, fontSize: 13, height: 44 }} />
                  <button onClick={handleSendMessage} style={{ width: 44, height: 44, background: TEAL, border: "none", borderRadius: 10, cursor: "pointer" }}><Send size={16} color="#000" /></button>
                </div>
              </div>
            ) : <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED }}>Chagua mazungumzo kuona</div>}
          </div>}

          {/* AGENT BUILDER */}
          {page === "agent" && <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>Agent Builder</h1>
              <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>Sanidi jinsi OpenClaw anavyowasiliana na wateja wako</p>
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
                    <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 6 }}>System Prompt (Maelekezo ya AI)</label>
                    <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={5}
                      style={{ width: "100%", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", color: TEXT, fontSize: 12, lineHeight: 1.6, fontFamily: "'DM Mono', monospace" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 6 }}>AI Model (via OpenRouter)</label>
                    <select value={agentModel} onChange={e => setAgentModel(e.target.value)}
                      style={{ width: "100%", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", color: TEXT, fontSize: 13 }}>
                      {models.map(m => (
                        <option key={m.key} value={m.key} disabled={m.locked}>
                          {m.label} {m.locked ? "🔒 Pro" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button onClick={handleSaveAgent} disabled={saving}
                    style={{ background: TEAL, color: "#000", border: "none", borderRadius: 8, padding: "10px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    {saving ? "Inahifadhi..." : "Hifadhi Mabadiliko"}
                  </button>

                  {/* Test Agent UI */}
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <Zap size={14} color={TEAL} />
                      <h3 style={{ fontSize: 13, fontWeight: 700 }}>Jaribu Agent</h3>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <input 
                        value={testMsg} 
                        onChange={e => setTestMsg(e.target.value)}
                        placeholder="Andika kitu..." 
                        style={{ flex: 1, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", color: TEXT, fontSize: 12 }} 
                      />
                      <button 
                        onClick={testAgent} 
                        disabled={testing || !testMsg.trim()}
                        style={{ background: `${TEAL}18`, border: `1px solid ${TEAL}40`, borderRadius: 8, padding: "0 12px", color: TEAL, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        {testing ? "..." : "Jaribu"}
                      </button>
                    </div>
                    {testReply && (
                      <div style={{ background: CARD2, borderRadius: 8, padding: 12, border: `1px solid ${BORDER}` }}>
                        <p style={{ fontSize: 12, lineHeight: 1.5 }}>{testReply.response}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9, color: MUTED }}>
                          <span>Model: {testReply.modelUsed}</span>
                          <span>{testReply.latencyMs}ms</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FAQs */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <HelpCircle size={16} color={TEAL} />
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>Maswali ya Mara kwa Mara (FAQs)</h3>
                  </div>
                  <button onClick={() => setFaqModal("add")} style={{ background: `${TEAL}18`, border: `1px solid ${TEAL}40`, borderRadius: 7, padding: "5px 10px", color: TEAL, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Plus size={12} /> Ongeza
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {faqs?.map(f => (
                    <div key={f.id} className="faq-row" style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{f.question}</p>
                          <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{f.answer}</p>
                        </div>
                        <div style={{ display: "flex", gap: 6, marginLeft: 8, flexShrink: 0 }}>
                          <Edit2 size={12} color={MUTED} style={{ cursor: "pointer" }} onClick={() => setFaqModal(f)} />
                          <Trash2 size={12} color="#EF4444" style={{ cursor: "pointer" }} onClick={() => deleteFaq(f.id)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>}

          {/* CHANNELS */}
          {page === "channels" && <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Channels</h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
              <div className="channel-card" style={{ background: CARD, border: `1px solid ${waChannel?.status === 'CONNECTED' ? '#25D36640' : BORDER}`, borderRadius: 12, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, background: "#25D36618", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><Phone size={22} color="#25D366" /></div>
                    <div><h3 style={{ fontWeight: 700 }}>WhatsApp</h3><p style={{ fontSize: 11, color: MUTED }}>{waChannel?.phoneNumber || "Baileys QR Bridge"}</p></div>
                  </div>
                  <div style={{ color: waChannel?.status === 'CONNECTED' ? "#25D366" : MUTED, fontSize: 11, fontWeight: 600 }}>{waChannel?.status === 'CONNECTED' ? "Imeunganishwa" : "Haijaungwa"}</div>
                </div>
                {waChannel?.status === 'CONNECTED' ? 
                  <button onClick={() => handleDisconnect(waChannel.id, "WHATSAPP")} style={{ width: "100%", padding: 10, borderRadius: 8, background: "#EF444418", border: "1px solid #EF444440", color: "#EF4444", cursor: "pointer" }}>Ondoa Connection</button> :
                  <button onClick={() => setShowWAConnect(true)} style={{ width: "100%", padding: 10, borderRadius: 8, background: TEAL, color: "#000", fontWeight: 600, border: "none", cursor: "pointer" }}>Unganisha Sasa</button>
                }
              </div>
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
                <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-1px" }}>{billingData?.planName || "Free"} Plan</h2>
                <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>TZS {billingData?.price?.toLocaleString() || 0}/mwezi</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1px", fontFamily: "'DM Mono', monospace" }}>
                  {billingData?.messagesLimit === Infinity ? "∞" : (billingData?.messagesLimit - billingData?.messagesUsed).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: MUTED }}>ujumbe umebaki mwezi huu</div>
                <div style={{ width: 180, height: 6, background: CARD2, borderRadius: 3, marginTop: 8 }}>
                  <div style={{ 
                    width: billingData?.messagesLimit === Infinity ? "100%" : `${Math.min((billingData?.messagesUsed / billingData?.messagesLimit) * 100, 100)}%`, 
                    height: "100%", background: `linear-gradient(90deg, ${TEAL}, #6366F1)`, borderRadius: 3 
                  }} />
                </div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>{billingData?.messagesUsed?.toLocaleString()} / {billingData?.messagesLimit === Infinity ? "Unlimited" : billingData?.messagesLimit?.toLocaleString()} imetumika</div>
              </div>
            </div>

            {/* Plans */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                { name: "Free", price: "0", msgs: "100", color: "#94A3B8", features: ["100 ujumbe/mwezi", "WhatsApp Integration", "Basic Support", "AI Msaidizi"] },
                { name: "Starter", price: "25,000", msgs: "1,000", color: "#6366F1", features: ["1,000 ujumbe/mwezi", "Biashara Ndogo", "Email Support", "Agent Customization"] },
                { name: "Growth", price: "75,000", msgs: "5,000", color: TEAL, features: ["5,000 ujumbe/mwezi", "Biashara za Kati", "Priority Support", "Advanced Analytics"] },
                { name: "Pro", price: "150,000", msgs: "Unlimited", color: "#F59E0B", features: ["Ujumbe usio na kikomo", "Biashara Kubwa", "Dedicated Manager", "Full Customization"] },
              ].map(p => {
                const isCurrent = billingData?.planName?.toUpperCase() === p.name.toUpperCase();
                return (
                  <div key={p.name} style={{ background: CARD, border: `1px solid ${isCurrent ? p.color : BORDER}`, borderRadius: 12, padding: 20, position: "relative", overflow: "hidden" }}>
                    {isCurrent && <div style={{ position: "absolute", top: 12, right: 12, background: p.color, color: "#000", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>SASA</div>}
                    <div style={{ fontSize: 14, fontWeight: 700, color: p.color, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>
                      TZS {p.price}
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
                    <button style={{ width: "100%", padding: "9px", borderRadius: 8, border: `1px solid ${isCurrent ? BORDER : p.color}`, background: isCurrent ? "transparent" : `${p.color}18`, color: isCurrent ? MUTED : p.color, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                      {isCurrent ? "Mpango wa Sasa" : "Chagua Mpango"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>}
        </div>
      </main>

      {/* WA MODAL */}
      {showWAConnect && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, width: 420, padding: 32, position: "relative" }}>
            <button onClick={() => setShowWAConnect(false)} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", color: MUTED, cursor: "pointer" }}><X size={20}/></button>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, background: "#25D36618", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><Phone size={32} color="#25D366" /></div>
              {waStep === 1 ? (
                <>
                  <input placeholder="+255 700 000 000" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={{ width: "100%", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, color: TEXT, marginBottom: 20, textAlign: "center" }} />
                  <button onClick={startWhatsAppConnect} style={{ width: "100%", background: TEAL, color: "#000", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer" }}>{connecting ? "Inatengeneza..." : "Tengeneza QR Code"}</button>
                </>
              ) : (
                <>
                  <div style={{ background: "#fff", padding: 12, borderRadius: 12, width: 240, height: 240, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {qrCodeUrl ? <img src={qrCodeUrl} alt="QR" style={{ width: "100%" }} /> : <RefreshCw className="pulse" color="#000" />}
                  </div>
                  <div style={{ color: TEAL, fontSize: 13 }}><RefreshCw size={14} className="pulse" /> Inasubiri scan...</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAQ MODAL */}
      {faqModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, width: 420, padding: 32, position: "relative" }}>
            <button onClick={() => setFaqModal(null)} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", color: MUTED, cursor: "pointer" }}><X size={20}/></button>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{faqModal === "add" ? "Ongeza FAQ" : "Hariri FAQ"}</h3>
            <form onSubmit={handleFaqAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 6 }}>Swali</label>
                <input name="question" defaultValue={faqModal?.question || ""} required style={{ width: "100%", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, color: TEXT, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 6 }}>Jibu</label>
                <textarea name="answer" defaultValue={faqModal?.answer || ""} required rows={4} style={{ width: "100%", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, color: TEXT, fontSize: 12 }} />
              </div>
              <button type="submit" style={{ background: TEAL, color: "#000", border: "none", borderRadius: 8, padding: 12, fontWeight: 700, cursor: "pointer" }}>
                Hifadhi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
