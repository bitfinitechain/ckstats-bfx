"use client";

import { useSocket } from "@/hooks/useSocket";
import { useMiningMode } from "@/store/miningMode";
import MiningTabs, { PoolEmpty, HighDiffEmpty } from "@/components/MiningTabs";
import { Card } from "@/components/ui/card";
import { LivePill } from "@/components/CardTitleRow";
import PageHeading from "@/components/PageHeading";
import StatTile from "@/components/StatTile";
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
import { Coins, Boxes, Layers } from "lucide-react";
import React from 'react';

export default function PayoutsPage() {
    const { isConnected, stats, poolStats, rentalStats } = useSocket();
    const { mode } = useMiningMode();

    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 20;

    React.useEffect(() => { setCurrentPage(1); }, [mode]);

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <MisoLoader size={96} className="mx-auto" />
                <p className="text-muted-foreground">Loading payout history...</p>
                <div className="text-xs text-muted-foreground">
                    Socket: {isConnected ? "Connected" : "Disconnected"}
                </div>
            </div>
        );
    }

    const active = mode === "solo" ? stats : mode === "pool" ? poolStats : rentalStats;
    const blocks = active?.blocks ?? [];

    // Each row is a block this source solved; the payout is that block's coinbase reward.
    const now = Date.now();
    const dayBlocks = (blocks || []).filter((b: any) => b.time && now - b.time < 86_400_000);
    const rewarded24h = dayBlocks.reduce((sum: number, b: any) => sum + getBlockReward(b.height), 0);
    const latestHeight = blocks?.[0]?.height;

    const totalPages = Math.ceil((blocks?.length || 0) / ITEMS_PER_PAGE);
    const paginatedBlocks = blocks?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div>
            <PageHeading action={<MiningTabs solo={stats} pool={poolStats} highdiff={rentalStats} />}>
                Payouts
            </PageHeading>

            {!active ? (
                mode === "highdiff" ? <HighDiffEmpty /> : <PoolEmpty />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
                        <StatTile icon={<Boxes size={16} />} label="Blocks Found (24h)" value={dayBlocks.length.toLocaleString()} />
                        <StatTile icon={<Coins size={16} />} label="Rewarded (24h)" value={formatBFX(rewarded24h)} />
                        <StatTile icon={<Layers size={16} />} label="Latest Block" value={latestHeight != null ? `#${latestHeight}` : '—'} />
                    </div>

                    <Card>
                        <div className="px-5 py-4 border-b border-border">
                            <div className="flex flex-row items-center justify-between gap-3">
                                <h2 className="text-[13px] font-bold uppercase tracking-wider text-foreground flex items-center gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    Recent Payouts
                                </h2>
                                <LivePill isConnected={isConnected} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Coinbase rewards paid to miners who solved a block on the BitFinite{" "}
                                {mode === "solo" ? "solo" : mode === "pool" ? "shared" : "high-difficulty solo"} pool.
                                Each reward is the block subsidy — <span className="font-semibold text-foreground">50 BFX</span>,
                                halving every 210,000 blocks.
                            </p>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Receiver</TableHead>
                                    <TableHead className="text-right">Reward</TableHead>
                                    <TableHead className="hidden md:table-cell text-right">Transaction</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedBlocks && paginatedBlocks.length > 0 ? (
                                    paginatedBlocks.map((block: any, i: number) => {
                                        const href = `https://explorer.bitfinitechain.org/${block.txid ? 'tx/' + block.txid : 'block/' + block.height}`;
                                        return (
                                            <TableRow key={i}>
                                                <TableCell className="font-mono tabular-nums text-muted-foreground whitespace-nowrap">{new Date(block.time).toLocaleString()}</TableCell>
                                                <TableCell className="font-mono" title={block.solver}>
                                                    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                                        {obfuscateAddress(block.solver)}
                                                    </a>
                                                </TableCell>
                                                <TableCell className="text-right font-mono tabular-nums text-foreground whitespace-nowrap">{formatBFX(getBlockReward(block.height))}</TableCell>
                                                <TableCell className="hidden md:table-cell text-right">
                                                    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary text-sm">
                                                        {block.txid ? `View transaction` : `Height ${block.height} (coinbase)`}
                                                    </a>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                                            No payouts found recently.
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
