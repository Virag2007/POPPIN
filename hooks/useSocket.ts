"use client";

import { useEffect, useState } from "react";
import { socketManager, TypedSocket } from "@/lib/socket/client";
import { useAuth } from "@/context/AuthContext";

export function useSocket() {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) {
      socketManager.disconnect();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const s = socketManager.getSocket(token);
    setSocket(s);

    const onConnect = () => {
      setIsConnected(true);
      setConnectError(null);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onConnectError = (err: Error) => {
      setIsConnected(false);
      setConnectError(err.message);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);

    if (s.connected) {
      setIsConnected(true);
    } else {
      s.connect();
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
    };
  }, [token, user]);

  return {
    socket,
    isConnected,
    connectError,
  };
}
