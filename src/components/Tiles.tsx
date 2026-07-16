import { hashrateSuffix, abbreviateNumber, secondsToDHM, diffToNowDHM, getBlockReward, formatBFX, expectedBlockSeconds } from "@/lib/utils";
import StatTile, { Metric } from "@/components/StatTile";
import MiniChart from "@/components/MiniChart";
import { Activity, CheckCircle, Users, Gauge } from "lucide-react";

interface TilesProps {
    stats: any;
}

const qualifier = (t: string) => (
    <span className="text-sm font-normal font-sans text-muted-foreground ml-2">{t}</span>
);

export default function Tiles({ stats }: TilesProps) {
    if (!stats) return null;
    const { global, blocks, history } = stats;

    const latestHeight = blocks?.[0]?.height ?? 0;
    const poolHr = Number(global.hashrate1d || global.hashrate5m || 0);
    const estSecs = expectedBlockSeconds(global.difficulty || 0, poolHr);
    const estBlock = estSecs > 0 ? secondsToDHM(estSecs) : '—';

    // Share rate = new accepted shares per poll interval (delta of the cumulative
    // accepted-shares series). Represents how hard the active workers are grinding —
    // a live signal, unlike the flat worker-count line, and distinct from every other tile.
    const shareRate: number[] = Array.isArray(history?.shares)
        ? history.shares.map((v: number, i: number, a: number[]) => (i > 0 ? Math.max(0, v - a[i - 1]) : 0))
        : [];

    const luck = global.luck;
    const luckClass = !luck ? 'text-muted-foreground' : luck >= 100 ? 'text-success' : 'text-foreground';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
            {/* Hashrate */}
            <StatTile
                label="Hashrate"
                icon={<Activity size={16} />}
                value={<>{hashrateSuffix(global.hashrate5m)}{qualifier('5m Avg')}</>}
            >
                {history?.hashrate?.length > 0 && (
                    <div className="mt-4">
                        <div className="h-10"><MiniChart data={history.hashrate} color="var(--primary)" height={40} /></div>
                        <p className="text-[10px] text-muted-foreground text-right mt-1">Hashrate Variance</p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-y-3 pt-3 border-t border-border/70 mt-4">
                    <Metric label="1 Hour" value={hashrateSuffix(global.hashrate1hr)} />
                    <Metric label="1 Day" value={hashrateSuffix(global.hashrate1d || 0)} />
                    <div className="col-span-2 mt-1 pt-3 border-t border-border/70 flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pool Luck (24h)</span>
                        <span className={`text-lg font-bold font-mono tabular-nums ${luckClass}`}>
                            {luck ? `${luck.toFixed(2)}%` : '---'}
                        </span>
                    </div>
                </div>
            </StatTile>

            {/* Accepted Shares */}
            <StatTile
                label="Accepted Shares"
                icon={<CheckCircle size={16} />}
                value={abbreviateNumber(global.accepted || 0)}
            >
                {history?.shares?.length > 1 && (
                    <div className="mt-4">
                        <div className="h-10"><MiniChart data={history.shares} type="bar" color="var(--primary)" height={40} /></div>
                        <p className="text-[10px] text-muted-foreground text-right mt-1">Shares Trend</p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-y-4 pt-3 border-t border-border/70 mt-4">
                    <Metric label="Best Share" value={abbreviateNumber(global.bestshare || 0)} />
                    <Metric label="Rejected" value={abbreviateNumber(global.rejected || 0)} />
                    <Metric label="SPS (1m)" value={global.SPS1m || "0"} />
                    <Metric label="Total Processed" value={abbreviateNumber((global.accepted || 0) + (global.rejected || 0))} />
                </div>
            </StatTile>

            {/* Active Workers */}
            <StatTile
                label="Active Workers"
                icon={<Users size={16} />}
                value={<>{global.workers}{qualifier('Workers')}</>}
            >
                {shareRate.length > 1 && (
                    <div className="mt-4">
                        <div className="h-10"><MiniChart data={shareRate} type="line" color="var(--primary)" height={40} /></div>
                        <p className="text-[10px] text-muted-foreground text-right mt-1">Share Activity</p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-y-4 pt-3 border-t border-border/70 mt-4">
                    <Metric label="Users" value={global.users} />
                    <Metric label="Uptime" value={secondsToDHM(global.runtime || 0)} />
                    <div className="col-span-2">
                        <Metric label="Last Update" value={diffToNowDHM(global.lastupdate || Date.now() / 1000)} />
                    </div>
                </div>
            </StatTile>

            {/* Network */}
            <StatTile
                label="Network"
                icon={<Gauge size={16} />}
                value={<>{hashrateSuffix(global.networkHashrate || 0)}{qualifier('Net Hashrate')}</>}
            >
                {history?.networkHashrate?.length > 1 && (
                    <div className="mt-4">
                        <div className="h-10"><MiniChart data={history.networkHashrate} type="line" color="var(--primary)" height={40} /></div>
                        <p className="text-[10px] text-muted-foreground text-right mt-1">Network Hashrate</p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-y-4 pt-3 border-t border-border/70 mt-4">
                    <Metric label="Difficulty" value={abbreviateNumber(global.difficulty || 0)} />
                    <Metric label="Block Reward" value={formatBFX(getBlockReward(latestHeight))} />
                    <div className="col-span-2 mt-1 pt-3 border-t border-border/70 flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Est. Time to Block</span>
                        <span className="text-lg font-bold font-mono tabular-nums">{estBlock}</span>
                    </div>
                </div>
            </StatTile>
        </div>
    );
}
