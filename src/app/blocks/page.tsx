"use client";

import Link from "next/link";
import { useSocket } from "@/hooks/useSocket";
import { useMiningMode } from "@/store/miningMode";
import MiningTabs, { PoolEmpty, HighDiffEmpty } from "@/components/MiningTabs";
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
import { Pagination } from "@/components/Pagination";
import MisoLoader from "@/components/MisoLoader";
import { getBlockReward, formatBFX, obfuscateAddress } from "@/lib/utils";
import React from 'react';

export default function BlocksPage() {
    const { isConnected, stats, poolStats, rentalStats } = useSocket();
    const { mode } = useMiningMode();

    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 20;

    // Reset paging when switching Solo/Pool so we never land on an out-of-range page.
    React.useEffect(() => { setCurrentPage(1); }, [mode]);

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <MisoLoader size={96} className="mx-auto" />
                <p className="text-muted-foreground">Loading block history...</p>
                <div className="text-xs text-muted-foreground">
                    Socket: {isConnected ? "Connected" : "Disconnected"}
                </div>
            </div>
        );
    }

    const active = mode === "solo" ? stats : mode === "pool" ? poolStats : rentalStats;
    const blocks = active?.blocks ?? [];

    const totalPages = Math.ceil((blocks?.length || 0) / ITEMS_PER_PAGE);
    const paginatedBlocks = blocks?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // ── Top block finders ────────────────────────────────────────────────────
    // The block list is chronological, so it never answers "who has found the most?".
    // Aggregate the same data instead of fetching anything new.
    // NB: only meaningful for solo / high-diff. On the shared PPLNS pool the coinbase
    // pays the POOL address, so every block would be credited to one address — the
    // individual finder isn't recoverable from this data, so we don't pretend it is.
    // NOTE: computed inline, NOT in a hook — this runs after the `if (!stats) return`
    // above, so a useMemo here would change the hook count between renders and crash
    // the page (Rules of Hooks). One pass over <=2000 blocks is cheap.
    const finders = (() => {
        if (mode === "pool") return [] as { solver: string; count: number; bfx: number; last: number }[];
        const by = new Map<string, { solver: string; count: number; bfx: number; last: number }>();
        for (const b of (blocks as any[]) ?? []) {
            if (!b?.solver) continue;
            const e = by.get(b.solver) ?? { solver: b.solver, count: 0, bfx: 0, last: 0 };
            e.count += 1;
            e.bfx += getBlockReward(b.height);
            e.last = Math.max(e.last, Number(b.time) || 0);
            by.set(b.solver, e);
        }
        return [...by.values()].sort((a, b) => b.count - a.count || b.last - a.last).slice(0, 10);
    })();

    return (
        <div>
            <PageHeading action={<MiningTabs solo={stats} pool={poolStats} highdiff={rentalStats} />}>
                Blocks
            </PageHeading>

            {!active ? (
                mode === "highdiff" ? <HighDiffEmpty /> : <PoolEmpty />
            ) : (
                <>
                    <Card>
                        <CardTitleRow title="Recent Blocks" right={<LivePill isConnected={isConnected} />} />
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Height</TableHead>
                                    <TableHead>Solved By</TableHead>
                                    <TableHead className="text-right">Reward</TableHead>
                                    <TableHead className="hidden sm:table-cell text-right">Time Found</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedBlocks && paginatedBlocks.length > 0 ? (
                                    paginatedBlocks.map((block: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-mono font-bold whitespace-nowrap">
                                                <a href={`https://explorer.bitfinitechain.org/block/${block.height}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" title="View block on the explorer">#{block.height}</a>
                                            </TableCell>
                                            <TableCell className="font-mono" title="View this miner's workers">
                                                <Link href={`/workers/${block.solver}`} className="hover:underline text-primary">
                                                    {obfuscateAddress(block.solver)}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right font-mono tabular-nums text-foreground whitespace-nowrap">{formatBFX(getBlockReward(block.height))}</TableCell>
                                            <TableCell className="hidden sm:table-cell text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">{new Date(block.time).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                                            No blocks found recently.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    {finders.length > 0 && (
                        <Card className="mb-6">
                            <CardTitleRow
                                title="Top block finders"
                                right={<span className="text-xs text-muted-foreground">{blocks.length} block{blocks.length === 1 ? "" : "s"} tracked</span>}
                            />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">#</TableHead>
                                        <TableHead>Miner</TableHead>
                                        <TableHead className="text-right">Blocks</TableHead>
                                        <TableHead className="text-right">Rewards</TableHead>
                                        <TableHead className="hidden sm:table-cell text-right">Last block</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {finders.map((f, i) => (
                                        <TableRow key={f.solver}>
                                            <TableCell className="font-mono tabular-nums text-muted-foreground">{i + 1}</TableCell>
                                            <TableCell className="font-mono" title="View this miner's workers">
                                                <Link href={`/workers/${f.solver}`} className="hover:underline text-primary">
                                                    {obfuscateAddress(f.solver)}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right font-mono tabular-nums font-bold text-foreground">{f.count}</TableCell>
                                            <TableCell className="text-right font-mono tabular-nums text-foreground whitespace-nowrap">{formatBFX(f.bfx)}</TableCell>
                                            <TableCell className="hidden sm:table-cell text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">{f.last ? new Date(f.last).toLocaleString() : "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <p className="px-5 pb-4 pt-1 text-xs text-muted-foreground">
                                Aggregated from the blocks tracked below — solo finders keep the full reward.
                            </p>
                        </Card>
                    )}
                    {mode === "pool" && blocks.length > 0 && (
                        <p className="mb-6 text-xs text-muted-foreground">
                            No finder leaderboard on the shared pool: its coinbase pays the pool
                            address, then rewards are split by shares — so the individual finder
                            isn&apos;t recoverable from block data.
                        </p>
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </>
            )}
        </div>
    );
}
