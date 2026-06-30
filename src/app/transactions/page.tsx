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
import React from 'react';

export default function PaymentsPage() {
    const { isConnected, stats } = useSocket();

    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 20;

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading transactions history...</p>
                <div className="text-xs text-muted-foreground">
                    Socket: {isConnected ? "Connected" : "Disconnected"}
                </div>
            </div>
        );
    }

    const { blocks } = stats;

    const totalPages = Math.ceil((blocks?.length || 0) / ITEMS_PER_PAGE);
    const paginatedBlocks = blocks?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <Card className="mt-8">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    RECENT TRANSACTIONS
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
                            <TableHead className="text-xs font-bold font-sans uppercase text-muted-foreground">Time</TableHead>
                            <TableHead className="text-xs font-bold font-sans uppercase text-muted-foreground">Receiver</TableHead>
                            <TableHead className="text-right text-xs font-bold font-sans uppercase text-muted-foreground">Amount</TableHead>
                            <TableHead className="text-right text-xs font-bold font-sans uppercase text-muted-foreground">TXID (Block Height)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedBlocks && paginatedBlocks.length > 0 ? (
                            paginatedBlocks.map((block: any, i: number) => (
                                <TableRow key={i}>
                                    <TableCell className="font-bold font-mono text-sm">{new Date(block.time).toLocaleString()}</TableCell>
                                    <TableCell className="font-bold font-mono text-sm truncate max-w-[300px]" title={block.solver}>
                                        <a href={`https://explorer.bitfinitechain.org/${block.txid ? 'tx/' + block.txid : 'block/' + block.height}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                            {block.solver}
                                        </a>
                                    </TableCell>
                                    <TableCell className="text-right font-bold font-mono text-sm text-primary">1.00 BFX</TableCell>
                                    <TableCell className="text-right font-bold font-mono text-sm text-muted-foreground">
                                        <a href={`https://explorer.bitfinitechain.org/${block.txid ? 'tx/' + block.txid : 'block/' + block.height}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            {block.txid ? `View Transaction` : `Height ${block.height} (Coinbase)`}
                                        </a>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No payments found recently.
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
    );
}
