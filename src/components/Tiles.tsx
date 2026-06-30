
import { hashrateSuffix, abbreviateNumber, secondsToDHM, diffToNowDHM } from "@/lib/utils";
import {
    Card,
} from "@/components/ui/card";
import MiniChart from "@/components/MiniChart";
import NetworkChart from "@/components/NetworkChart";
import { Activity, CheckCircle, Info, Users, Clock, Calendar } from "lucide-react";

interface TilesProps {
    stats: any;
}

export default function Tiles({ stats }: TilesProps) {
    if (!stats) return null;
    const { global, blocks, history } = stats;



    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Hashrate Tile */}
            <Card className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase">HASHRATE</span>
                    <Activity size={16} className="text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-4">
                    {hashrateSuffix(global.hashrate5m)}
                    <span className="text-sm font-normal text-muted-foreground ml-2">5m Avg</span>
                </div>

                {history && history.hashrate && history.hashrate.length > 0 && (
                    <div className="mb-4">
                        <div className="h-10">
                            <MiniChart data={history.hashrate} color="var(--primary)" height={40} />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-right mt-1">Hashrate Variance</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-y-2 pt-2 border-t mt-auto">
                    <Metric label="1 Hour" headline={hashrateSuffix(global.hashrate1hr)} />
                    <Metric label="1 Day" headline={hashrateSuffix(global.hashrate1d || 0)} />
                    <div className="col-span-2 mt-2 pt-2 border-t flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pool Luck (24h)</span>
                        <span className={`text-lg font-bold font-mono ${!global.luck ? 'text-muted-foreground' : global.luck >= 100 ? 'text-green-500' : 'text-orange-500'}`}>
                            {global.luck ? `${global.luck.toFixed(2)}%` : '---'}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Shares Tile */}
            <Card className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase">ACCEPTED SHARES</span>
                    <CheckCircle size={16} className="text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-4">
                    {abbreviateNumber(global.accepted || 0)}
                </div>

                {/* Shares Bar Chart */}
                {history && history.shares && history.shares.length > 1 && (
                    <div className="mb-4">
                        <div className="h-10">
                            <MiniChart data={history.shares} type="bar" color="var(--primary)" height={40} />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-right mt-1">Shares Trend</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-y-4 pt-2 border-t mt-auto">
                    <Metric label="Best Share" headline={abbreviateNumber(global.bestshare || 0)} />
                    <Metric label="Rejected" headline={abbreviateNumber(global.rejected || 0)} />
                    <Metric label="SPS (1m)" headline={global.SPS1m || "0"} />
                    <Metric label="Total processed" headline={abbreviateNumber((global.accepted || 0) + (global.rejected || 0))} />
                </div>
            </Card>

            {/* Info Tile */}
            <Card className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase">ACTIVE WORKERS</span>
                    <Users size={16} className="text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-4">
                    {global.workers}
                    <span className="text-sm font-normal text-muted-foreground ml-2">Workers</span>
                </div>

                {/* Workers Line Chart */}
                {history && history.workers && history.workers.length > 1 && (
                    <div className="mb-4">
                        <div className="h-10">
                            <MiniChart data={history.workers} type="line" color="var(--primary)" height={40} />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-right mt-1">Worker Activity</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-y-4 pt-2 border-t mt-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Users</span>
                        <span className="text-lg font-bold font-mono">{global.users}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Uptime</span>
                        <span className="text-lg font-bold font-mono">{secondsToDHM(global.runtime || 0)}</span>
                    </div>
                    <div className="flex flex-col col-span-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Last Update</span>
                        <span className="text-lg font-bold font-mono">{diffToNowDHM(global.lastupdate || Date.now() / 1000)}</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function Metric({ label, headline }: { label: string; headline: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-sm text-muted-foreground uppercase tracking-wider mb-1 text-[10px]">{label}</span>
            <span className="text-lg font-bold font-mono">{headline}</span>
        </div>
    );
}
