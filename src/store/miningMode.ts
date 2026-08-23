import { create } from "zustand";

export type MiningMode = "solo" | "pool" | "highdiff" | "pool2";

/**
 * The registry of mining sources. Everything that varies per source — tab order,
 * tab label, the workers-card heading, the socket event, the Redis key and the
 * stratum endpoint shown in the empty state — is declared here once.
 *
 * It is a registry rather than a chain of ternaries because the ternaries did not
 * survive a fourth source. Five pages each wrote
 *
 *     mode === "solo" ? stats : mode === "pool" ? poolStats : rentalStats
 *
 * whose final branch returns the high-diff payload for ANY mode it does not name.
 * Adding "pool2" to the union would have type-checked cleanly and then rendered
 * high-diff numbers under the Pool-2 tab, in five places at once.
 */
export const MINING_MODES = ["solo", "pool", "highdiff", "pool2"] as const;

export interface MiningSource {
    /** Tab label. Measured at 390px: four tabs fit, but "Failover" clips — keep it short. */
    label: string;
    /** Heading for the workers card/table on this tab. */
    workersTitle: string;
    /** socket.io event carrying this source's payload. */
    event: string;
    /** Redis key the poller writes the payload to. */
    redisKey: string;
    /** Empty-state copy, shown when the tab is selected but the source has no data. */
    empty: { heading: string; blurb: string; stratum: string } | null;
    /**
     * True when this is a SHARED pool: the block coinbase pays the pool address and
     * rewards are then split among contributors by share, so the finder does not keep
     * the 50 BFX. False for solo-style sources, where the coinbase pays the finder.
     *
     * This drives real copy and the finder leaderboard, so it has to be a property of
     * the source. The code previously tested `mode === "pool"`, which classified
     * Pool-2 as solo and told miners the finder pockets the whole reward.
     */
    shared: boolean;
    /** How the pool is described in prose, e.g. "the BitFinite <longName> pool". */
    longName: string;
    /** Empty-state line for this tab's workers list. */
    emptyWorkers: string;
}

export const MINING_SOURCES: Record<MiningMode, MiningSource> = {
    solo: {
        label: "Solo",
        workersTitle: "Solo Workers",
        event: "stats",
        redisKey: "latest_stats",
        // Solo is the always-configured source; the page shows a loader instead.
        empty: null,
        shared: false,
        longName: "solo",
        emptyWorkers: "No active workers",
    },
    pool: {
        label: "Pool",
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
        label: "High-Diff",
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
    pool2: {
        // U+2011 non-breaking hyphen. At 390px four tabs each get 78px and the
        // label wraps; a plain hyphen broke this one as "Pool-" / "2". Measured:
        // the label stays whole at 50px and the worker count wraps below instead.
        label: "Pool\u20112",
        workersTitle: "Pool-2 Workers",
        event: "pool2Stats",
        redisKey: "latest_pool2_stats",
        empty: {
            heading: "No miners on the failover pool",
            blurb:
                "Pool-2 is a second shared pool on separate hardware, with its own share " +
                "accounting and its own payouts — it is not a mirror of the Pool tab. Point a miner at",
            stratum: "stratum+tcp://pool-2.bitfinitechain.org:3335",
        },
        shared: true,
        longName: "failover shared",
        emptyWorkers: "No Pool-2 miners yet",
    },
};

// Shared source selection across Dashboard / Workers / Blocks / Payouts.
// In-memory (survives client-side navigation; resets to solo on a hard reload) —
// deliberately not persisted to avoid SSR hydration mismatches.
interface MiningModeState {
    mode: MiningMode;
    setMode: (mode: MiningMode) => void;
}

export const useMiningMode = create<MiningModeState>((set) => ({
    mode: "solo",
    setMode: (mode) => set({ mode }),
}));
