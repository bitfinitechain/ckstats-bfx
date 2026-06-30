"use client";

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { hashrateSuffix } from "@/lib/utils";

interface NetworkChartProps {
    poolHashrate: number[];
    networkHashrate: number[];
    height?: number;
    className?: string;
}

export default function NetworkChart({ poolHashrate, networkHashrate, height = 200, className = "" }: NetworkChartProps) {
    const data = useMemo(() => {
        if (!poolHashrate || !networkHashrate || poolHashrate.length < 2) return [];

        return poolHashrate.map((val, i) => {
            const net = networkHashrate[i] || 0;
            // "Other" hashrate is Network - Pool. 
            // If Pool > Network (unlikely unless solo or error), clamp to 0.
            const other = Math.max(0, net - val);
            return {
                name: i,
                pool: val,
                other: other,
                network: net
            };
        });
    }, [poolHashrate, networkHashrate]);

    if (data.length === 0) return null;

    return (
        <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 0,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: any, name: any) => [hashrateSuffix(BigInt(Math.floor(Number(value || 0)))), name === 'pool' ? 'Pool Hashrate' : name === 'other' ? 'Other Network' : name]}
                        labelFormatter={() => ''}
                    />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-[10px] uppercase font-bold text-muted-foreground">{value === 'pool' ? 'Pool' : 'Network'}</span>}
                    />
                    <Area
                        type="monotone"
                        dataKey="other"
                        stackId="1"
                        stroke="var(--muted-foreground)"
                        fill="var(--muted-foreground)"
                        fillOpacity={0.5}
                        strokeOpacity={0.8}
                        name="other"
                    />
                    <Area
                        type="monotone"
                        dataKey="pool"
                        stackId="1"
                        stroke="var(--primary)"
                        fill="var(--primary)"
                        fillOpacity={0.8}
                        name="pool"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
