"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [stats, setStats] = useState<any>(null);
    // Pool-mode (seed-3 shared ckpool) payload — null until configured / data flowing.
    const [poolStats, setPoolStats] = useState<any>(null);

    useEffect(() => {
        // When using custom server, socket.io is served on the same port usually
        // or we can specify URL.
        // If dev is on 3004, we connect to window.location or explicit.
        // Since Next.js dev server wraps everything, we might need explicit port if running differently.
        // But `tsx server.ts` serves both Next.js and Socket.io on port 3004.
        // Connect to the same origin (relative)
        const socketInstance = io({
            path: "/socket.io",
            transports: ["websocket", "polling"],
            addTrailingSlash: false,
        });

        socketInstance.on("connect", () => {
            console.log("Socket connected");
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            console.log("Socket disconnected");
            setIsConnected(false);
        });

        socketInstance.on("stats", (data) => {
            setStats(data);
        });

        socketInstance.on("poolStats", (data) => {
            setPoolStats(data);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return { socket, isConnected, stats, poolStats };
}
