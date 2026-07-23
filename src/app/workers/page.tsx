"use client";

import Link from "next/link";
import { useSocket } from "@/hooks/useSocket";
import { useMiningMode } from "@/store/miningMode";
import { formatHashrate, obfuscateAddress } from "@/lib/utils";
import { WorkerSearch } from "@/components/WorkerSearch";
import MiningTabs, { PoolEmpty, HighDiffEmpty } from "@/components/MiningTabs";
import MisoLoader from "@/components/MisoLoader";
import { Card } from "@/components/ui/card";
import { CardTitleRow, LivePill } from "@/components/CardTitleRow";
import PageHeading from "@/components/PageHeading";
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
                <MisoLoader size={96} className="mx-auto" />
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
        <div>
            <PageHeading action={<MiningTabs solo={stats} pool={poolStats} highdiff={rentalStats} />}>
                Workers
            </PageHeading>

            {!active ? (
                mode === "highdiff" ? <HighDiffEmpty /> : <PoolEmpty />
            ) : (
                <Card>
                    <CardTitleRow
                        title={mode === "solo" ? "Solo Workers" : mode === "pool" ? "Pool Workers" : "High-Diff Workers"}
                        right={
                            <div className="flex items-center gap-4">
                                <WorkerSearch />
                                <LivePill isConnected={isConnected} />
                            </div>
                        }
                    />
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
                                        <TableCell className="font-mono truncate max-w-[160px] sm:max-w-[300px]" title="View this miner's workers">
                                            <Link href={`/workers/${u.address}`} className="text-primary hover:underline">
                                                {obfuscateAddress(u.address)}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-right font-mono tabular-nums">{u.workers}</TableCell>
                                        <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">{formatHashrate(u.hashrate5m)} <span className="text-xs font-normal text-muted-foreground">H/s</span></TableCell>
                                        <TableCell className="hidden sm:table-cell text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">{u.lastshare ? new Date(u.lastshare * 1000).toLocaleTimeString() : 'N/A'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                                        {mode === "solo" ? "No active workers found." : mode === "pool" ? "No pool miners yet." : "No high-diff miners yet."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}
