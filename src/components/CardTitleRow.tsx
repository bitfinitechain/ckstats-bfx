import React from "react";

/** Header row for a titled data card: 1.5px dot + uppercase title + optional right slot. */
export function CardTitleRow({ title, right }: { title: React.ReactNode; right?: React.ReactNode }) {
    // flex-wrap, not flex-row. With a search input in the right slot this row
    // wanted 424px inside a 340px card on a phone, and Card sets overflow-hidden
    // — so the excess was not contained, it was destroyed. Wrapping puts the
    // controls on their own line instead.
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-foreground flex items-center gap-2.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {title}
            </h2>
            {right}
        </div>
    );
}

/** Live / offline connection indicator (success dot when connected). */
export function LivePill({ isConnected }: { isConnected?: boolean }) {
    return (
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-success" : "bg-destructive"}`} />
            {isConnected ? "Live" : "Offline"}
        </span>
    );
}
