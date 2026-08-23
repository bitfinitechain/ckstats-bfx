"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Pickaxe, Network, Zap, ServerOff } from "lucide-react";
import {
    useMiningMode,
    MINING_MODES,
    MINING_TIERS,
    MINING_SOURCES,
    MODE_LABEL,
    TIER_LABEL,
    sourceKeyFor,
    type MiningMode,
    type MiningTier,
    type SourceKey,
} from "@/store/miningMode";
import { Card, CardContent } from "@/components/ui/card";

/** Per-mode icon. Labels live in the store; only the glyph is here. */
const ICONS: Record<MiningMode, any> = {
    solo: Pickaxe,
    pool: Network,
    highdiff: Zap,
};

const PILL = "relative isolate flex items-center justify-center gap-2 rounded-full outline-none " +
    "transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98]";

/**
 * Mining selector: three mode tabs plus a Primary/Failover switch.
 *
 * A flat tab per instance does not fit — four tabs already take 78px each at
 * 390px while "High-Diff" alone needs 86px. The grid also states something the
 * flat list only implied: solo-2 is the failover FOR solo, not a fifth kind of
 * mining. Selection lives in the useMiningMode store so it carries across pages.
 */
export default function MiningTabs({ sources }: { sources: Record<SourceKey, any> }) {
    const { mode, tier, setMode, setTier } = useMiningMode();
    const reduce = useReducedMotion();
    const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 34 };

    return (
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
            {/* Mode tabs */}
            <div
                role="tablist"
                aria-label="Mining mode"
                className="inline-grid grid-cols-3 gap-1.5 rounded-full border border-border bg-card p-1.5"
            >
                {MINING_MODES.map((key) => {
                    const Icon = ICONS[key];
                    const sk = sourceKeyFor(key, tier);
                    const data = sk ? sources[sk] : null;
                    const isActive = mode === key;
                    // "—" means we run no such instance at this tier; "off" means we
                    // run one and it is not reporting. Those are different facts.
                    const badge = sk === null ? "—" : data ? `${data?.global?.workers ?? 0}w` : "off";

                    return (
                        <button
                            key={key}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setMode(key)}
                            className={`${PILL} px-3 py-2 text-sm font-bold sm:px-5 ${
                                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {isActive && (
                                <motion.span
                                    layoutId="miningTabIndicator"
                                    className="absolute inset-0 -z-10 rounded-full bg-primary shadow-lg shadow-primary/30"
                                    transition={spring}
                                />
                            )}
                            <Icon size={16} aria-hidden="true" />
                            <span>{MODE_LABEL[key]}</span>
                            <span
                                className={`font-mono text-[11px] font-semibold ${
                                    isActive ? "text-primary-foreground/80" : "text-muted-foreground/70"
                                }`}
                            >
                                {badge}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Primary / Failover switch */}
            <div
                role="radiogroup"
                aria-label="Instance"
                className="inline-grid grid-cols-2 gap-1.5 rounded-full border border-border bg-card p-1.5"
            >
                {MINING_TIERS.map((t) => {
                    const isActive = tier === t;
                    return (
                        <button
                            key={t}
                            role="radio"
                            aria-checked={isActive}
                            onClick={() => setTier(t)}
                            className={`${PILL} px-3 py-2 text-xs font-bold sm:px-4 ${
                                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {isActive && (
                                <motion.span
                                    layoutId="miningTierIndicator"
                                    className="absolute inset-0 -z-10 rounded-full bg-primary shadow-lg shadow-primary/30"
                                    transition={spring}
                                />
                            )}
                            <span>{TIER_LABEL[t]}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Shown when the selected instance has no data — or does not exist. Copy comes
 * from MINING_SOURCES so each instance names its own endpoint; the null case is
 * a distinct message, because "we do not run this" and "this is idle" are
 * different facts and showing zeros for the first one would be a lie.
 */
export function SourceEmpty({
    sourceKey,
    mode,
    tier,
}: {
    sourceKey: SourceKey | null;
    mode: MiningMode;
    tier: MiningTier;
}) {
    if (sourceKey === null) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/40">
                        <ServerOff size={26} className="text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground">
                            No {TIER_LABEL[tier].toLowerCase()} instance for {MODE_LABEL[mode]}
                        </h3>
                        <p className="mx-auto max-w-md text-sm text-muted-foreground">
                            We don&apos;t run a second {MODE_LABEL[mode]} instance. Switch to{" "}
                            <span className="font-semibold text-foreground">Primary</span> to see this pool.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const src = MINING_SOURCES[sourceKey];
    const Icon = ICONS[mode];
    if (!src.empty) return null;

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
