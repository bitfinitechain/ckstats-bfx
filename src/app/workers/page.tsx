"use client";

import { useSocket } from "@/hooks/useSocket";
import { useMiningMode } from "@/store/miningMode";
import { formatHashrate, obfuscateAddress } from "@/lib/utils";
import { WorkerSearch } from "@/components/WorkerSearch";
import MiningTabs, { PoolEmpty, HighDiffEmpty } from "@/components/MiningTabs";
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

export default function WorkersPage() {
    const { isConnected, stats, poolStats, rentalStats } = useSocket();
    const { mode } = useMiningMode();

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <MisoLoader size={120} className="mx-auto" />
                <p className="text-muted-foreground">Loading worker statistics...</p>
                <div className="text-xs text-muted-foreground">
                    Socket: {isConnected ? "Connected" : "Disconnected"}
                </div>
            </div>
        );
    }

    const active = mode === "solo" ? stats : mode === "pool" ? poolStats : rentalStats;
    const users = active?.users ?? [];

    return (
        <div className="mt-8 space-y-6">
            <MiningTabs solo={stats} pool={poolStats} highdiff={rentalStats} />

            {!active ? (
                mode === "highdiff" ? <HighDiffEmpty /> : <PoolEmpty />
            ) : (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            {mode === "solo" ? "SOLO WORKERS" : mode === "pool" ? "POOL WORKERS" : "HIGH-DIFF WORKERS"}
                        </CardTitle>
                        <div className="flex items-center gap-4">
                            <WorkerSearch />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-primary' : 'bg-destructive'}`}></span>
                                {isConnected ? 'Live' : 'Offline'}
                            </div>
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
                                            <TableCell className="font-bold font-mono text-xs sm:text-sm truncate max-w-[160px] sm:max-w-[300px]" title="Address hidden for privacy">
                                                {obfuscateAddress(u.address)}
                                            </TableCell>
                                            <TableCell className="text-right font-bold font-mono text-xs sm:text-sm">{u.workers}</TableCell>
                                            <TableCell className="text-right font-bold font-mono text-xs sm:text-sm whitespace-nowrap">{formatHashrate(u.hashrate5m)} <span className="text-xs font-normal text-muted-foreground">H/s</span></TableCell>
                                            <TableCell className="hidden sm:table-cell text-right font-bold font-mono text-sm whitespace-nowrap">{u.lastshare ? new Date(u.lastshare * 1000).toLocaleTimeString() : 'N/A'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            {mode === "solo" ? "No active workers found." : mode === "pool" ? "No pool miners yet." : "No high-diff miners yet."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
