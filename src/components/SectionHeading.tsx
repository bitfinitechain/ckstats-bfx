import React from "react";

/**
 * The single in-page section-heading idiom (shared with the explorer):
 * bar-pill accent + bold title. Replaces the w-2/w-3 round-dot variants.
 */
export default function SectionHeading({
    children,
    action,
    className = "",
}: {
    children: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full shrink-0" />
                {children}
            </h2>
            {action}
        </div>
    );
}
