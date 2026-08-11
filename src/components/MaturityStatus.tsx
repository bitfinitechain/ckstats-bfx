// Coinbase maturity for a block this pool solved.
//
// A solved block's reward is NOT money yet. COINBASE_MATURITY in
// bitfinite-core (src/consensus/consensus.h) is 100 blocks, and at the
// 5-minute block target that is roughly 8 hours. The blocks table showed the
// reward as a settled figure with nothing to say otherwise, which is the one
// number a miner actually cares about the timing of.
//
// NOTE: this is a DIFFERENT clock from the explorer's settlement bar. The
// explorer counts toward finality (10 blocks + a 2-hour delay); this counts
// toward spendability (100 blocks). Same visual language on purpose, so the
// label and the denominator must always be visible or the two get confused.

const COINBASE_MATURITY = 100;

export default function MaturityStatus({
    height,
    chainTip,
}: {
    height: number;
    chainTip: number;
}) {
    // No tip yet (electrum down, first tick) — say nothing rather than guess.
    // A bar drawn from a zero tip would read "0/100" for a year-old block.
    if (!chainTip || !height) return <span className="text-muted-foreground">—</span>;

    const depth = Math.max(0, chainTip - height + 1);

    if (depth >= COINBASE_MATURITY) {
        return (
            <span
                className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-success"
                title={`${depth} confirmations — past the ${COINBASE_MATURITY}-block coinbase maturity, so the reward is spendable.`}
            >
                <span className="h-2 w-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
                Spendable
            </span>
        );
    }

    const pct = (depth / COINBASE_MATURITY) * 100;
    return (
        <span
            className="inline-flex items-center gap-2 whitespace-nowrap"
            title={`Newly mined coins cannot be spent until ${COINBASE_MATURITY} blocks deep. ${COINBASE_MATURITY - depth} to go.`}
        >
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
                <span className="h-2 w-2 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                Maturing
            </span>
            <span
                className="relative h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={depth}
                aria-valuemin={0}
                aria-valuemax={COINBASE_MATURITY}
                aria-label={`Maturing: ${depth} of ${COINBASE_MATURITY} blocks`}
            >
                <span
                    className="absolute inset-y-0 left-0 rounded-full bg-warning"
                    style={{ width: `${Math.max(3, Math.min(100, pct))}%` }}
                />
            </span>
            {/* Denominator always shown — a bare bar here reads as a finality
                bar to anyone who also uses the explorer. */}
            <span className="font-mono tabular-nums text-[11px] text-muted-foreground">
                {depth} / {COINBASE_MATURITY}
            </span>
        </span>
    );
}
