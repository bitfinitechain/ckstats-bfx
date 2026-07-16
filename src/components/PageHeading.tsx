import React from "react";

/**
 * The single page-title idiom (shared with the explorer): sans, bold,
 * tracking-tight, sentence case. No dot, no mono, no uppercase.
 */
export default function PageHeading({
    children,
    sub,
    action,
    className = "",
}: {
    children: React.ReactNode;
    sub?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`mb-6 flex flex-wrap items-start justify-between gap-3 ${className}`}>
            <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-foreground break-all">{children}</h1>
                {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
            </div>
            {action}
        </div>
    );
}
