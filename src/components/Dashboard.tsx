"use client";

import { useSocket } from "@/hooks/useSocket";
import { useMiningMode } from "@/store/miningMode";
import { formatHashrate, diffToNowDHM, obfuscateAddress } from "@/lib/utils";
import Tiles from "@/components/Tiles";
import MiningTabs, { PoolEmpty } from "@/components/MiningTabs";
import MisoLoader from "@/components/MisoLoader";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function Dashboard() {
    const { isConnected, stats, poolStats } = useSocket();
    const { mode } = useMiningMode();

    // Initial connection — no data at all yet.
    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <MisoLoader size={120} className="mx-auto" />
                <div className="flex items-center gap-2 text-xl font-bold text-muted-foreground animate-pulse">
                    <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-primary' : 'bg-destructive'}`}></span>
                    <span>{isConnected ? 'Connecting to pool...' : 'Waiting for connection...'}</span>
                </div>
            </div>
        );
    }

    const active = mode === "solo" ? stats : poolStats;

    return (
        <div className="space-y-8">
            <MiningTabs solo={stats} pool={poolStats} />

            {active ? (
                <>
                    <Tiles stats={active} />
                    <WorkersCard stats={active} isConnected={isConnected} mode={mode} />
                </>
            ) : (
                <PoolEmpty />
            )}
        </div>
    );
}

function WorkersCard({ stats, isConnected, mode }: { stats: any; isConnected: boolean; mode: "solo" | "pool" }) {
    const users = stats?.users ?? [];
    const title = mode === "solo" ? "SOLO WORKERS" : "POOL WORKERS";

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {title}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-primary' : 'bg-destructive'}`}></span>
                    {isConnected ? 'Live' : 'Connecting...'}
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs font-bold font-sans uppercase text-muted-foreground">Address</TableHead>
                            <TableHead className="text-right text-xs font-bold font-sans uppercase text-muted-foreground">Workers</TableHead>
                            <TableHead className="text-right text-xs font-bold font-sans uppercase text-muted-foreground">Hashrate (5m)</TableHead>
                            <TableHead className="hidden sm:table-cell text-right text-xs font-bold font-sans uppercase text-muted-foreground">Last Share</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users && users.length > 0 ? (
                            users.map((u: any) => (
                                <TableRow key={u.address}>
                                    <TableCell className="font-bold font-mono text-xs sm:text-sm truncate max-w-[160px] sm:max-w-[200px] md:max-w-none" title="Address hidden for privacy">
                                        {obfuscateAddress(u.address)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold font-barlow text-base sm:text-lg">{u.workers}</TableCell>
                                    <TableCell className="text-right font-bold font-barlow text-base sm:text-lg whitespace-nowrap">
                                        {formatHashrate(u.hashrate5m)} <span className="text-sm font-normal text-muted-foreground">H/s</span>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-right font-bold font-barlow text-lg whitespace-nowrap">
                                        {diffToNowDHM(u.lastshare)}
                                    </TableCell>
                                </TableRow>
                            ))) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    {mode === "solo" ? "No active workers" : "No pool miners yet"}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
