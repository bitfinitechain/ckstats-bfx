"use client";

import { use, useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { hashrateSuffix, abbreviateNumber, diffToNowDHM, formatHashrate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { CardTitleRow } from '@/components/CardTitleRow';
import StatTile, { Metric } from '@/components/StatTile';
import PageHeading from '@/components/PageHeading';
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

const qualifier = (t: string) => (
    <span className="text-sm font-normal font-sans text-muted-foreground ml-2">{t}</span>
);

export default function WorkerPage({ params }: { params: Promise<{ address: string }> }) {
    const { address } = use(params);
    const decodedAddress = decodeURIComponent(address);

    const { stats, isConnected } = useSocket();
    const [worker, setWorker] = useState<any>(null);

    useEffect(() => {
        if (stats && stats.users) {
            const match = stats.users.find((u: any) => u.address === decodedAddress)
                || stats.users.find((u: any) => u.address.replace('bfx:', '') === decodedAddress);
            setWorker(match);
        }
    }, [stats, decodedAddress]);

    if (!isConnected && !worker) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
                <MisoLoader size={96} />
                <span>Connecting to server...</span>
            </div>
        );
    }

    if (!worker) {
        if (stats) {
            return (
                <div>
                    <Link href="/workers" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Workers
                    </Link>
                    <Card className="p-8 text-center">
                        <h2 className="text-xl font-bold mb-2 text-foreground">Worker Not Found</h2>
                        <p className="text-muted-foreground break-all">The worker {decodedAddress} is currently offline or does not exist.</p>
                    </Card>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
                <MisoLoader size={96} />
                <span>Loading stats...</span>
            </div>
        );
    }

    return (
        <div>
            <Link href="/workers" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workers
            </Link>

            <PageHeading
                sub="Miner address statistics"
                action={
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span className="w-2 h-2 rounded-full bg-success" />
                        Online
                    </span>
                }
            >
                <span className="font-mono">{worker.address}</span>
            </PageHeading>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-8">
                {/* Hashrate */}
                <StatTile label="Hashrate" icon={<Activity size={16} />} value={<>{hashrateSuffix(worker.hashrate5m)}{qualifier('5m Avg')}</>}>
                    {worker.history?.hashrate?.length > 1 && (
                        <div className="mt-4">
                            <div className="h-10"><MiniChart data={worker.history.hashrate} type="line" color="var(--primary)" height={40} /></div>
                            <p className="text-[10px] text-muted-foreground text-right mt-1">Hashrate Trend</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-y-3 pt-3 border-t border-border/70 mt-4">
                        <Metric label="1 Minute" value={hashrateSuffix(worker.hashrate1m)} />
                        <Metric label="1 Hour" value={hashrateSuffix(worker.hashrate1hr)} />
                        <Metric label="1 Day" value={hashrateSuffix(worker.hashrate1d || 0)} />
                        <Metric label="1 Week" value={hashrateSuffix(worker.hashrate7d || 0)} />
                    </div>
                </StatTile>

                {/* Shares */}
                <StatTile label="Shares" icon={<CheckCircle size={16} />} value={<>{abbreviateNumber(worker.shares || 0)}{qualifier('Accepted')}</>}>
                    {worker.history?.shares?.length > 0 && (
                        <div className="mt-4">
                            <div className="h-10"><MiniChart data={worker.history.shares} type="bar" color="var(--primary)" height={40} /></div>
                            <p className="text-[10px] text-muted-foreground text-right mt-1">Shares Trend</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-y-4 pt-3 border-t border-border/70 mt-4">
                        <Metric label="Best Share" value={abbreviateNumber(worker.bestshare || 0)} />
                        <Metric label="Best Ever" value={abbreviateNumber(worker.bestever || 0)} />
                        <div className="col-span-2">
                            <Metric label="Last Share" value={diffToNowDHM(worker.lastshare || Date.now() / 1000)} />
                        </div>
                    </div>
                </StatTile>

                {/* Accumulated Coins */}
                <StatTile
                    label="Accumulated Coins"
                    icon={<Activity size={16} />}
                    value={<>{((worker.balance?.confirmed || 0) / 100000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{qualifier('BFX')}</>}
                >
                    {worker.history?.balance?.length > 1 && (
                        <div className="mt-4">
                            <div className="h-10"><MiniChart data={worker.history.balance} type="line" color="var(--primary)" height={40} /></div>
                            <p className="text-[10px] text-muted-foreground text-right mt-1">Balance Growth</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-y-4 pt-3 border-t border-border/70 mt-4">
                        <Metric label="Unconfirmed" value={((worker.balance?.unconfirmed || 0) / 100000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} />
                    </div>
                </StatTile>

                {/* Details */}
                <StatTile label="Details" icon={<Cpu size={16} />} value={<>{worker.workers}{qualifier('Active Units')}</>}>
                    {worker.history?.workers?.length > 1 && (
                        <div className="mt-4">
                            <div className="h-10"><MiniChart data={worker.history.workers} type="line" color="var(--primary)" height={40} /></div>
                            <p className="text-[10px] text-muted-foreground text-right mt-1">Activity Trend</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-y-4 pt-3 border-t border-border/70 mt-4">
                        <div className="col-span-2">
                            <Metric label="Authorised" value={diffToNowDHM(worker.authorised || Date.now() / 1000)} />
                        </div>
                    </div>
                </StatTile>
            </div>

            {/* Worker breakdown */}
            <Card>
                <CardTitleRow title="Workers" />
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Worker ID</TableHead>
                            <TableHead className="text-right">Hashrate (5m)</TableHead>
                            <TableHead className="text-right">Shares</TableHead>
                            <TableHead className="text-right">Last Share</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {worker.workerDetails && worker.workerDetails.length > 0 ? (
                            worker.workerDetails.map((w: any) => {
                                const shortName = w.workername.split('.').slice(1).join('.') || 'Default';
                                const encodedWorker = encodeURIComponent(w.workername);
                                return (
                                    <TableRow key={w.workername}>
                                        <TableCell className="font-mono">
                                            <Link href={`/workers/${address}/${encodedWorker}`} className="flex items-center gap-2 text-primary hover:underline">
                                                {shortName}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">{formatHashrate(w.hashrate5m)} <span className="text-xs font-normal text-muted-foreground">H/s</span></TableCell>
                                        <TableCell className="text-right font-mono tabular-nums">{abbreviateNumber(w.shares || 0)}</TableCell>
                                        <TableCell className="text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">{diffToNowDHM(w.lastshare || Date.now() / 1000)}</TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                                    No individual worker stats available.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
