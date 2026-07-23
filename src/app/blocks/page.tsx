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
