"use client";

import { useSocket } from "@/hooks/useSocket";
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
import { getBlockReward, formatBFX, obfuscateAddress } from "@/lib/utils";
import { Coins, Boxes, Layers } from "lucide-react";
import React from 'react';

export default function PayoutsPage() {
    const { isConnected, stats } = useSocket();

    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 20;

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading payout history...</p>
                <div className="text-xs text-muted-foreground">
                    Socket: {isConnected ? "Connected" : "Disconnected"}
                </div>
            </div>
        );
    }

    const { blocks } = stats;

    // Each row is a block the solo pool solved; the payout is that block's coinbase reward.
    const now = Date.now();
    const dayBlocks = (blocks || []).filter((b: any) => b.time && now - b.time < 86_400_000);
    const rewarded24h = dayBlocks.reduce((sum: number, b: any) => sum + getBlockReward(b.height), 0);
    const latestHeight = blocks?.[0]?.height;

    const totalPages = Math.ceil((blocks?.length || 0) / ITEMS_PER_PAGE);
    const paginatedBlocks = blocks?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard icon={<Boxes size={16} className="text-primary" />} label="Blocks Found (24h)" value={dayBlocks.length.toLocaleString()} />
                <SummaryCard icon={<Coins size={16} className="text-primary" />} label="Rewarded (24h)" value={formatBFX(rewarded24h)} />
                <SummaryCard icon={<Layers size={16} className="text-primary" />} label="Latest Block" value={latestHeight != null ? `#${latestHeight}` : '—'} />
            </div>

            <Card>
                <CardHeader className="space-y-2 pb-6">
                    <div className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            RECENT PAYOUTS
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-primary' : 'bg-destructive'}`}></span>
                            {isConnected ? 'Live' : 'Offline'}
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Coinbase rewards paid to miners who solved a block on the BitFinite solo pool.
                        Each reward is the block subsidy — <span className="font-semibold text-foreground">50 BFX</span>,
                        halving every 210,000 blocks.
                    </p>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs font-bold font-sans uppercase text-muted-foreground">Time</TableHead>
                                <TableHead className="text-xs font-bold font-sans uppercase text-muted-foreground">Receiver</TableHead>
                                <TableHead className="text-right text-xs font-bold font-sans uppercase text-muted-foreground">Reward</TableHead>
                                <TableHead className="hidden md:table-cell text-right text-xs font-bold font-sans uppercase text-muted-foreground">TXID (Block Height)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedBlocks && paginatedBlocks.length > 0 ? (
                                paginatedBlocks.map((block: any, i: number) => {
                                    const href = `https://explorer.bitfinitechain.org/${block.txid ? 'tx/' + block.txid : 'block/' + block.height}`;
                                    return (
                                        <TableRow key={i}>
                                            <TableCell className="font-bold font-mono text-xs sm:text-sm whitespace-nowrap">{new Date(block.time).toLocaleString()}</TableCell>
                                            <TableCell className="font-bold font-mono text-xs sm:text-sm" title={block.solver}>
                                                <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                                    {obfuscateAddress(block.solver)}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-right font-bold font-mono text-xs sm:text-sm text-primary whitespace-nowrap">{formatBFX(getBlockReward(block.height))}</TableCell>
                                            <TableCell className="hidden md:table-cell text-right font-bold font-mono text-sm text-muted-foreground">
                                                <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    {block.txid ? `View Transaction` : `Height ${block.height} (Coinbase)`}
                                                </a>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No payouts found recently.
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
        </div>
    );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Card className="p-5">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
                {icon}
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">{value}</div>
        </Card>
    );
}
