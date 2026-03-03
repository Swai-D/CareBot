// hooks/useData.js
// Data fetching hooks — each wraps an API call with loading/error state

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../lib/api";

// ── Generic fetch hook ────────────────────────────────────────────
function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load, setData };
}

// ── Conversations ──────────────────────────────────────────────────
export function useConversations(filters = {}) {
  const filtersKey = JSON.stringify(filters);
  return useFetch(() => api.conversations.list(filters), [filtersKey]);
}

export function useConversation(id) {
  const { data, loading, error, refetch, setData } = useFetch(
    () => id ? api.conversations.get(id) : Promise.resolve(null),
    [id]
  );

  const sendMessage = async (text) => {
    const msg = await api.conversations.sendMessage(id, text);
    setData((prev) => prev ? { ...prev, messages: [...(prev.messages || []), msg] } : prev);
    return msg;
  };

  const resolve = async () => {
    await api.conversations.update(id, { status: "resolved" });
    setData((prev) => prev ? { ...prev, status: "resolved" } : prev);
  };

  const escalate = async () => {
    await api.conversations.update(id, { status: "escalated", is_human_handling: true });
    setData((prev) => prev ? { ...prev, status: "escalated", is_human_handling: true } : prev);
  };

  const takeOver = async () => {
    await api.conversations.update(id, { is_human_handling: true });
    setData((prev) => prev ? { ...prev, is_human_handling: true } : prev);
  };

  return { conversation: data, loading, error, refetch, sendMessage, resolve, escalate, takeOver };
}

// ── Channels ──────────────────────────────────────────────────────
export function useChannels() {
  const { data, loading, error, refetch, setData } = useFetch(() => api.channels.list(), []);

  const disconnect = async (id) => {
    await api.channels.disconnect(id);
    setData((prev) => prev?.map((ch) => ch.id === id ? { ...ch, status: "disconnected" } : ch));
  };

  return { channels: data || [], loading, error, refetch, disconnect };
}

// ── Agent config ──────────────────────────────────────────────────
export function useAgentConfig() {
  const { data: config, loading, error, refetch, setData } = useFetch(() => api.agent.getConfig(), []);
  const { data: faqs, loading: faqsLoading, refetch: refetchFaqs, setData: setFaqs } =
    useFetch(() => api.agent.getFaqs(), []);

  const [saving, setSaving] = useState(false);

  const saveConfig = async (updates) => {
    setSaving(true);
    try {
      const updated = await api.agent.updateConfig(updates);
      setData(updated);
      return updated;
    } finally {
      setSaving(false);
    }
  };

  const addFaq = async (body) => {
    const faq = await api.agent.addFaq(body);
    setFaqs((prev) => [...(prev || []), faq]);
    return faq;
  };

  const updateFaq = async (id, body) => {
    const faq = await api.agent.updateFaq(id, body);
    setFaqs((prev) => prev?.map((f) => f.id === id ? faq : f));
    return faq;
  };

  const deleteFaq = async (id) => {
    await api.agent.deleteFaq(id);
    setFaqs((prev) => prev?.filter((f) => f.id !== id));
  };

  return {
    config, loading, error, saving, refetch,
    faqs: faqs || [], faqsLoading,
    saveConfig, addFaq, updateFaq, deleteFaq,
  };
}

// ── Analytics ─────────────────────────────────────────────────────
export function useAnalytics(days = 7) {
  return useFetch(() => api.analytics.overview(days), [days]);
}

// ── Billing ───────────────────────────────────────────────────────
export function useAnalyticsOverview() {
  return useFetch(() => api.analytics.overview(), []);
}

export function useBilling() {
  return useFetch(() => api.billing.get(), []);
}
