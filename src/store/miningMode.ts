import { create } from "zustand";

/** What kind of mining a tab shows. */
export type MiningMode = "solo" | "pool" | "highdiff";
/** Which hardware runs it: the primary instance, or its failover on separate hardware. */
export type MiningTier = "primary" | "failover";
/** One concrete ckpool instance — a log directory, a socket event, a Redis key. */
export type SourceKey = "solo" | "pool" | "highdiff" | "solo2" | "pool2" | "highdiff2";

export const MINING_MODES = ["solo", "pool", "highdiff"] as const;
export const MINING_TIERS = ["primary", "failover"] as const;

export const MODE_LABEL: Record<MiningMode, string> = {
    solo: "Solo",
    pool: "Pool",
    highdiff: "High-Diff",
};

export const TIER_LABEL: Record<MiningTier, string> = {
    primary: "Primary",
    failover: "Failover",
};

/**
 * (tier, mode) -> the instance that serves it, or null when we do not run one.
 *
 * Kept as a mode x tier grid rather than one flat tab per instance because the
 * flat list does not fit: four tabs already take 78px each at 390px while
 * "High-Diff" alone needs 86px, so a fifth tab could only be added by dropping
 * the icons or scrolling tabs off-screen. The grid also says something true —
 * solo-2 IS the failover for solo — that a flat list leaves the reader to infer.
 *
 * null is deliberate and must stay renderable: we run no failover for high-diff,
 * and the UI says so rather than showing an empty instance as if it were idle.
 */
export const SOURCE_BY: Record<MiningTier, Record<MiningMode, SourceKey | null>> = {
    primary: { solo: "solo", pool: "pool", highdiff: "highdiff" },
    failover: { solo: "solo2", pool: "pool2", highdiff: "highdiff2" },
};

export function sourceKeyFor(mode: MiningMode, tier: MiningTier): SourceKey | null {
    return SOURCE_BY[tier][mode];
}

export interface MiningSource {
    /** Heading for the workers card/table on this instance. */
    workersTitle: string;
    /** socket.io event carrying this instance's payload. */
    event: string;
    /** Redis key the poller writes the payload to. */
    redisKey: string;
    /** Empty-state copy, shown when the instance is selected but has no data. */
    empty: { heading: string; blurb: string; stratum: string } | null;
    /**
     * True when this is a SHARED pool: the block coinbase pays the pool address and
     * rewards are then split among contributors by share, so the finder does not keep
     * the 50 BFX. False for solo-style instances, where the coinbase pays the finder.
     *
     * This drives real copy and the finder leaderboard, so it has to be a property of
     * the instance. The code once tested `mode === "pool"`, which classified pool-2 as
     * solo and told miners the finder pockets the whole reward.
     */
    shared: boolean;
    /** How it reads in prose: "the BitFinite <longName> pool". */
    longName: string;
    /** Empty-state line for this instance's workers list. */
    emptyWorkers: string;
}

export const MINING_SOURCES: Record<SourceKey, MiningSource> = {
    solo: {
        workersTitle: "Solo Workers",
        event: "stats",
        redisKey: "latest_stats",
        // The always-configured instance; the page shows a loader instead.
        empty: null,
        shared: false,
        longName: "solo",
        emptyWorkers: "No active workers",
    },
    pool: {
        workersTitle: "Pool Workers",
        event: "poolStats",
        redisKey: "latest_pool_stats",
        empty: {
            heading: "Pool mining is coming online",
            blurb: "The shared pool hasn't reported yet. Point a miner at",
            stratum: "stratum+tcp://pool.bitfinitechain.org:3333",
        },
        shared: true,
        longName: "shared",
        emptyWorkers: "No pool miners yet",
    },
    highdiff: {
        workersTitle: "High-Diff Workers",
        event: "rentalStats",
        redisKey: "latest_rental_stats",
        empty: {
            heading: "No high-difficulty miners right now",
            blurb: "This is the high fixed-difficulty solo port for large ASICs & rented rigs. Point one at",
            stratum: "stratum+tcp://solo.bitfinitechain.org:3334",
        },
        shared: false,
        longName: "high-difficulty solo",
        emptyWorkers: "No high-diff miners yet",
    },
    solo2: {
        workersTitle: "Solo-2 Workers",
        event: "solo2Stats",
        redisKey: "latest_solo2_stats",
        empty: {
            heading: "No miners on the failover solo pool",
            blurb:
                "Solo-2 is a second solo instance on separate hardware — it pays the coinbase " +
                "straight to the finder, exactly like the primary. Point a miner at",
            stratum: "stratum+tcp://solo-2.bitfinitechain.org:3333",
        },
        shared: false,
        longName: "failover solo",
        emptyWorkers: "No Solo-2 miners yet",
    },
    highdiff2: {
        workersTitle: "High-Diff-2 Workers",
        event: "highdiff2Stats",
        redisKey: "latest_highdiff2_stats",
        empty: {
            heading: "No high-difficulty miners on the failover host",
            blurb:
                "Fixed difficulty 262,144, same as the primary — big ASICs and rented rigs only. " +
                "A small miner pointed here will sit a very long time between shares. Point a large rig at",
            stratum: "stratum+tcp://solo-2.bitfinitechain.org:3334",
        },
        shared: false,
        longName: "failover high-difficulty solo",
        emptyWorkers: "No High-Diff-2 miners yet",
    },
    pool2: {
        workersTitle: "Pool-2 Workers",
        event: "pool2Stats",
        redisKey: "latest_pool2_stats",
        empty: {
            heading: "No miners on the failover pool",
            blurb:
                "Pool-2 is a second shared pool on separate hardware, with its own share " +
                "accounting and its own payouts — it is not a mirror of the primary. Point a miner at",
            stratum: "stratum+tcp://pool-2.bitfinitechain.org:3335",
        },
        shared: true,
        longName: "failover shared",
        emptyWorkers: "No Pool-2 miners yet",
    },
};

export const SOURCE_KEYS = Object.keys(MINING_SOURCES) as SourceKey[];

// Shared selection across Dashboard / Workers / Blocks / Payouts. In-memory
// (survives client-side navigation; resets on a hard reload) — deliberately not
// persisted, to avoid SSR hydration mismatches.
interface MiningModeState {
    mode: MiningMode;
    tier: MiningTier;
    setMode: (mode: MiningMode) => void;
    setTier: (tier: MiningTier) => void;
}

export const useMiningMode = create<MiningModeState>((set) => ({
    mode: "solo",
    tier: "primary",
    setMode: (mode) => set({ mode }),
    setTier: (tier) => set({ tier }),
}));
