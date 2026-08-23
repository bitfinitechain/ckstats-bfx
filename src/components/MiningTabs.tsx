"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Pickaxe, Network, Zap, Server } from "lucide-react";
import {
    useMiningMode,
    MINING_MODES,
    MINING_SOURCES,
    type MiningMode,
} from "@/store/miningMode";
import { Card, CardContent } from "@/components/ui/card";

/** Per-source icon. Labels and copy live in MINING_SOURCES; only the glyph is here. */
const ICONS: Record<MiningMode, any> = {
    solo: Pickaxe,
    pool: Network,
    highdiff: Zap,
    pool2: Server,
};

/**
 * Mining-source segmented control (solid-pill toggle). Shared across Dashboard,
 * Workers, Blocks and Payouts — the selection lives in the useMiningMode store,
 * so switching on one page carries over as you navigate. The active mode is a
 * filled primary pill that slides between positions; each tab shows its live
 * worker count, or "off" when that source isn't reporting.
 *
 * Tabs are rendered from MINING_MODES, so adding a source adds a tab.
 */
export default function MiningTabs({ sources }: { sources: Record<MiningMode, any> }) {
    const { mode, setMode } = useMiningMode();
    const reduce = useReducedMotion();

    return (
        <div className="flex items-center">
            <div
                role="tablist"
                aria-label="Mining source"
                className="inline-grid grid-cols-4 gap-1.5 rounded-full border border-border bg-card p-1.5"
            >
                {MINING_MODES.map((key) => {
                    const src = MINING_SOURCES[key];
                    const Icon = ICONS[key];
                    const data = sources[key];
                    const isActive = mode === key;
                    const online = !!data;
                    const workers = data?.global?.workers ?? 0;

                    return (
                        <button
                            key={key}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setMode(key)}
                            className={`relative isolate flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-bold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98] sm:px-5 ${
                                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {isActive && (
                                <motion.span
                                    layoutId="miningTabIndicator"
                                    className="absolute inset-0 -z-10 rounded-full bg-primary shadow-lg shadow-primary/30"
                                    transition={
                                        reduce
                                            ? { duration: 0 }
                                            : { type: "spring", stiffness: 420, damping: 34 }
                                    }
                                />
                            )}

                            <Icon size={16} aria-hidden="true" />
                            <span>{src.label}</span>
                            <span
                                className={`font-mono text-[11px] font-semibold ${
                                    isActive ? "text-primary-foreground/80" : "text-muted-foreground/70"
                                }`}
                            >
                                {online ? `${workers}w` : "off"}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Shown on any page when the selected source has no data yet. Copy comes from
 * MINING_SOURCES so each tab explains its own endpoint — previously this was
 * `mode === "highdiff" ? <HighDiffEmpty/> : <PoolEmpty/>` in four files, which
 * meant any unrecognised mode advertised the shared pool's stratum address.
 */
export function SourceEmpty({ mode }: { mode: MiningMode }) {
    const src = MINING_SOURCES[mode];
    const Icon = ICONS[mode];
    if (!src?.empty) return null;

    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                    <Icon size={26} className="text-primary" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">{src.empty.heading}</h3>
                    <p className="mx-auto max-w-md text-sm text-muted-foreground">
                        {src.empty.blurb}{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all text-foreground">
                            {src.empty.stratum}
                        </code>{" "}
                        and your stats will appear here.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
