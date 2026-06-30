"use client";

import { use, useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { hashrateSuffix, abbreviateNumber, diffToNowDHM, secondsToDHM, formatHashrate } from '@/lib/utils'; // Verify imports or re-implement
import { Card, CardContent } from '@/components/ui/card';
import MiniChart from '@/components/MiniChart';
import { Activity, CheckCircle, Info, Users, ArrowLeft, Cpu } from 'lucide-react';
import Link from 'next/link';

// Helper for consistency
function Metric({ label, headline }: { label: string; headline: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-sm text-muted-foreground uppercase tracking-wider mb-1 text-[10px]">{label}</span>
            <span className="text-lg font-bold font-mono">{headline}</span>
        </div>
    );
}
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CardHeader, CardTitle } from '@/components/ui/card';

import { Pagination } from "@/components/Pagination";

export default function WorkerPage({ params }: { params: Promise<{ address: string }> }) {
    const { address } = use(params);
    const decodedAddress = decodeURIComponent(address);

    const { stats, isConnected } = useSocket();
    const [worker, setWorker] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const minerBlocks = stats?.blocks?.filter((b: any) => b.solver === decodedAddress || (worker && b.solver === worker.address)) || [];

    const totalPages = Math.ceil(minerBlocks.length / ITEMS_PER_PAGE);
    const paginatedBlocks = minerBlocks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (stats && stats.users) {
            const match = stats.users.find((u: any) => u.address === decodedAddress)
                || stats.users.find((u: any) => u.address.replace('bfx:', '') === decodedAddress);

            setWorker(match);
        }
    }, [stats, decodedAddress]);

    if (!isConnected && !worker) {
        return <div className="p-8 text-center text-muted-foreground">Connecting to server...</div>;
    }

    if (!worker) {
        // Show "Not Found" or "Offline" if stats loaded but user not found
        // Only show if we are sure stats loaded (stats is distinct from null)
        if (stats) {
            return (
                <div className="container mx-auto px-4 py-8">
                    <Link href="/workers" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Workers
                    </Link>
                    <Card className="p-8 text-center">
                        <h2 className="text-xl font-bold mb-2">Worker Not Found</h2>
                        <p className="text-muted-foreground">The worker {decodedAddress} is currently offline or does not exist.</p>
                    </Card>
                </div>
            )
        }
        return <div className="p-8 text-center text-muted-foreground">Loading stats...</div>;
    }

    // Reuse similar logic to Tiles for formatting
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <Link href="/workers" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Workers
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 break-all">
                        <span className="w-3 h-3 rounded-full bg-primary"></span>
                        {worker.address}
                    </h1>
                    <p className="text-muted-foreground mt-1 ml-5">Miner Address Statistics</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                    <span className="text-sm font-medium">Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {/* Hashrate Tile */}
                <Card className="p-6">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">HASHRATE</span>
                        <Activity size={16} className="text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-4">
                        {hashrateSuffix(worker.hashrate5m)}
                        <span className="text-sm font-normal text-muted-foreground ml-2">5m Avg</span>
                    </div>

                    {/* Hashrate Chart */}
                    {worker.history && worker.history.hashrate && worker.history.hashrate.length > 1 && (
                        <div className="mb-4">
                            <div className="h-10">
                                <MiniChart data={worker.history.hashrate} type="line" color="var(--primary)" height={40} />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-right mt-1">Hashrate Trend</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-y-2 pt-2 border-t mt-auto">
                        <Metric label="1 Minute" headline={hashrateSuffix(worker.hashrate1m)} />
                        <Metric label="1 Hour" headline={hashrateSuffix(worker.hashrate1hr)} />
                        <Metric label="1 Day" headline={hashrateSuffix(worker.hashrate1d || 0)} />
                        <Metric label="1 Week" headline={hashrateSuffix(worker.hashrate7d || 0)} />
                    </div>
                </Card>

                {/* Shares Tile */}
                <Card className="p-6">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">SHARES</span>
                        <CheckCircle size={16} className="text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-4">
                        {abbreviateNumber(worker.shares || 0)}
                        <span className="text-sm font-normal text-muted-foreground ml-2">Accepted</span>
                    </div>

                    {/* Shares Bar Chart */}
                    {worker.history && worker.history.shares && worker.history.shares.length > 0 && (
                        <div className="mb-4">
                            <div className="h-10">
                                <MiniChart data={worker.history.shares} type="bar" color="var(--primary)" height={40} />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-right mt-1">Shares Trend</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-y-4 pt-2 border-t mt-auto">
                        <Metric label="Best Share" headline={abbreviateNumber(worker.bestshare || 0)} />
                        <Metric label="Best Ever" headline={abbreviateNumber(worker.bestever || 0)} />
                        <Metric label="Last Share" headline={diffToNowDHM(worker.lastshare || Date.now() / 1000)} />
                    </div>
                </Card>

                {/* Wallet Tile */}
                <Card className="p-6">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">ACCUMULATED COINS</span>
                        <Activity size={16} className="text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-4">
                        {((worker.balance?.confirmed || 0) / 100000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        <span className="text-sm font-normal text-muted-foreground ml-2">BFX</span>
                    </div>

                    {/* Wallet Chart */}
                    {worker.history && worker.history.balance && worker.history.balance.length > 1 && (
                        <div className="mb-4">
                            <div className="h-10">
                                <MiniChart data={worker.history.balance} type="line" color="var(--primary)" height={40} />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-right mt-1">Balance Growth</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-y-4 pt-2 border-t mt-auto">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Unconfirmed</span>
                            <span className="text-lg font-bold font-mono">{((worker.balance?.unconfirmed || 0) / 100000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                        </div>
                    </div>
                </Card>

                {/* Worker Info Tile */}
                <Card className="p-6">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">DETAILS</span>
                        <Cpu size={16} className="text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-4">
                        {worker.workers}
                        <span className="text-sm font-normal text-muted-foreground ml-2">Active Units</span>
                    </div>

                    {/* Workers Line Chart */}
                    {worker.history && worker.history.workers && worker.history.workers.length > 1 && (
                        <div className="mb-4">
                            <div className="h-10">
                                <MiniChart data={worker.history.workers} type="line" color="var(--primary)" height={40} />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-right mt-1">Activity Trend</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-y-4 pt-2 border-t mt-auto">
                        <div className="flex flex-col col-span-2">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Authorised</span>
                            <span className="text-lg font-bold font-mono">{diffToNowDHM(worker.authorised || Date.now() / 1000)}</span>
                        </div>
                    </div>
                </Card>

            </div>

            {/* Worker Breakdown Table */}
            <Card className="mt-8 mb-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        WORKERS
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs font-bold font-sans uppercase text-muted-foreground">Worker ID</TableHead>
                                <TableHead className="text-right text-xs font-bold font-sans uppercase text-muted-foreground">Hashrate (5m)</TableHead>
                                <TableHead className="text-right text-xs font-bold font-sans uppercase text-muted-foreground">Shares</TableHead>
                                <TableHead className="text-right text-xs font-bold font-sans uppercase text-muted-foreground">Last Share</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {worker.workerDetails && worker.workerDetails.length > 0 ? (
                                worker.workerDetails.map((w: any) => {
                                    const shortName = w.workername.split('.').slice(1).join('.') || 'Default';

                                    // Construct clean URL
                                    const encodedWorker = encodeURIComponent(w.workername);

                                    return (
                                        <TableRow
                                            key={w.workername}
                                            className="hover:bg-muted/50 transition-colors"
                                        >
                                            <TableCell className="font-bold font-mono text-sm">
                                                <Link
                                                    href={`/workers/${address}/${encodedWorker}`}
                                                    className="flex items-center gap-2 text-primary hover:underline"
                                                >
                                                    {shortName}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right font-bold font-mono text-sm">{formatHashrate(w.hashrate5m)} <span className="text-xs font-normal text-muted-foreground">H/s</span></TableCell>
                                            <TableCell className="text-right font-bold font-mono text-sm">{abbreviateNumber(w.shares || 0)}</TableCell>
                                            <TableCell className="text-right font-bold font-mono text-sm">{diffToNowDHM(w.lastshare || Date.now() / 1000)}</TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No individual worker stats available. ({worker.workerDetails ? worker.workerDetails.length : 'undefined'})
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
