import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { redis } from './redis';
import { parseHashrate } from './utils';
import { electrum, isValidAddress } from './electrum';

const prisma = new PrismaClient();

// Two ckpool sources feed the dashboard's Solo / Pool tabs:
//  - SOLO: seed-1's ckpool running in -B (solo) mode.
//  - POOL: seed-3's ckpool running in shared/pool mode.
// Each source is just a ckpool logs directory containing users/, pool/pool.status
// and ckpool.log. POOL_CKPOOL_LOGS_DIR is optional — if unset (or missing on disk)
// the Pool tab renders a "coming online" state instead of zeros.
const SOLO_LOGS_DIR = process.env.CKPOOL_LOGS_DIR || path.join(process.cwd(), '..', 'ckpool-bitfinite', 'release', 'logs');
const POOL_LOGS_DIR = process.env.POOL_CKPOOL_LOGS_DIR || '';
// High-diff solo instance (seed-1 port 3334, large/rented rigs). Optional — surfaced
// as its own "High-Diff" tab, kept separate from organic small-miner solo (3333).
const RENTAL_LOGS_DIR = process.env.RENTAL_CKPOOL_LOGS_DIR || '';

// ckpool keeps a per-user state file that survives across restarts AND across the
// chain re-anchor, so miners from the previous (old-genesis) chain linger as "active
// workers". Exclude any miner whose last share predates the relaunch; a returning
// miner reappears automatically on their next share. Default cutoff = mainnet genesis
// nTime (the re-anchor); override with POOL_STATS_SINCE (epoch seconds) if it changes.
const POOL_ACTIVE_SINCE = Number(process.env.POOL_STATS_SINCE || 1782691200);
// Optional rolling "active" window (seconds): also drop miners idle longer than this.
// 0 = disabled (show every post-re-anchor miner regardless of idle time). e.g. 1800 = 30 min.
const POOL_ACTIVE_WINDOW_SEC = Number(process.env.POOL_ACTIVE_WINDOW_SEC || 0);

// --- Shared cross-cutting state (chain-wide, not per source) ---
// Cache for balances to avoid spamming Electrum
const balanceCache = new Map<string, { balance: any, timestamp: number }>();
// Global Round-Robin index for cycling through users one by one
let nextUserIndex = 0;
const pendingBalanceFetches = new Set<string>();
const txidCache = new Map<number, string>();
// Global busy flag for Electrum to enforce strict serial execution
let electrumBusy = false;

const POLLING_INTERVAL_MS = 2000; // 2 seconds

type SourceHistory = { workers: number[], shares: number[], hashrate: number[], networkHashrate: number[] };
type UserHistory = Map<string, { workers: number[], shares: number[], hashrate: number[], balance: number[] }>;
type WorkerHistory = Map<string, { hashrate: number[], shares: number[] }>;

// Per-source in-memory history (reset on restart). Keyed by source ('solo' | 'pool').
const sourceHistory: Record<string, SourceHistory> = {};
const sourceUserHistory: Record<string, UserHistory> = {};
const sourceWorkerHistory: Record<string, WorkerHistory> = {};

function histFor(key: string): SourceHistory {
    return (sourceHistory[key] ??= { workers: [], shares: [], hashrate: [], networkHashrate: [] });
}
function userHistFor(key: string): UserHistory {
    return (sourceUserHistory[key] ??= new Map());
}
function workerHistFor(key: string): WorkerHistory {
    return (sourceWorkerHistory[key] ??= new Map());
}

export async function startPoller(io: Server) {
    console.log(`Starting Poller — solo: ${SOLO_LOGS_DIR}${POOL_LOGS_DIR ? `, pool: ${POOL_LOGS_DIR}` : ' (pool source not configured)'}`);

    // Ensure Electrum connection
    try {
        await electrum.connect();
    } catch (e) {
        console.error("Initial Electrum connection failed (will retry):", e);
    }

    // Use setInterval to ensure robust scheduling
    setInterval(async () => {
        try {
            await poll(io);
        } catch (e) {
            console.error("Poll error:", e);
        }
    }, POLLING_INTERVAL_MS);
}

async function poll(io: Server) {
    if (!electrum.isConnected) {
        electrum.connect().catch(e => console.error("Electrum reconnect failed:", e));
    }

    // --- Balance round-robin (shared, 1 address per tick across both sources) ---
    refreshOneBalance();

    // --- Chain-wide network stats (difficulty + est. network hashrate), same for both sources ---
    const network = await getNetworkStats();

    // --- Per-source collection ---
    const solo = collectSource(SOLO_LOGS_DIR, 'solo', network);
    // Only surface the Pool payload once there's real activity (a miner or a
    // solved block); otherwise emit null so the UI shows a stable "coming online"
    // state instead of flickering empty zero-tiles as the synced logs dir appears
    // and disappears. collectSource tolerates a missing dir (returns zeros).
    let pool = null;
    if (POOL_LOGS_DIR) {
        const p = collectSource(POOL_LOGS_DIR, 'pool', network);
        if (p.global.users > 0 || p.blocks.length > 0) pool = p;
    }
    // High-diff (3334) — same gating as pool: null until there's real activity, so
    // the tab shows "off" when no large/rented rig is connected.
    let rental = null;
    if (RENTAL_LOGS_DIR) {
        const r = collectSource(RENTAL_LOGS_DIR, 'rental', network);
        if (r.global.users > 0 || r.blocks.length > 0) rental = r;
    }

    console.log(`Emitting stats — solo: ${solo.global.users} users / ${solo.blocks.length} blocks` +
        (pool ? `, pool: ${pool.global.users} users / ${pool.blocks.length} blocks` : ', pool: n/a') +
        (rental ? `, highdiff: ${rental.global.users} users / ${rental.blocks.length} blocks` : ', highdiff: n/a'));

    io.emit('stats', solo);          // solo payload (unchanged shape — other pages rely on it)
    io.emit('poolStats', pool);      // pool payload, or null when not configured / no data yet
    io.emit('rentalStats', rental);  // high-diff (3334) payload, or null when idle / not configured

    try {
        await redis.set('latest_stats', JSON.stringify(solo));
        await redis.set('latest_pool_stats', JSON.stringify(pool));
        await redis.set('latest_rental_stats', JSON.stringify(rental));
    } catch (e) {
        console.error("Redis save failed:", e);
    }
}

// Collect a full stats payload for ONE ckpool source (a logs directory).
function collectSource(logsDir: string, key: string, network: { difficulty: number, networkHashrate: number }) {
    const usersDir = path.join(logsDir, 'users');

    const globalStats = {
        workers: 0,
        hashrate1m: BigInt(0),
        hashrate5m: BigInt(0),
        hashrate1hr: BigInt(0),
        hashrate1d: BigInt(0),
        hashrate7d: BigInt(0),
        users: 0,
        accepted: 0,
        rejected: 0,
        bestshare: 0,
        runtime: 0,
        networkHashrate: network.networkHashrate,
        difficulty: network.difficulty,
        luck: 0,
    };

    const usersData: any[] = [];
    const uHistMap = userHistFor(key);
    const wHistMap = workerHistFor(key);

    const files = fs.existsSync(usersDir)
        ? fs.readdirSync(usersDir).filter(f => f.startsWith('bfx:') || f.includes(':'))
        : [];

    for (const file of files) {
        const filePath = path.join(usersDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            const address = file;

            if (!isValidAddress(address)) continue;

            // Skip miners from the previous (pre-re-anchor) chain so they don't show as
            // active or inflate the counts. Returning miners reappear on their next share.
            const lastShare = Number(data.lastshare || 0);
            if (POOL_ACTIVE_SINCE > 0 && lastShare > 0 && lastShare < POOL_ACTIVE_SINCE) continue;
            if (POOL_ACTIVE_WINDOW_SEC > 0 && lastShare > 0 && (Date.now() / 1000 - lastShare) > POOL_ACTIVE_WINDOW_SEC) continue;

            globalStats.users++;
            globalStats.workers += data.workers || 0;
            globalStats.hashrate1m += parseHashrate(data.hashrate1m);
            globalStats.hashrate5m += parseHashrate(data.hashrate5m);
            globalStats.hashrate1hr += parseHashrate(data.hashrate1hr);
            globalStats.hashrate1d += parseHashrate(data.hashrate1d);
            globalStats.hashrate7d += parseHashrate(data.hashrate7d);
            globalStats.accepted += (data.shares || 0);
            globalStats.rejected += (data.rejected || 0);
            globalStats.bestshare = Math.max(globalStats.bestshare, (data.bestshare || 0));

            let balance = { confirmed: 0, unconfirmed: 0 };
            const cached = balanceCache.get(address);
            if (cached) balance = cached.balance;

            if (!uHistMap.has(address)) {
                uHistMap.set(address, { workers: [], shares: [], hashrate: [], balance: [] });
            }
            const uHist = uHistMap.get(address)!;

            const hrVal = Number(parseHashrate(data.hashrate5m || "0"));
            const balVal = balance ? (balance.confirmed || 0) : 0;

            uHist.workers.push(data.workers || 0);
            uHist.shares.push(data.shares || 0);
            uHist.hashrate.push(hrVal);
            uHist.balance.push(balVal);

            if (uHist.workers.length > 50) uHist.workers.shift();
            if (uHist.shares.length > 50) uHist.shares.shift();
            if (uHist.hashrate.length > 50) uHist.hashrate.shift();
            if (uHist.balance.length > 50) uHist.balance.shift();

            // Track individual worker history
            if (data.worker && Array.isArray(data.worker)) {
                for (const w of data.worker) {
                    const workerKey = `${address}:${w.workername}`;
                    if (!wHistMap.has(workerKey)) {
                        wHistMap.set(workerKey, { hashrate: [], shares: [] });
                    }
                    const wHist = wHistMap.get(workerKey)!;

                    const wHashrate = Number(parseHashrate(w.hashrate5m || "0"));
                    const wShares = w.shares || 0;

                    wHist.hashrate.push(wHashrate);
                    wHist.shares.push(wShares);

                    if (wHist.hashrate.length > 50) wHist.hashrate.shift();
                    if (wHist.shares.length > 50) wHist.shares.shift();

                    w.history = { hashrate: wHist.hashrate, shares: wHist.shares };
                }
            }

            usersData.push({
                address,
                ...data,
                workerDetails: data.worker || [],
                balance,
                history: {
                    hashrate: uHist.hashrate,
                    shares: uHist.shares,
                    workers: uHist.workers,
                    balance: uHist.balance.map(val => val / 100000000)
                }
            });
        } catch (e) { }
    }

    // --- Solved blocks from this source's ckpool.log ---
    const blocks = readBlocks(path.join(logsDir, 'ckpool.log'));

    // --- Runtime (uptime) from this source's pool.status ---
    const poolStatusFile = path.join(logsDir, 'pool', 'pool.status');
    if (fs.existsSync(poolStatusFile)) {
        try {
            const lines = fs.readFileSync(poolStatusFile, 'utf-8').split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const d = JSON.parse(line);
                    if (typeof d.runtime === 'number') globalStats.runtime = d.runtime;
                } catch (e) { }
            }
        } catch (e) {
            console.error(`Error reading pool.status for ${key}:`, e);
        }
    }

    // --- Pool luck (24h) — this source's hashrate vs the chain difficulty ---
    if (globalStats.hashrate1d > 0 && network.difficulty > 0) {
        const expected24h = (Number(globalStats.hashrate1d) * 86400) / (network.difficulty * Math.pow(2, 32));
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const actual24h = blocks.filter(b => b.time > oneDayAgo).length;
        if (expected24h > 0) globalStats.luck = (actual24h / expected24h) * 100;
    }

    // --- Rolling in-memory history for this source's sparklines ---
    const hist = histFor(key);
    hist.workers.push(globalStats.workers);
    hist.shares.push(globalStats.accepted);
    hist.hashrate.push(Number(globalStats.hashrate5m));
    hist.networkHashrate.push(globalStats.networkHashrate);
    if (hist.workers.length > 50) hist.workers.shift();
    if (hist.shares.length > 50) hist.shares.shift();
    if (hist.hashrate.length > 50) hist.hashrate.shift();
    if (hist.networkHashrate.length > 50) hist.networkHashrate.shift();

    return {
        global: {
            users: globalStats.users,
            workers: globalStats.workers,
            hashrate1m: globalStats.hashrate1m.toString(),
            hashrate5m: globalStats.hashrate5m.toString(),
            hashrate1hr: globalStats.hashrate1hr.toString(),
            hashrate1d: globalStats.hashrate1d.toString(),
            accepted: globalStats.accepted,
            rejected: globalStats.rejected,
            bestshare: globalStats.bestshare,
            runtime: globalStats.runtime,
            difficulty: globalStats.difficulty,
            networkHashrate: globalStats.networkHashrate,
            luck: globalStats.luck,
        },
        users: usersData.map(u => ({
            address: u.address,
            hashrate5m: u.hashrate5m,
            hashrate1m: u.hashrate1m,
            hashrate1hr: u.hashrate1hr,
            hashrate1d: u.hashrate1d,
            hashrate7d: u.hashrate7d,
            workers: u.workers,
            shares: u.shares,
            bestshare: u.bestshare,
            bestever: u.bestever,
            lastshare: u.lastshare,
            authorised: u.authorised,
            balance: u.balance,
            workerDetails: u.workerDetails,
            history: u.history,
        })),
        blocks,
        history: hist,
    };
}

// Read solved blocks (last ~24h) from a ckpool.log, newest first, resolving txids via cache.
function readBlocks(ckpoolLog: string): any[] {
    if (!fs.existsSync(ckpoolLog)) return [];
    try {
        const size = fs.statSync(ckpoolLog).size;
        const bufferSize = 5 * 1024 * 1024; // 5MB covers >24h at 5m blocks
        const start = Math.max(0, size - bufferSize);
        const buffer = Buffer.alloc(size - start);
        const fd = fs.openSync(ckpoolLog, 'r');
        fs.readSync(fd, buffer, 0, buffer.length, start);
        fs.closeSync(fd);

        const solvedRegex = /^\[(.*?)\] Solved and confirmed block (\d+) by (.*)$/;
        const blocks = buffer.toString('utf-8').split('\n')
            .map(line => line.match(solvedRegex))
            .filter(match => match !== null)
            .map(match => {
                const fullSolver = match![3];
                return {
                    timestamp: match![1],
                    height: parseInt(match![2]),
                    solver: fullSolver.split('.')[0],
                    worker: fullSolver,
                    time: new Date(match![1]).getTime(),
                    txid: undefined as string | undefined,
                };
            })
            .reverse()
            .slice(0, 2000);

        fetchMissingTxids(blocks);
        for (const block of blocks) block.txid = txidCache.get(block.height);
        return blocks;
    } catch (e) {
        console.error("Error reading ckpool log:", e);
        return [];
    }
}

// Compute chain-wide network stats from the latest Electrum header. Same for all sources.
async function getNetworkStats(): Promise<{ difficulty: number, networkHashrate: number }> {
    try {
        const header = await electrum.getLatestHeader();
        // blockchain.headers.subscribe returns the 80-byte header hex; nBits is a 4-byte
        // field at byte offset 72 (hex offset 144), little-endian.
        let bits: number | undefined;
        if (header && typeof header.bits === 'number') {
            bits = header.bits;
        } else if (header?.hex && header.hex.length >= 152) {
            const le = header.hex.substr(144, 8);
            bits = parseInt(le.match(/../g)!.reverse().join(''), 16);
        }
        if (bits) {
            const exponent = bits >> 24;
            const coefficient = bits & 0x007fffff;
            const shift = 8 * (0x1d - exponent);
            const difficulty = (0x00ffff / coefficient) * Math.pow(2, shift);
            // BitFinite targets 5-minute (300s) blocks.
            const networkHashrate = (difficulty * Math.pow(2, 32)) / 300;
            return { difficulty, networkHashrate };
        }
    } catch (e) {
        // network stats are best-effort
    }
    return { difficulty: 0, networkHashrate: 0 };
}

// Refresh one address's balance per tick (round-robin across BOTH sources' users),
// serialized behind the Electrum busy lock.
function refreshOneBalance() {
    const dirs = [path.join(SOLO_LOGS_DIR, 'users')];
    if (POOL_LOGS_DIR) dirs.push(path.join(POOL_LOGS_DIR, 'users'));
    if (RENTAL_LOGS_DIR) dirs.push(path.join(RENTAL_LOGS_DIR, 'users'));

    const files: string[] = [];
    for (const d of dirs) {
        if (!fs.existsSync(d)) continue;
        for (const f of fs.readdirSync(d)) {
            if ((f.startsWith('bfx:') || f.includes(':')) && !files.includes(f)) files.push(f);
        }
    }
    if (files.length === 0) return;

    const targetAddress = files[nextUserIndex % files.length];
    nextUserIndex = (nextUserIndex + 1) % files.length;
    if (!isValidAddress(targetAddress)) return;

    const now = Date.now();
    const cached = balanceCache.get(targetAddress);
    const isStale = !cached || (now - cached.timestamp > 60000);
    if (!isStale || pendingBalanceFetches.has(targetAddress) || electrumBusy) return;

    electrumBusy = true; // ACQUIRE LOCK
    pendingBalanceFetches.add(targetAddress);
    electrum.getBalance(targetAddress)
        .then(bal => {
            if (bal) balanceCache.set(targetAddress, { balance: bal, timestamp: Date.now() });
        })
        .catch(e => {
            balanceCache.set(targetAddress, {
                balance: cached ? cached.balance : { confirmed: 0, unconfirmed: 0 },
                timestamp: Date.now(),
            });
        })
        .finally(() => {
            pendingBalanceFetches.delete(targetAddress);
            electrumBusy = false; // RELEASE LOCK
        });
}

const pendingFetches = new Set<string>();
const failedTxidLookups = new Set<number>();
const solverHistoryCache = new Map<string, { history: any[], timestamp: number }>();

async function fetchMissingTxids(blocks: any[]) {
    const missing = blocks.filter(b =>
        !txidCache.has(b.height) &&
        !pendingFetches.has(b.height.toString()) &&
        !failedTxidLookups.has(b.height)
    );

    if (missing.length === 0) return;
    if (electrumBusy) return;

    const solvers = new Set(missing.map(b => b.solver));
    const batchSolvers = Array.from(solvers).slice(0, 2);

    electrumBusy = true;
    try {
        for (const solver of batchSolvers) {
            let history: any[] = [];
            const cached = solverHistoryCache.get(solver);
            const now = Date.now();

            if (cached && (now - cached.timestamp < 10000)) {
                history = cached.history;
            } else {
                try {
                    if (isValidAddress(solver)) {
                        history = await electrum.getHistory(solver);
                        solverHistoryCache.set(solver, { history, timestamp: now });
                    }
                } catch (e) {
                    console.warn(`Failed to fetch history for solver ${solver}`);
                    continue;
                }
            }

            const heightMap = new Map<number, string>();
            for (const item of history) heightMap.set(item.height, item.tx_hash);

            const solverBlocks = missing.filter(b => b.solver === solver);
            for (const block of solverBlocks) {
                const txid = heightMap.get(block.height);
                if (txid) txidCache.set(block.height, txid);
            }
        }
    } finally {
        electrumBusy = false;
    }
}
