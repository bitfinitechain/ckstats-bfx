// GENERATED — do not edit here.
// Canonical: Brandkit/ui/wordmark.tsx   ·   update there, then: bash skills/sync.sh
import React from 'react';

// The BitFinite lockup. One implementation, so the four apps cannot drift.
//
// It drifted twice already: analytics rendered "BIT FINITE ANALYTICS" as three
// spaced words because a flex `gap` was added to the container, while the
// explorer has BIT and FINITE adjacent with the product suffix set apart. The
// difference is invisible in isolation and obvious side by side, which is
// exactly the failure mode a shared component exists to prevent.
//
// STRUCTURE and TYPOGRAPHY live here. COLOUR does not: the apps do not share
// semantic token names (--foreground/--primary vs --fg/--acc), so each sets
// --wm-fg and --wm-accent and the component stays neutral. That is the same
// split tokens.css already makes — share primitives, not semantics.
export function Wordmark({
    accent = 'FINITE', lead = 'BIT', suffix, size = 'md', fluid, hideSuffixBelow = true, className,
}: {
    lead?: string;
    accent?: string;
    /** Product name after the lockup — EXPLORER, ANALYTICS, POOL. */
    suffix?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Step 20px -> 24px at 768px instead of a fixed size. */
    fluid?: boolean;
    /** Suffix drops on narrow screens; the lockup alone identifies the site. */
    hideSuffixBelow?: boolean;
    className?: string;
}) {
    return (
        <span className={['bfx-wm', fluid ? 'bfx-wm--fluid' : `bfx-wm--${size}`, className].filter(Boolean).join(' ')}>
            <span className="bfx-wm__lead">{lead}</span>
            <span className="bfx-wm__accent">{accent}</span>
            {suffix && (
                <span className={`bfx-wm__suffix${hideSuffixBelow ? ' bfx-wm__suffix--responsive' : ''}`}>
                    {suffix}
                </span>
            )}
        </span>
    );
}
export default Wordmark;
