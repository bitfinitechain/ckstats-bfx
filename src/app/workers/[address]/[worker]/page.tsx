"use client";

import { use, useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { hashrateSuffix, abbreviateNumber, diffToNowDHM, formatHashrate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MiniChart from '@/components/MiniChart';
import MisoLoader from '@/components/MisoLoader';
import { Activity, CheckCircle, ArrowLeft, Cpu } from 'lucide-react';
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/Pagination";

// Helper for consistency
function Metric({ label, headline }: { label: string; headline: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-sm text-muted-foreground uppercase tracking-wider mb-1 text-[10px]">{label}</span>
            <span className="text-lg font-bold font-mono">{headline}</span>
        </div>
    );
}

export default function IndividualWorkerPage({ params }: { params: Promise<{ address: string; worker: string }> }) {
    const { address, worker: workerNameEncoded } = use(params);
    const decodedAddress = decodeURIComponent(address);
    const decodedWorkerName = decodeURIComponent(workerNameEncoded);

    const { stats, isConnected } = useSocket();
    const [user, setUser] = useState<any>(null);
    const [workerData, setWorkerData] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        if (stats && stats.users) {
            const match = stats.users.find((u: any) => u.address === decodedAddress)
                || stats.users.find((u: any) => u.address.replace('bfx:', '') === decodedAddress);

            setUser(match);

            if (match && match.workerDetails) {
                const wData = match.workerDetails.find((w: any) => w.workername === decodedWorkerName);
                setWorkerData(wData);
            }
        }
    }, [stats, decodedAddress, decodedWorkerName]);

    const minerBlocks = stats?.blocks?.filter((b: any) => b.worker === decodedWorkerName) || [];
    const totalPages = Math.ceil(minerBlocks.length / ITEMS_PER_PAGE);
    const paginatedBlocks = minerBlocks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (!isConnected && !user) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
                <MisoLoader size={80} />
                <span>Connecting to server...</span>
            </div>
        );
    }

    if (!user) {
        if (stats) {
            return (
                <div className="container mx-auto px-4 py-8">
                    <Link href={`/workers/${address}`} className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to User
                    </Link>
                    <Card className="p-8 text-center">
                        <h2 className="text-xl font-bold mb-2">User Not Found</h2>
                        <p className="text-muted-foreground">The user {decodedAddress} is currently offline or does not exist.</p>
                    </Card>
                </div>
            )
        }
        return (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
                <MisoLoader size={80} />
                <span>Loading stats...</span>
            </div>
        );
    }

    if (!workerData) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Link href={`/workers/${address}`} className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to User
                </Link>
                <Card className="p-8 text-center">
                    <h2 className="text-xl font-bold mb-2">Worker Not Found</h2>
                    <p className="text-muted-foreground">The worker {decodedWorkerName} is currently offline or does not exist.</p>
                </Card>
            </div>
        )
    }

    const shortName = decodedWorkerName.split('.').slice(1).join('.') || 'Default';

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <Link href={`/workers/${address}`} className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to User
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 break-all">
                        <span className="w-3 h-3 rounded-full bg-primary"></span>
                        {shortName}
                    </h1>
                    <p className="font-mono text-sm text-muted-foreground mt-1 ml-5">{decodedWorkerName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                    <span className="text-sm font-medium">Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Hashrate Tile */}
                <Card className="p-6">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">HASHRATE</span>
                        <Activity size={16} className="text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-4">
                        {formatHashrate(workerData.hashrate5m)}
                        <span className="text-sm font-normal text-muted-foreground ml-2">5m Avg</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 pt-2 border-t mt-auto">
                        <Metric label="1 Minute" headline={formatHashrate(workerData.hashrate1m)} />
                        <Metric label="1 Hour" headline={formatHashrate(workerData.hashrate1hr)} />
                        <Metric label="1 Day" headline={formatHashrate(workerData.hashrate1d || 0)} />
                        <Metric label="1 Week" headline={formatHashrate(workerData.hashrate7d || 0)} />
                    </div>
                    {workerData.history?.hashrate && (
                        <div className="mt-4 pt-4 border-t h-16">
                            <MiniChart data={workerData.history.hashrate} color="currentColor" height={40} className="text-primary" />
                        </div>
                    )}
                </Card>

                {/* Shares Tile */}
                <Card className="p-6">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">SHARES</span>
                        <CheckCircle size={16} className="text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-4">
                        {abbreviateNumber(workerData.shares || 0)}
                        <span className="text-sm font-normal text-muted-foreground ml-2">Accepted</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 pt-2 border-t mt-auto">
                        <Metric label="Best Share" headline={abbreviateNumber(workerData.bestshare || 0)} />
                        <Metric label="Best Ever" headline={abbreviateNumber(workerData.bestever || 0)} />
                        <Metric label="Last Share" headline={diffToNowDHM(workerData.lastshare || Date.now() / 1000)} />
                    </div>
                    {workerData.history?.shares && (
                        <div className="mt-4 pt-4 border-t h-16">
                            <MiniChart data={workerData.history.shares} type="bar" color="currentColor" height={40} className="text-primary" />
                        </div>
                    )}
                </Card>
            </div>

            {/* Mined Blocks History */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        MINING HISTORY
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs font-bold font-sans uppercase text-muted-foreground">Time</TableHead>
                                <TableHead className="text-xs font-bold font-sans uppercase text-muted-foreground">Block Height</TableHead>
                                <TableHead className="text-right text-xs font-bold font-sans uppercase text-muted-foreground">Reward</TableHead>
                                <TableHead className="text-right text-xs font-bold font-sans uppercase text-muted-foreground">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedBlocks && paginatedBlocks.length > 0 ? (
                                paginatedBlocks.map((block: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-bold font-mono text-sm">{new Date(block.time).toLocaleString()}</TableCell>
                                        <TableCell className="font-bold font-mono text-sm">
                                            <a href={`https://explorer.bitfinitechain.org/${block.txid ? 'tx/' + block.txid : 'block/' + block.height}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                                #{block.height}
                                            </a>
                                        </TableCell>
                                        <TableCell className="text-right font-bold font-mono text-sm text-primary">1.00 BFX</TableCell>
                                        <TableCell className="text-right font-bold font-mono text-sm text-muted-foreground">Confirmed</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No blocks mined by this worker yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
