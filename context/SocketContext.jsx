// context/SocketContext.jsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { business } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Sasa hivi hatuna real backend ya socket, kwa hiyo tunaruka hatua hii
    // ili kuzuia error za connection kwenye console.
    
    /* 
    if (business) {
      const newSocket = io("http://localhost:4000", {
        query: { businessId: business.id },
      });
      setSocket(newSocket);
      return () => newSocket.close();
    }
    */
  }, [business]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
