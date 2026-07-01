"use client";

import { useSocket } from "@/hooks/useSocket";
import { formatHashrate, diffToNowDHM, obfuscateAddress } from "@/lib/utils";
import Link from "next/link";
import Tiles from "@/components/Tiles";

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

export default function Dashboard() {
    const { isConnected, stats } = useSocket();

    // Temporary debug view
    if (!stats) {
        /* ... same debug view ... */
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="flex items-center gap-2 text-xl font-bold text-muted-foreground animate-pulse">
                    <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-primary' : 'bg-destructive'}`}></span>
                    <span>{isConnected ? 'Connecting to pool...' : 'Waiting for connection...'}</span>
                </div>
            </div>
        )
    }
    const { global, users } = stats;

    return (
        <div className="space-y-8">
            <Tiles stats={stats} />

            {/* Recent Activity / Users Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                    <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        ACTIVE WORKERS
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-primary' : 'bg-destructive'}`}></span>
                        {isConnected ? 'Live' : 'Connecting...'}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs font-bold font-sans uppercase text-muted-foreground">Address</TableHead>
                                <TableHead className="text-right text-xs font-bold font-sans uppercase text-muted-foreground">Workers</TableHead>
                                <TableHead className="text-right text-xs font-bold font-sans uppercase text-muted-foreground">Hashrate (5m)</TableHead>
                                <TableHead className="hidden sm:table-cell text-right text-xs font-bold font-sans uppercase text-muted-foreground">Last Share</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users && users.length > 0 ? (
                                users.map((u: any) => (
                                    <TableRow key={u.address}>
                                        <TableCell className="font-bold font-mono text-xs sm:text-sm truncate max-w-[160px] sm:max-w-[200px] md:max-w-none" title="Address hidden for privacy">
                                            {obfuscateAddress(u.address)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold font-barlow text-base sm:text-lg">{u.workers}</TableCell>
                                        <TableCell className="text-right font-bold font-barlow text-base sm:text-lg whitespace-nowrap">
                                            {formatHashrate(u.hashrate5m)} <span className="text-sm font-normal text-muted-foreground">H/s</span>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell text-right font-bold font-barlow text-lg whitespace-nowrap">
                                            {diffToNowDHM(u.lastshare)}
                                        </TableCell>
                                    </TableRow>
                                ))) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No active workers</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon, subtext }: { title: string, value: string | number, icon: any, subtext?: string }) {
    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 flex flex-col space-y-1.5 pb-2">
                <div className="flex items-center justify-between font-semibold tracking-tight text-sm">
                    {title}
                    {icon}
                </div>
            </div>
            <div className="p-6 pt-0">
                <div className="text-2xl font-bold">{value}</div>
                {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
            </div>
        </div>
    )
}
