"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { MINING_MODES, MINING_SOURCES, type MiningMode } from "@/store/miningMode";

type SourceMap = Record<MiningMode, any>;

const EMPTY: SourceMap = MINING_MODES.reduce(
    (acc, m) => ({ ...acc, [m]: null }),
    {} as SourceMap,
);

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    // One payload per mining source, keyed by mode. Each arrives on its own
    // socket event (see MINING_SOURCES) and is null until that source is
    // configured and reporting.
    const [sources, setSources] = useState<SourceMap>(EMPTY);

    useEffect(() => {
        // `tsx server.ts` serves both Next.js and socket.io on the same port, so
        // connect to the same origin.
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

        // Subscribe from the registry so a new source needs no change here.
        for (const mode of MINING_MODES) {
            socketInstance.on(MINING_SOURCES[mode].event, (data: any) => {
                setSources((prev) => ({ ...prev, [mode]: data }));
            });
        }

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return {
        socket,
        isConnected,
        sources,
        // Named aliases, derived from the same map so they cannot drift from it.
        stats: sources.solo,
        poolStats: sources.pool,
        rentalStats: sources.highdiff,
        pool2Stats: sources.pool2,
    };
}
