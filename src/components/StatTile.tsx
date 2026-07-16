import React from "react";
import { cn } from "@/lib/utils";

/**
 * The single stat-tile surface (shared with the explorer). Simple form: label +
 * mono value (+ unit/sub). Rich form: pass an `icon` and/or `children` (a chart,
 * a Metric grid) to build the Dashboard-style composite tiles.
 */
export default function StatTile({
    label,
    value,
    unit,
    sub,
    icon,
    dot = false,
    className = "",
    children,
}: {
    label: React.ReactNode;
    value?: React.ReactNode;
    unit?: string;
    sub?: React.ReactNode;
    icon?: React.ReactNode;
    dot?: boolean;
    className?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className={cn("bg-card border border-border rounded-2xl p-5 flex flex-col", className)}>
            <div className="flex items-start justify-between gap-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    {dot && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    {label}
                </div>
                {icon && <span className="text-primary shrink-0">{icon}</span>}
            </div>

            {value != null && (
                <div className="mt-2.5 text-2xl md:text-[28px] font-bold tracking-tight tabular-nums font-mono text-foreground leading-none">
                    {value}
                    {unit && <span className="text-sm text-muted-foreground font-semibold ml-1">{unit}</span>}
                </div>
            )}

            {sub && <div className="text-xs text-muted-foreground mt-2">{sub}</div>}
            {children}
        </div>
    );
}

/** Small labelled sub-value used inside rich tiles (replaces the 3 duplicate copies). */
export function Metric({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
            <span className="text-lg font-bold font-mono tabular-nums text-foreground">{value}</span>
        </div>
    );
}
