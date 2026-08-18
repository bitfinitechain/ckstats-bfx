// GENERATED — do not edit here.
// Canonical: Brandkit/ui/data-table.tsx   ·   update there, then: bash skills/sync.sh
import * as React from 'react';

import { cn } from '@/lib/utils';

// A grid "table" — the shape this dashboard actually uses, where a row is a CSS
// grid rather than a <tr> so a cell can hold a gauge or a sparkline.
//
// It replaces SEVEN implementations: CardTable/CardTRow, TableWrap/THead/TRow,
// and ERow/BRow. The last two were byte-identical apart from their grid template,
// which is the clearest possible argument for one component with a `tpl` prop.
//
// Every containment lesson this codebase has paid for is baked in here so a call
// site cannot forget one:
//  • the scroller carries overscroll-behavior-x, or a sideways fling at the end
//    of a wide table chains into page navigation;
//  • min-w-0 on the wrapper, because a grid/flex child defaults to min-width:auto
//    and will not shrink below its content, which silently disables the scroller;
//  • width:auto + min-width:<min> inside, not width:100%, which crushes the table
//    back to the container and squashes the columns;
//  • an affordance is rendered when it scrolls — a silent scroller reads as
//    truncated data, which is how an admin once reported three of seven columns
//    as "missing".
export function DataTable({
    cols, tpl, min, aligns, className, children, caption,
}: {
    cols: React.ReactNode[];
    tpl: string;
    min: number;
    aligns?: ('l' | 'r')[];
    className?: string;
    children: React.ReactNode;
    caption?: string;
}) {
    return (
        <div className={cn('min-w-0 max-w-full', className)}>
            <div className="min-w-0 max-w-full overflow-x-auto [overscroll-behavior-x:contain]">
                <div style={{ width: 'auto', minWidth: min }}>
                    <DataRow tpl={tpl} head aligns={aligns} cells={cols} />
                    {children}
                </div>
            </div>
            {/* Shown only below the width where these tables actually overflow.
                `ops-only-sm` is the existing utility for that breakpoint. */}
            <div className="ops-only-sm font-mono text-[10px] tracking-wider text-mut mt-1.5">
                {caption ?? '← swipe for more columns →'}
            </div>
        </div>
    );
}

export function DataRow({
    tpl, cells, head, aligns, href, highlight, last, className,
}: {
    tpl: string;
    cells: React.ReactNode[];
    head?: boolean;
    aligns?: ('l' | 'r')[];
    href?: string;
    highlight?: boolean;
    last?: boolean;
    className?: string;
}) {
    const inner = cells.map((c, i) => (
        <span
            key={i}
            className={cn(
                'overflow-hidden text-ellipsis whitespace-nowrap',
                (aligns ? aligns[i] === 'r' : i > 0) ? 'text-right' : 'text-left',
            )}
        >
            {c}
        </span>
    ));

    const cls = cn(
        'grid items-center gap-x-2.5 py-2 font-mono tabular-nums',
        head ? 'text-[10.5px] tracking-widest text-mut' : 'text-[12.5px] text-fg2',
        !last && 'border-b border-line',
        highlight && 'bg-[var(--hov)]',
        href && 'ops-hoverrow no-underline cursor-pointer',
        className,
    );

    // A navigable row is an anchor, not a div with onClick — it has to be
    // focusable and openable in a new tab like any other link.
    return href
        ? <a href={href} className={cls} style={{ gridTemplateColumns: tpl }}>{inner}</a>
        : <div className={cls} style={{ gridTemplateColumns: tpl }}>{inner}</div>;
}

// The designed empty state. Every async surface needs one: an empty table with no
// explanation is indistinguishable from a broken one.
export function DataEmpty({ title, body, className }: { title: string; body?: string; className?: string }) {
    return (
        <div className={cn('rounded-lg border border-line bg-cardbg px-5 py-8 text-center', className)}>
            <div className="text-[13.5px] font-semibold text-fg2">{title}</div>
            {body && <div className="mx-auto mt-1.5 max-w-[46ch] text-[12.5px] leading-relaxed text-mut">{body}</div>}
        </div>
    );
}
