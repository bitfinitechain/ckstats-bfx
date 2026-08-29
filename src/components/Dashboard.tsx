"use client";

import Link from "next/link";
import { useSocket } from "@/hooks/useSocket";
import { useMiningMode, MINING_SOURCES, sourceKeyFor, type MiningMode, type MiningTier } from "@/store/miningMode";
import { formatHashrate, diffToNowDHM, obfuscateAddress } from "@/lib/utils";
import Tiles from "@/components/Tiles";
import MiningTabs, { SourceEmpty } from "@/components/MiningTabs";
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
    const { isConnected, stats, sources } = useSocket();
    const { mode, tier } = useMiningMode();

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

    const sk = sourceKeyFor(mode, tier);
    const src = sk ? MINING_SOURCES[sk] : null;
    const active = sk ? sources[sk] : null;

    return (
        <div>
            <PageHeading action={<MiningTabs sources={sources} />}>
                Overview
            </PageHeading>

            {active ? (
                <>
                    <Tiles stats={active} />
                    <WorkersCard stats={active} isConnected={isConnected} title={src?.workersTitle ?? ""} emptyLine={src?.emptyWorkers ?? ""} />
                </>
            ) : (
                <SourceEmpty sourceKey={sk} mode={mode} tier={tier} />
            )}
        </div>
    );
}

function WorkersCard({ stats, isConnected, title, emptyLine }: { stats: any; isConnected: boolean; title: string; emptyLine: string }) {
    // Same rule as /workers: ckpool keeps a state file per miner forever, so most of
    // this list is miners who have gone away — showing them made every row read "0
    // workers". This card is a summary, so it always shows connected miners only; the
    // full history + toggle lives on /workers.
    const allUsers = stats?.users ?? [];
    const connected = allUsers.filter((u: any) => Number(u.workers || 0) > 0);
    const idleCount = allUsers.length - connected.length;

    // Summary cards get a fixed number of rows. This one rendered every connected
    // miner, which looks fine at today's handful and turns the dashboard into an
    // unbounded list the moment the pool grows — this page is meant to be a
    // glance, and /workers is what pages through everything. Ranked by hashrate
    // so the rows that survive the cut are the ones worth glancing at, rather
    // than whatever order ckpool happened to send.
    const TOP_N = 10;
    const ranked = [...connected].sort(
        (a: any, b: any) => Number(b.hashrate5m || 0) - Number(a.hashrate5m || 0),
    );
    const users = ranked.slice(0, TOP_N);
    const hiddenCount = ranked.length - users.length;

    return (
        <Card>
            <CardTitleRow
                title={title}
                right={
                    <span className="flex items-center gap-3">
                        {idleCount > 0 && (
                            <Link href="/workers" className="text-xs text-muted-foreground hover:text-primary">
                                {idleCount} idle hidden
                            </Link>
                        )}
                        <LivePill isConnected={isConnected} />
                    </span>
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
                                {idleCount > 0 ? "No miners connected right now" : emptyLine}
                            </TableCell>
                        </TableRow>
                    )}
                    {hiddenCount > 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                                <Link href="/workers" className="hover:text-primary">
                                    Top {users.length} by hashrate — view all {ranked.length} connected miners
                                </Link>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}
