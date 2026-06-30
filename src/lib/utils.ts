import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function parseHashrate(hashrateStr: string): bigint {
    if (!hashrateStr) return BigInt(0);

    const units: { [key: string]: number } = {
        'K': 1_000,
        'M': 1_000_000,
        'G': 1_000_000_000,
        'T': 1_000_000_000_000,
        'P': 1_000_000_000_000_000,
    };

    const regex = /^([\d\.]+)([KMGTP]?)$/;
    const match = hashrateStr.match(regex);

    if (!match) return BigInt(0);

    const value = parseFloat(match[1]);
    const unit = match[2];
    const multiplier = units[unit] || 1;

    return BigInt(Math.floor(value * multiplier));
}

export function formatHashrate(hashrate: bigint | string | number): string {
    let n = Number(hashrate);
    if (isNaN(n) && typeof hashrate === 'string') {
        n = Number(parseHashrate(hashrate));
    }

    if (n >= 1e15) return (n / 1e15).toFixed(2) + 'P';
    if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'G';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toString();
}

export function hashrateSuffix(hashrate: bigint | string | number): string {
    let n = Number(hashrate);
    if (isNaN(n) && typeof hashrate === 'string') {
        n = Number(parseHashrate(hashrate));
    }

    if (n >= 1e15) return (n / 1e15).toFixed(2) + ' PH/s';
    if (n >= 1e12) return (n / 1e12).toFixed(2) + ' TH/s';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + ' GH/s';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + ' MH/s';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + ' kH/s';
    return n.toString() + ' H/s';
}

export function abbreviateNumber(input: number | string): string {
    const num = Number(input);
    if (isNaN(num)) return '0';

    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k';
    return num.toLocaleString();
}

export function obfuscateAddress(address: string): string {
    if (!address || address.length < 10) return address;
    // Show "bfx:" + 6 chars first, and 6 chars last
    return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

export function secondsToDHM(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    return parts.join(' ') || '0m';
}

export function diffToNowDHM(timestamp: number): string {
    const diff = Math.floor(Date.now() / 1000) - timestamp;
    if (diff < 60) return 'Just now';
    return secondsToDHM(diff) + ' ago';
}
