"use client";

import { useMemo } from 'react';

interface MiniChartProps {
    data: number[];
    color?: string;
    height?: number;
    className?: string;
    type?: 'line' | 'bar';
}

export default function MiniChart({ data, color = "currentColor", height = 40, className = "", type = "line" }: MiniChartProps) {
    const content = useMemo(() => {
        if (!data || data.length < 2) return null;

        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        if (type === 'bar') {
            const barWidth = 100 / data.length;
            const gap = barWidth * 0.2; // 20% gap
            const actualBarWidth = barWidth - gap;

            return data.map((value, index) => {
                const normalizedHeight = ((value - min) / range); // 0 to 1 relative to min, or maybe absolute?
                // For bars, usually we want absolute if min is close to 0, or relative to range?
                // User said "Accepted Shares", which accumulate? Or rate? 
                // Using relative range is safer for visualization if values are high.
                // Let's use relative to min for "zoom" effect, or 0-based if appropriate.
                // For "shares", they are cumulative totals? Or rate?
                // If cumulative, bar chart will just be increasing steps. 
                // Ah, user said "Accepted Shares as bar chart". Usually implies distinct buckets (e.g. per minute).
                // Poller will likely send snapshot of total accepted shares. 
                // I might need to derive delta if I want "shares per interval". 
                // But for now, let's just render values. 

                // Let's stick to relative scaling to fill height.
                const h = Math.max(normalizedHeight * height, 2); // Min 2px
                const x = index * barWidth + gap / 2;
                const y = height - h;

                return (
                    <rect
                        key={index}
                        x={x}
                        y={y}
                        width={actualBarWidth}
                        height={h}
                        fill={color}
                        opacity={0.8}
                    />
                );
            });
        }

        // Line chart logic
        const width = 100;
        const points = data.map((value, index) => {
            const x = (index / (data.length - 1)) * width;
            const normalizedY = 1 - ((value - min) / range);
            const y = normalizedY * height;
            return `${x},${y}`;
        }).join(" ");

        return (
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        );
    }, [data, height, type, color]);

    if (!data || data.length < 2) return null;

    return (
        <div className={`w-full overflow-hidden ${className}`} style={{ height: `${height}px` }}>
            <svg
                viewBox={`0 0 100 ${height}`}
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
            >
                {content}
            </svg>
        </div>
    );
}
