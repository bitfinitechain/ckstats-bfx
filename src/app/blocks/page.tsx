"use client";

import { useSocket } from "@/hooks/useSocket";
import { useMiningMode } from "@/store/miningMode";
import MiningTabs, { PoolEmpty, HighDiffEmpty } from "@/components/MiningTabs";
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
                <MisoLoader size={120} className="mx-auto" />
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
        <div className="mt-8 space-y-6">
            <MiningTabs solo={stats} pool={poolStats} highdiff={rentalStats} />

            {!active ? (
                mode === "highdiff" ? <HighDiffEmpty /> : <PoolEmpty />
            ) : (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            RECENT BLOCKS
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-primary' : 'bg-destructive'}`}></span>
                            {isConnected ? 'Live' : 'Offline'}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs font-bold font-sans uppercase text-muted-foreground">Height</TableHead>
                                    <TableHead className="text-xs font-bold font-sans uppercase text-muted-foreground">Solved By</TableHead>
                                    <TableHead className="text-right text-xs font-bold font-sans uppercase text-muted-foreground">Reward</TableHead>
                                    <TableHead className="hidden sm:table-cell text-right text-xs font-bold font-sans uppercase text-muted-foreground">Time Found</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedBlocks && paginatedBlocks.length > 0 ? (
                                    paginatedBlocks.map((block: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-bold font-mono text-sm whitespace-nowrap">#{block.height}</TableCell>
                                            <TableCell className="font-bold font-mono text-xs sm:text-sm" title={block.solver}>
                                                <a href={`https://explorer.bitfinitechain.org/address/${block.solver}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                                    {obfuscateAddress(block.solver)}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-right font-bold font-mono text-xs sm:text-sm text-primary whitespace-nowrap">{formatBFX(getBlockReward(block.height))}</TableCell>
                                            <TableCell className="hidden sm:table-cell text-right font-bold font-mono text-sm whitespace-nowrap">{new Date(block.time).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No blocks found recently.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
