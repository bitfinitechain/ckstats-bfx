import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { redis } from './redis';
import { parseHashrate } from './utils';
import { electrum, isValidAddress } from './electrum';

const prisma = new PrismaClient();
const LOGS_DIR = process.env.CKPOOL_LOGS_DIR || path.join(process.cwd(), '..', 'ckpool-bitfinite', 'release', 'logs');
const USERS_DIR = path.join(LOGS_DIR, 'users');

// Cache for balances to avoid spamming Electrum
const balanceCache = new Map<string, { balance: any, timestamp: number }>();
// Global Round-Robin index for cycling through users one by one
let nextUserIndex = 0;
const pendingBalanceFetches = new Set<string>();
const txidCache = new Map<number, string>();

// Global busy flag for Electrum to enforce strict serial execution
let electrumBusy = false;

const POLLING_INTERVAL_MS = 2000; // 2 seconds

// In-memory history (reset on restart)
const history: { workers: number[], shares: number[], hashrate: number[], networkHashrate: number[] } = {
    workers: [],
    shares: [],
    hashrate: [],
    networkHashrate: []
};
const userHistory = new Map<string, { workers: number[], shares: number[], hashrate: number[], balance: number[] }>();
const workerHistory = new Map<string, { hashrate: number[], shares: number[] }>();

export async function startPoller(io: Server) {
    console.log(`Starting Poller watching ${USERS_DIR}`);

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

// Separate function for the cycle logic
async function poll(io: Server) {
    if (!fs.existsSync(USERS_DIR)) {
        console.warn("Users dir missing!");
        return;
    }

    const files = fs.readdirSync(USERS_DIR).filter(f => f.startsWith('bfx:') || f.includes(':'));

    // --- Round-Robin Balance Fetcher (1 user per tick) ---
    if (files.length > 0) {
        const targetFile = files[nextUserIndex % files.length];
        nextUserIndex = (nextUserIndex + 1) % files.length;
        const targetAddress = targetFile;

        if (isValidAddress(targetAddress)) {
            const now = Date.now();
            const cached = balanceCache.get(targetAddress);
            const isStale = !cached || (now - cached.timestamp > 60000);

            // Fetch only if stale, not pending, and Electrum is NOT busy
            if (isStale && !pendingBalanceFetches.has(targetAddress) && !electrumBusy) {
                electrumBusy = true; // ACQUIRE LOCK
                pendingBalanceFetches.add(targetAddress);

                electrum.getBalance(targetAddress)
                    .then(bal => {
                        if (bal) {
                            console.log(`Updated balance for ${targetAddress}`);
                            balanceCache.set(targetAddress, { balance: bal, timestamp: Date.now() });
                        }
                    })
                    .catch(e => {
                        console.warn(`Balance check skipped for ${targetAddress} (slow response):`, e.message);
                        balanceCache.set(targetAddress, {
                            balance: cached ? cached.balance : { confirmed: 0, unconfirmed: 0 },
                            timestamp: Date.now()
                        });
                    })
                    .finally(() => {
                        pendingBalanceFetches.delete(targetAddress);
                        electrumBusy = false; // RELEASE LOCK
                    });
            }
        }
    }

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
        networkHashrate: 0,
        difficulty: 0,
        luck: 0,
    };

    const usersData = [];

    if (!electrum.isConnected) {
        electrum.connect().catch(e => console.error("Electrum reconnect failed:", e));
    }

    for (const file of files) {
        const filePath = path.join(USERS_DIR, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            const address = file;

            if (!isValidAddress(address)) continue;

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

            if (!userHistory.has(address)) {
                userHistory.set(address, { workers: [], shares: [], hashrate: [], balance: [] });
            }
            const uHist = userHistory.get(address)!;

            // DEBUG: Inspect data keys once
            if (address.includes('fzsag') && Math.random() < 0.05) {
                console.log(`[Poller] Debug User Data for ${address}:`, JSON.stringify(data, null, 2).slice(0, 200));
            }

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
                    if (!workerHistory.has(workerKey)) {
                        workerHistory.set(workerKey, { hashrate: [], shares: [] });
                    }
                    const wHist = workerHistory.get(workerKey)!;

                    const wHashrate = Number(parseHashrate(w.hashrate5m || "0"));
                    const wShares = w.shares || 0;

                    wHist.hashrate.push(wHashrate);
                    wHist.shares.push(wShares);

                    if (wHist.hashrate.length > 50) wHist.hashrate.shift();
                    if (wHist.shares.length > 50) wHist.shares.shift();

                    // Attach history to the worker object so it gets sent to frontend
                    w.history = {
                        hashrate: wHist.hashrate,
                        shares: wHist.shares
                    };
                }
            }

            usersData.push({
                address,
                ...data, // This likely contains 'workers' (int) and 'worker' (array), but maybe 'worker' is being lost?
                workerDetails: data.worker || [], // Renamed explicitly to avoid confusion
                balance,
                history: {
                    hashrate: uHist.hashrate,
                    shares: uHist.shares,
                    workers: uHist.workers,
                    balance: uHist.balance.map(val => val / 100000000)
                }
            });
            if (address.includes('fzsag')) {
                console.log(`[Poller] Validating user ${address}: Workers found: ${data.worker?.length || 0}`);
            }
        } catch (e) { }
    }

    const ROOT_LOGS_DIR = path.dirname(USERS_DIR);
    const CKPOOL_LOG = path.join(ROOT_LOGS_DIR, 'ckpool.log');

    let blocks: any[] = [];
    if (fs.existsSync(CKPOOL_LOG)) {
        try {
            // Read only last 1MB efficiently
            const stats = fs.statSync(CKPOOL_LOG);
            const size = stats.size;
            const bufferSize = 5 * 1024 * 1024; // 5MB to ensure we cover 24h
            const start = Math.max(0, size - bufferSize);
            const buffer = Buffer.alloc(size - start);
            const fd = fs.openSync(CKPOOL_LOG, 'r');
            fs.readSync(fd, buffer, 0, buffer.length, start);
            fs.closeSync(fd);
            const content = buffer.toString('utf-8');

            const lines = content.split('\n');
            const solvedRegex = /^\[(.*?)\] Solved and confirmed block (\d+) by (.*)$/;

            blocks = lines
                .map(line => line.match(solvedRegex))
                .filter(match => match !== null)
                .map(match => {
                    const fullSolver = match![3];
                    const solverAddress = fullSolver.split('.')[0];
                    return {
                        timestamp: match![1],
                        height: parseInt(match![2]),
                        solver: solverAddress,
                        worker: fullSolver, // Store full name like 'bfx:...node-2'
                        time: new Date(match![1]).getTime()
                    };
                })
                .reverse()
                .slice(0, 2000); // Keep enough for 24h stats (at 1m blocks = 1440/day)

            fetchMissingTxids(blocks);

            for (const block of blocks) {
                block.txid = txidCache.get(block.height);
            }
        } catch (e) {
            console.error("Error reading ckpool log:", e);
        }
    }

    const POOL_STATUS_FILE = path.join(LOGS_DIR, 'pool', 'pool.status');
    if (fs.existsSync(POOL_STATUS_FILE)) {
        try {
            const content = fs.readFileSync(POOL_STATUS_FILE, 'utf-8');
            const lines = content.split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const data = JSON.parse(line);
                    if (typeof data.runtime === 'number') {
                        globalStats.runtime = data.runtime;
                    }
                } catch (e) { }
            }
        } catch (e) {
            console.error("Error reading pool.status:", e);
        }
    }

    // --- Network Stats (Difficulty/Hashrate) ---
    try {
        const header = await electrum.getLatestHeader();
        if (header && typeof header.bits === 'number') {
            const bits = header.bits;
            // Decode bits (compact format)
            const exponent = bits >> 24;
            const coefficient = bits & 0x007fffff;

            // Target = coefficient * 2^(8*(exponent-3))
            // Difficulty = MaxTarget / Target.
            // Simplified approximation: Diff = (0xffff * 2^208) / Target
            // Or more practical: Diff = (0x1d00ffff target) / current_target
            // Standard Bitcoin diff 1 is 0x1d00ffff (bits) -> 0x00ffff * 256^(0x1d-3)
            // Diff = (0x00ffff * 256^(29-3)) / (coefficient * 256^(exponent-3))
            // Diff = (0xffff * 256^26) / (coefficient * 256^(exponent-3))

            // Let's use floating point approximation
            const shift = 8 * (0x1d - exponent);
            const diff = (0x00ffff / coefficient) * Math.pow(2, shift);

            globalStats.difficulty = diff;
            // Network Hashrate = Difficulty * 2^32 / TargetTime
            // Assuming 60 seconds target time for BitFinite
            globalStats.networkHashrate = (diff * Math.pow(2, 32)) / 60;

            // console.log(`Network Diff: ${diff}, Hashrate: ${globalStats.networkHashrate}`);
        }
    } catch (e) {
        // console.error("Failed to fetch network stats:", e);
    }

    // --- Pool Luck Calculation (24h) ---
    const diff = globalStats.difficulty;
    if (globalStats.hashrate1d > 0 && diff > 0) {
        const poolHashrate24h = Number(globalStats.hashrate1d);
        const expected24h = (poolHashrate24h * 86400) / (diff * Math.pow(2, 32));

        // Count actual blocks in last 24h
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        const actual24h = blocks.filter(b => b.time > oneDayAgo).length;

        if (expected24h > 0) {
            globalStats.luck = (actual24h / expected24h) * 100;
        }
    }

    history.workers.push(globalStats.workers);
    history.shares.push(globalStats.accepted);
    history.hashrate.push(Number(globalStats.hashrate5m));
    history.networkHashrate.push(globalStats.networkHashrate);

    if (history.workers.length > 50) history.workers.shift();
    if (history.shares.length > 50) history.shares.shift();
    if (history.hashrate.length > 50) history.hashrate.shift();
    if (history.networkHashrate.length > 50) history.networkHashrate.shift();

    const broadcastData = {
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
        history
    };

    console.log(`Emitting stats with ${globalStats.users} users and ${blocks.length} blocks`);
    io.emit('stats', broadcastData);

    // console.log("Saving to Redis...");
    try {
        await redis.set('latest_stats', JSON.stringify(broadcastData));
        // console.log("Redis saved.");
    } catch (e) {
        console.error("Redis save failed:", e);
    }
}

const pendingFetches = new Set<string>();
const failedTxidLookups = new Set<number>(); // persistent failure cache

// Cache for solver histories to avoid re-fetching too often if they mine multiple blocks
const solverHistoryCache = new Map<string, { history: any[], timestamp: number }>();

async function fetchMissingTxids(blocks: any[]) {
    const missing = blocks.filter(b =>
        !txidCache.has(b.height) &&
        !pendingFetches.has(b.height.toString()) &&
        !failedTxidLookups.has(b.height)
    );

    if (missing.length === 0) return;
    if (electrumBusy) return;

    // Group by solver
    const solvers = new Set(missing.map(b => b.solver));
    const batchSolvers = Array.from(solvers).slice(0, 2); // Process max 2 solvers per tick

    electrumBusy = true;
    try {
        for (const solver of batchSolvers) {
            // Check cache first (valid for 10 seconds)
            let history = [];
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
                    // Don't mark blocks as failed yet, retry later
                    continue;
                }
            }

            // Map height -> txid
            const heightMap = new Map<number, string>();
            for (const item of history) {
                heightMap.set(item.height, item.tx_hash);
            }

            // Update blocks for this solver
            const solverBlocks = missing.filter(b => b.solver === solver);
            for (const block of solverBlocks) {
                const txid = heightMap.get(block.height);
                if (txid) {
                    txidCache.set(block.height, txid);
                    console.log(`Found TXID for block ${block.height} via solver history`);
                } else {
                    // If we have full history and stil can't find it, marking as failed is risky 
                    // because maybe the history is just lagging slightly? 
                    // But usually getHistory is up to date.
                    // Let's increment a retry counter or just leave it for now.
                    // If we assume history is authoritative, we could mark failed.
                }
            }
        }
    } finally {
        electrumBusy = false;
    }
}
