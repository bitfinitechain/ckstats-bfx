"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSocket } from "@/hooks/useSocket";
import { useMiningMode } from "@/store/miningMode";
import { formatHashrate, obfuscateAddress } from "@/lib/utils";
import { WorkerSearch } from "@/components/WorkerSearch";
import MiningTabs, { PoolEmpty, HighDiffEmpty } from "@/components/MiningTabs";
import MisoLoader from "@/components/MisoLoader";
import { Pagination } from "@/components/Pagination";
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

const PAGE_SIZES = [10, 25, 50, 100];

export default function WorkersPage() {
    const { isConnected, stats, poolStats, rentalStats } = useSocket();
    const { mode } = useMiningMode();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [activeOnly, setActiveOnly] = useState(true);

    // Back to the first page when switching Solo/Pool/High-diff or page size.
    useEffect(() => { setPage(1); }, [mode, pageSize, activeOnly]);

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
    const allUsers = active?.users ?? [];
    // ckpool keeps a state file per miner forever, so most of this list is miners who
    // have gone away (86% of the solo list had 0 workers). Default to those actually
    // connected — but show the count and let it be toggled, never silently hidden.
    const idleCount = allUsers.filter((u: any) => Number(u.workers || 0) === 0).length;
    const users = activeOnly ? allUsers.filter((u: any) => Number(u.workers || 0) > 0) : allUsers;
    const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginated = users.slice((safePage - 1) * pageSize, safePage * pageSize);

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
                    <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border flex-wrap">
                        <p className="text-sm text-muted-foreground">
                            {users.length.toLocaleString()} miner{users.length === 1 ? "" : "s"}
                        </p>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            Show
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                            >
                                {PAGE_SIZES.map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={activeOnly}
                                onChange={(e) => setActiveOnly(e.target.checked)}
                                className="accent-primary"
                            />
                            <span>
                                Connected only
                                {idleCount > 0 && (
                                    <span className="ml-1 text-xs">({idleCount} idle hidden)</span>
                                )}
                            </span>
                        </label>
                    </div>
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
                            {paginated && paginated.length > 0 ? (
                                paginated.map((u: any) => (
                                    <TableRow key={u.address}>
                                        {/* No truncate. obfuscateAddress has already shortened this to
                                            bfx:fpd3gf...93tg5x; capping it at 160px cut the tail off
                                            the shortened form, and the tail is what tells two miners
                                            apart. The table scrolls, so the column can have its width. */}
                                        <TableCell className="font-mono whitespace-nowrap" title="View this miner's workers">
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
                                        {activeOnly && idleCount > 0 ? "No miners currently connected — untick \u201cConnected only\u201d to see miners who have mined here before." : mode === "solo" ? "No active workers found." : mode === "pool" ? "No pool miners yet." : "No high-diff miners yet."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
                </Card>
            )}
        </div>
    );
}
