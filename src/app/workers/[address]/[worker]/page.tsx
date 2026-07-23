"use client";

import { use, useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { hashrateSuffix, abbreviateNumber, diffToNowDHM, formatHashrate, getBlockReward, formatBFX } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { CardTitleRow } from '@/components/CardTitleRow';
import StatTile, { Metric } from '@/components/StatTile';
import PageHeading from '@/components/PageHeading';
import MiniChart from '@/components/MiniChart';
import MisoLoader from '@/components/MisoLoader';
import { Activity, CheckCircle, ArrowLeft } from 'lucide-react';
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

const qualifier = (t: string) => (
    <span className="text-sm font-normal font-sans text-muted-foreground ml-2">{t}</span>
);

function NotFound({ backHref, backLabel, title, body }: { backHref: string; backLabel: string; title: string; body: React.ReactNode }) {
    return (
        <div>
            <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backLabel}
            </Link>
            <Card className="p-8 text-center">
                <h2 className="text-xl font-bold mb-2 text-foreground">{title}</h2>
                <p className="text-muted-foreground break-all">{body}</p>
            </Card>
        </div>
    );
}

export default function IndividualWorkerPage({ params }: { params: Promise<{ address: string; worker: string }> }) {
    const { address, worker: workerNameEncoded } = use(params);
    const decodedAddress = decodeURIComponent(address);
    const decodedWorkerName = decodeURIComponent(workerNameEncoded);

    const { stats, poolStats, rentalStats, isConnected } = useSocket();
    const [user, setUser] = useState<any>(null);
    const [workerData, setWorkerData] = useState<any>(null);
    const [srcBlocks, setSrcBlocks] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        // Search all three ckpool sources (solo / shared pool / high-diff) so a
        // pool miner's worker resolves too — and keep that source's blocks.
        const findIn = (s: any) =>
            s && s.users
                ? s.users.find((u: any) => u.address === decodedAddress)
                  || s.users.find((u: any) => u.address.replace('bfx:', '') === decodedAddress)
                : undefined;
        for (const s of [stats, poolStats, rentalStats]) {
            const match = findIn(s);
            if (match) {
                setUser(match);
                if (match.workerDetails) {
                    setWorkerData(match.workerDetails.find((w: any) => w.workername === decodedWorkerName));
                }
                setSrcBlocks(s.blocks || []);
                break;
            }
        }
    }, [stats, poolStats, rentalStats, decodedAddress, decodedWorkerName]);

    const minerBlocks = srcBlocks.filter((b: any) => b.worker === decodedWorkerName) || [];
    const totalPages = Math.ceil(minerBlocks.length / ITEMS_PER_PAGE);
    const paginatedBlocks = minerBlocks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (!isConnected && !user) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
                <MisoLoader size={96} />
                <span>Connecting to server...</span>
            </div>
        );
    }

    if (!user) {
        if (stats) {
            return <NotFound backHref={`/workers/${address}`} backLabel="Back to User" title="User Not Found" body={<>The user {decodedAddress} is currently offline or does not exist.</>} />;
        }
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
                <MisoLoader size={96} />
                <span>Loading stats...</span>
            </div>
        );
    }

    if (!workerData) {
        return <NotFound backHref={`/workers/${address}`} backLabel="Back to User" title="Worker Not Found" body={<>The worker {decodedWorkerName} is currently offline or does not exist.</>} />;
    }

    const shortName = decodedWorkerName.split('.').slice(1).join('.') || 'Default';

    return (
        <div>
            <Link href={`/workers/${address}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to User
            </Link>

            <PageHeading
                sub={<span className="font-mono">{decodedWorkerName}</span>}
                action={
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span className="w-2 h-2 rounded-full bg-success" />
                        Online
                    </span>
                }
            >
                {shortName}
            </PageHeading>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-8">
                {/* Hashrate */}
                <StatTile label="Hashrate" icon={<Activity size={16} />} value={<>{formatHashrate(workerData.hashrate5m)}{qualifier('5m Avg')}</>}>
                    {workerData.history?.hashrate?.length > 1 && (
                        <div className="mt-4">
                            <div className="h-10"><MiniChart data={workerData.history.hashrate} type="line" color="var(--primary)" height={40} /></div>
                            <p className="text-[10px] text-muted-foreground text-right mt-1">Hashrate Trend</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-y-3 pt-3 border-t border-border/70 mt-4">
                        <Metric label="1 Minute" value={formatHashrate(workerData.hashrate1m)} />
                        <Metric label="1 Hour" value={formatHashrate(workerData.hashrate1hr)} />
                        <Metric label="1 Day" value={formatHashrate(workerData.hashrate1d || 0)} />
                        <Metric label="1 Week" value={formatHashrate(workerData.hashrate7d || 0)} />
                    </div>
                </StatTile>

                {/* Shares */}
                <StatTile label="Shares" icon={<CheckCircle size={16} />} value={<>{abbreviateNumber(workerData.shares || 0)}{qualifier('Accepted')}</>}>
                    {workerData.history?.shares?.length > 0 && (
                        <div className="mt-4">
                            <div className="h-10"><MiniChart data={workerData.history.shares} type="bar" color="var(--primary)" height={40} /></div>
                            <p className="text-[10px] text-muted-foreground text-right mt-1">Shares Trend</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-y-4 pt-3 border-t border-border/70 mt-4">
                        <Metric label="Best Share" value={abbreviateNumber(workerData.bestshare || 0)} />
                        <Metric label="Best Ever" value={abbreviateNumber(workerData.bestever || 0)} />
                        <div className="col-span-2">
                            <Metric label="Last Share" value={diffToNowDHM(workerData.lastshare || Date.now() / 1000)} />
                        </div>
                    </div>
                </StatTile>
            </div>

            {/* Mining history */}
            <Card>
                <CardTitleRow title="Mining History" />
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Block Height</TableHead>
                            <TableHead className="text-right">Reward</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedBlocks && paginatedBlocks.length > 0 ? (
                            paginatedBlocks.map((block: any, i: number) => (
                                <TableRow key={i}>
                                    <TableCell className="font-mono tabular-nums text-muted-foreground whitespace-nowrap">{new Date(block.time).toLocaleString()}</TableCell>
                                    <TableCell className="font-mono">
                                        <a href={`https://explorer.bitfinitechain.org/${block.txid ? 'tx/' + block.txid : 'block/' + block.height}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                            #{block.height}
                                        </a>
                                    </TableCell>
                                    <TableCell className="text-right font-mono tabular-nums text-foreground whitespace-nowrap">{formatBFX(getBlockReward(block.height))}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="px-5 py-12 text-center text-muted-foreground">
                                    No blocks mined by this worker yet.
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
        </div>
    );
}
