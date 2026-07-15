"use client";

import { useId, useMemo } from 'react';

interface MiniChartProps {
    data: number[];
    color?: string;
    height?: number;
    className?: string;
    type?: 'line' | 'bar';
}

interface Pt {
    x: number;
    y: number;
}

// Catmull-Rom spline → cubic-bezier path. Turns the angular point-to-point
// sparkline into a soft, continuous curve (tension 0).
function smoothLine(pts: Pt[]): string {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] ?? pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] ?? p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }
    return d;
}

export default function MiniChart({ data, color = "currentColor", height = 40, className = "", type = "line" }: MiniChartProps) {
    // Unique gradient id per instance so multiple sparklines don't collide.
    const rawId = useId().replace(/[:]/g, "");
    const gradId = `mc-fill-${rawId}`;

    const content = useMemo(() => {
        if (!data || data.length < 2) return null;

        const width = 100;
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        if (type === 'bar') {
            const barWidth = width / data.length;
            const gap = barWidth * 0.28;
            const actualBarWidth = barWidth - gap;

            return data.map((value, index) => {
                // Bars scale within their own height so short bars stay visible.
                const normalizedHeight = (value - min) / range;
                const h = Math.max(normalizedHeight * height, 2);
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
                        opacity={0.75}
                    />
                );
            });
        }

        // Line: soft curve + gradient area fill. Pad the vertical range so the
        // 2px stroke never clips at the top/bottom edge.
        const pad = 3;
        const usable = height - pad * 2;
        const pts: Pt[] = data.map((value, index) => ({
            x: (index / (data.length - 1)) * width,
            y: pad + (1 - (value - min) / range) * usable,
        }));

        const linePath = smoothLine(pts);
        const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

        return (
            <>
                <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
                <path
                    d={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            </>
        );
    }, [data, height, type, color, gradId]);

    if (!data || data.length < 2) return null;

    return (
        <div className={`w-full overflow-hidden ${className}`} style={{ height: `${height}px` }}>
            <svg
                viewBox={`0 0 100 ${height}`}
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
            >
                <defs>
                    <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={height}>
                        <stop offset="0%" stopColor={color} stopOpacity="0.32" />
                        <stop offset="55%" stopColor={color} stopOpacity="0.10" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                    </linearGradient>
                </defs>
                {content}
            </svg>
        </div>
    );
}
