"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SOURCE_KEYS, MINING_SOURCES, type SourceKey } from "@/store/miningMode";

type SourceMap = Record<SourceKey, any>;

const EMPTY: SourceMap = SOURCE_KEYS.reduce(
    (acc, k) => ({ ...acc, [k]: null }),
    {} as SourceMap,
);

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    // One payload per ckpool instance, keyed by SourceKey. Each arrives on its own
    // socket event (see MINING_SOURCES) and stays null until that instance is
    // configured and reporting.
    const [sources, setSources] = useState<SourceMap>(EMPTY);

    useEffect(() => {
        // `tsx server.ts` serves both Next.js and socket.io on the same port.
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

        // Subscribe from the registry, so a new instance needs no change here.
        for (const key of SOURCE_KEYS) {
            socketInstance.on(MINING_SOURCES[key].event, (data: any) => {
                setSources((prev) => ({ ...prev, [key]: data }));
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
        // Named alias for the always-present primary solo payload, which several
        // pages use as the "have we received anything at all yet" signal.
        stats: sources.solo,
    };
}
