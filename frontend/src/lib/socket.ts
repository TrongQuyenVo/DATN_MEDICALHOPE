/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from "socket.io-client";
import { useAppStore } from "@/stores/appStore";

let socket: Socket | null = null;

export function initSocket(userId?: string) {
  if (socket) return socket;

  const URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
  socket = io(URL, { transports: ["websocket"] });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
    if (userId) socket?.emit("join", userId);
  });

  socket.on("notification", (payload: any) => {
    try {
      useAppStore.getState().addNotification({
        id: payload.id || `notif_${Date.now()}`,
        type: payload.type || "system",
        title: payload.title || "Thông báo",
        message: payload.message || "",
        read: false,
        createdAt: payload.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.error("Socket notification handler error:", err);
    }
  });

  socket.on("activity", (payload: any) => {
    try {
      useAppStore.getState().addNotification({
        id: payload.id || `activity_${Date.now()}`,
        type: payload.type || "system",
        title: "Hoạt động mới",
        message: payload.message || "",
        read: false,
        createdAt: payload.time || new Date().toISOString(),
      });
    } catch (err) {
      console.error("Socket activity handler error:", err);
    }
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
