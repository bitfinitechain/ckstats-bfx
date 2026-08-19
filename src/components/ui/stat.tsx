// GENERATED — do not edit here.
// Canonical: Brandkit/ui/stat.tsx   ·   update there, then: bash skills/sync.sh
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './lib/cn';

// One stat tile. This replaces five near-identical implementations — Kpi and
// StatCell in cardui, Stat and Mini in MinerConsole, and the status page's own —
// which had already drifted: only some carried a tone, only some had a sub-line,
// and only one of them could express "degraded", which is why a half-offline
// miner rendered in the healthy colour for months.
//
// Written against the token bridge, not against fixed colours, so it follows
// cards/ledger and both themes with no conditional at the call site. The only
// hard requirement on a host project is that those tokens exist — see the
// contract in Brandkit/ui/README.md.
const statVariants = cva(
    'flex flex-col rounded-lg border border-border bg-card',
    {
        variants: {
            size: {
                default: 'px-[18px] py-4 gap-1.5',
                // The dense variant is what Mini was: same anatomy, less air, used
                // inside a card that is already a section rather than a page-level tile.
                sm: 'px-3 py-2.5 gap-1',
            },
        },
        defaultVariants: { size: 'default' },
    },
);

const valueTone = cva('font-mono font-bold leading-tight tabular-nums', {
    variants: {
        tone: {
            default: 'text-foreground',
            accent: 'text-primary',
            muted: 'text-muted-foreground',
            ok: 'text-success',
            // Present because their absence was a bug. A tile that cannot say
            // "degraded" forces every partial failure into either "fine" or "down".
            warn: 'text-warning',
            bad: 'text-destructive',
        },
        size: { default: 'text-[24px]', sm: 'text-[16px]' },
    },
    defaultVariants: { tone: 'default', size: 'default' },
});

export type StatTone = NonNullable<VariantProps<typeof valueTone>['tone']>;

// The sub-line borrows the tone but not the value's typography, so it is a plain
// lookup rather than a second cva — deriving it by stripping classes out of
// valueTone's output worked until someone added a class to valueTone.
const toneText: Record<StatTone, string> = {
    default: 'text-foreground', accent: 'text-primary', muted: 'text-muted-foreground',
    ok: 'text-success', warn: 'text-warning', bad: 'text-destructive',
};

export function Stat({
    label, value, sub, tone, size = 'default', subTone, className, ...props
}: React.ComponentProps<'div'> & VariantProps<typeof statVariants> & {
    label: React.ReactNode;
    value: React.ReactNode;
    sub?: React.ReactNode;
    tone?: StatTone;
    subTone?: StatTone;
}) {
    return (
        <div data-slot="stat" data-tone={tone ?? 'default'} className={cn(statVariants({ size }), className)} {...props}>
            <div className={cn('font-mono uppercase text-muted-foreground', size === 'sm' ? 'text-[10px] tracking-[.1em]' : 'text-[11px] tracking-[.12em]')}>
                {label}
            </div>
            {/* Never wrap a figure away from its unit, and never let the digits
                shift as they update — tabular-nums is on the value, not the tile. */}
            <div className={cn(valueTone({ tone, size }), 'whitespace-nowrap')}>{value}</div>
            {sub && <div className={cn('text-[12px] leading-snug', toneText[subTone ?? 'muted'])}>{sub}</div>}
        </div>
    );
}

// A row of tiles. Fixed column counts rather than auto-fit: auto-fit resolved to
// five tracks for eight tiles once, leaving a second row with three tiles and two
// empty cells, which reads as a truncated grid.
export function StatGrid({ cols = 4, className, ...props }: React.ComponentProps<'div'> & { cols?: 2 | 3 | 4 | 5 | 6 }) {
    return (
        <div
            data-slot="stat-grid"
            className={cn('grid gap-3 grid-cols-2', {
                3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4',
                5: 'sm:grid-cols-3 lg:grid-cols-5', 6: 'sm:grid-cols-3 lg:grid-cols-6', 2: '',
            }[cols], className)}
            {...props}
        />
    );
}
