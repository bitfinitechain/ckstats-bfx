import { create } from "zustand";

export type MiningMode = "solo" | "pool" | "highdiff";

// Shared Solo/Pool selection across Dashboard / Workers / Blocks / Payouts.
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
