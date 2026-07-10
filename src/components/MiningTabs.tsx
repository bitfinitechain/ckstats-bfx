"use client";

import { motion, useReducedMotion } from "framer-motion";
import { User, Users, Pickaxe, Gauge } from "lucide-react";
import { useMiningMode, type MiningMode } from "@/store/miningMode";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Solo / Pool segmented control (solid-pill toggle). Shared across Dashboard,
 * Workers, Blocks and Payouts — the selection lives in the useMiningMode store,
 * so switching on one page carries over as you navigate. The active mode is a
 * filled primary pill that slides between positions; each tab shows its live
 * worker count.
 */
export default function MiningTabs({ solo, pool, highdiff }: { solo: any; pool: any; highdiff?: any }) {
    const { mode, setMode } = useMiningMode();
    const reduce = useReducedMotion();

    const tabs: { key: MiningMode; label: string; icon: any; data: any }[] = [
        { key: "solo", label: "Solo", icon: User, data: solo },
        { key: "pool", label: "Pool", icon: Users, data: pool },
        { key: "highdiff", label: "High-Diff", icon: Gauge, data: highdiff },
    ];

    return (
        <div className="flex items-center">
            <div
                role="tablist"
                aria-label="Mining mode"
                className="inline-grid grid-cols-3 gap-1.5 rounded-full border border-border bg-card p-1.5"
            >
                {tabs.map((t) => {
                    const isActive = mode === t.key;
                    const online = !!t.data;
                    const workers = t.data?.global?.workers ?? 0;

                    return (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setMode(t.key)}
                            className={`relative isolate flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-bold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98] ${
                                isActive ? "text-white" : "text-muted-foreground hover:text-foreground"
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

                            <t.icon size={16} />
                            <span>{t.label}</span>
                            <span
                                className={`font-mono text-[11px] font-semibold ${
                                    isActive ? "text-white/80" : "text-muted-foreground/70"
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

/** Shown on any page when the Pool tab is active but seed-3 has no data yet. */
export function PoolEmpty() {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                    <Pickaxe size={26} className="text-primary" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">Pool mining is coming online</h3>
                    <p className="mx-auto max-w-md text-sm text-muted-foreground">
                        The shared pool hasn&apos;t reported yet. Point a miner at{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                            stratum+tcp://pool.bitfinitechain.org:3333
                        </code>{" "}
                        and your stats will appear here.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

/** Shown when the High-Diff tab is active but no large/rented rig is connected to 3334. */
export function HighDiffEmpty() {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                    <Gauge size={26} className="text-primary" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">No high-difficulty miners right now</h3>
                    <p className="mx-auto max-w-md text-sm text-muted-foreground">
                        This is the high fixed-difficulty solo port for large ASICs &amp; rented rigs. Point one at{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                            stratum+tcp://solo.bitfinitechain.org:3334
                        </code>{" "}
                        and its stats will appear here.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
