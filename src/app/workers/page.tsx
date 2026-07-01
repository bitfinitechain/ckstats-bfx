"use client";

import { useSocket } from "@/hooks/useSocket";
import { formatHashrate, obfuscateAddress } from "@/lib/utils";
import Link from "next/link";
import { WorkerSearch } from "@/components/WorkerSearch";
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

export default function WorkersPage() {
    const { isConnected, stats } = useSocket();

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading worker statistics...</p>
                <div className="text-xs text-muted-foreground">
                    Socket: {isConnected ? "Connected" : "Disconnected"}
                </div>
            </div>
        );
    }

    const { users } = stats;

    return (
        <Card className="mt-8">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    ACTIVE WORKERS
                </CardTitle>
                <div className="flex items-center gap-4">
                    <WorkerSearch />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-primary' : 'bg-destructive'}`}></span>
                        {isConnected ? 'Live' : 'Offline'}
                    </div>
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
                                    <TableCell className="font-bold font-mono text-xs sm:text-sm truncate max-w-[160px] sm:max-w-[300px]" title="Address hidden for privacy">
                                        {obfuscateAddress(u.address)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold font-mono text-xs sm:text-sm">{u.workers}</TableCell>
                                    <TableCell className="text-right font-bold font-mono text-xs sm:text-sm whitespace-nowrap">{formatHashrate(u.hashrate5m)} <span className="text-xs font-normal text-muted-foreground">H/s</span></TableCell>
                                    <TableCell className="hidden sm:table-cell text-right font-bold font-mono text-sm whitespace-nowrap">{u.lastshare ? new Date(u.lastshare * 1000).toLocaleTimeString() : 'N/A'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No active workers found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
