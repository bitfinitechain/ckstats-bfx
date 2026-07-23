"use client";

import Link from "next/link";
import { useSocket } from "@/hooks/useSocket";
import { useMiningMode, type MiningMode } from "@/store/miningMode";
import { formatHashrate, diffToNowDHM, obfuscateAddress } from "@/lib/utils";
import Tiles from "@/components/Tiles";
import MiningTabs, { PoolEmpty, HighDiffEmpty } from "@/components/MiningTabs";
import MisoLoader from "@/components/MisoLoader";
import PageHeading from "@/components/PageHeading";
import { Card } from "@/components/ui/card";
import { CardTitleRow, LivePill } from "@/components/CardTitleRow";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function Dashboard() {
    const { isConnected, stats, poolStats, rentalStats } = useSocket();
    const { mode } = useMiningMode();

    // Initial connection — no data at all yet.
    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <MisoLoader size={96} className="mx-auto" />
                <div className="flex items-center gap-2 text-xl font-bold text-muted-foreground animate-pulse">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`}></span>
                    <span>{isConnected ? 'Connecting to pool...' : 'Waiting for connection...'}</span>
                </div>
            </div>
        );
    }

    const active = mode === "solo" ? stats : mode === "pool" ? poolStats : rentalStats;

    return (
        <div>
            <PageHeading action={<MiningTabs solo={stats} pool={poolStats} highdiff={rentalStats} />}>
                Overview
            </PageHeading>

            {active ? (
                <>
                    <Tiles stats={active} />
                    <WorkersCard stats={active} isConnected={isConnected} mode={mode} />
                </>
            ) : mode === "highdiff" ? (
                <HighDiffEmpty />
            ) : (
                <PoolEmpty />
            )}
        </div>
    );
}

function WorkersCard({ stats, isConnected, mode }: { stats: any; isConnected: boolean; mode: MiningMode }) {
    const users = stats?.users ?? [];
    const title = mode === "solo" ? "Solo Workers" : mode === "pool" ? "Pool Workers" : "High-Diff Workers";

    return (
        <Card>
            <CardTitleRow title={title} right={<LivePill isConnected={isConnected} />} />
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Address</TableHead>
                        <TableHead className="text-right">Workers</TableHead>
                        <TableHead className="text-right">Hashrate (5m)</TableHead>
                        <TableHead className="hidden sm:table-cell text-right">Last Share</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users && users.length > 0 ? (
                        users.map((u: any) => (
                            <TableRow key={u.address}>
                                <TableCell className="font-mono truncate max-w-[160px] sm:max-w-[200px] md:max-w-none" title="View this miner's workers">
                                    <Link href={`/workers/${u.address}`} className="text-primary hover:underline">
                                        {obfuscateAddress(u.address)}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-right font-mono tabular-nums">{u.workers}</TableCell>
                                <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                                    {formatHashrate(u.hashrate5m)} <span className="text-xs font-normal text-muted-foreground">H/s</span>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-right font-mono tabular-nums whitespace-nowrap text-muted-foreground">
                                    {diffToNowDHM(u.lastshare)}
                                </TableCell>
                            </TableRow>
                        ))) : (
                        <TableRow>
                            <TableCell colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                                {mode === "solo" ? "No active workers" : mode === "pool" ? "No pool miners yet" : "No high-diff miners yet"}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}
