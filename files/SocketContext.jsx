// context/SocketContext.jsx
"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { business, isLoggedIn } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef({});  // event → [callbacks]

  useEffect(() => {
    if (!isLoggedIn || !business?.id) return;

    // Dynamically import socket.io-client (only client-side)
    import("socket.io-client").then(({ io }) => {
      const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
        query: { businessId: business.id },
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        console.log("[Socket] Connected to CareBot server");
        setConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("[Socket] Disconnected");
        setConnected(false);
      });

      // Forward all server events to registered listeners
      const events = ["new_message", "ai_response", "human_message", "escalation"];
      events.forEach((evt) => {
        socket.on(evt, (data) => {
          (listenersRef.current[evt] || []).forEach((cb) => cb(data));
        });
      });

      socketRef.current = socket;
    });

    return () => {
      socketRef.current?.disconnect();
      setConnected(false);
    };
  }, [isLoggedIn, business?.id]);

  // Subscribe to a socket event — returns unsubscribe fn
  const on = (event, callback) => {
    if (!listenersRef.current[event]) listenersRef.current[event] = [];
    listenersRef.current[event].push(callback);
    return () => {
      listenersRef.current[event] = listenersRef.current[event].filter((cb) => cb !== callback);
    };
  };

  return (
    <SocketContext.Provider value={{ connected, on }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
