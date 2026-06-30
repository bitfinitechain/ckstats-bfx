import net from 'net';
import tls from 'tls';
import crypto from 'crypto';

// --- CashAddr / Address Logic (Minimal Implementation) ---

// Constants for CashAddr
// Constants for CashAddr
const CHARSET = 'fpzry9x8gq2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0x98f2bc8e61n, 0x79b76d99e2n, 0xf33e5fb3c4n, 0xae2eabe2a8n, 0x1e4f43e470n];

function polymod(values: number[]): bigint {
    let c = 1n;
    for (const d of values) {
        const c0 = c >> 35n;
        c = ((c & 0x07ffffffffn) << 5n) ^ BigInt(d);

        if ((c0 & 0x01n)) c ^= GENERATOR[0];
        if ((c0 & 0x02n)) c ^= GENERATOR[1];
        if ((c0 & 0x04n)) c ^= GENERATOR[2];
        if ((c0 & 0x08n)) c ^= GENERATOR[3];
        if ((c0 & 0x10n)) c ^= GENERATOR[4];
    }
    return c ^ 1n;
}

function expandPrefix(prefix: string): number[] {
    const ret: number[] = [];
    for (let i = 0; i < prefix.length; i++) {
        ret.push(prefix.charCodeAt(i) & 0x1f);
    }
    ret.push(0);
    return ret;
}

function verifyChecksum(prefix: string, payload: number[]): boolean {
    return polymod(expandPrefix(prefix).concat(payload)) === 0n;
}

function decodeBase32(str: string): number[] {
    const ret: number[] = [];
    for (let i = 0; i < str.length; i++) {
        const idx = CHARSET.indexOf(str[i]);
        if (idx === -1) throw new Error('Invalid character: ' + str[i]);
        ret.push(idx);
    }
    return ret;
}

function convertBits(data: number[], from: number, to: number, pad: boolean = true): number[] {
    let acc = 0;
    let bits = 0;
    const ret: number[] = [];
    const maxv = (1 << to) - 1;

    for (const value of data) {
        if (value < 0 || (value >> from) !== 0) throw new Error('Invalid value');
        acc = (acc << from) | value;
        bits += from;
        while (bits >= to) {
            bits -= to;
            ret.push((acc >> bits) & maxv);
        }
    }

    if (pad) {
        if (bits > 0) {
            ret.push((acc << (to - bits)) & maxv);
        }
    } else if (bits >= from || ((acc << (to - bits)) & maxv)) {
        throw new Error('Invalid padding');
    }

    return ret;
}

function decodeCashAddr(address: string): { prefix: string, type: string, hash: Buffer } {
    let prefix = 'bfx'; // Default for BitFinite?
    let payloadStr = address;

    if (address.includes(':')) {
        const parts = address.split(':');
        prefix = parts[0];
        payloadStr = parts[1];
    }

    const payload = decodeBase32(payloadStr.toLowerCase());
    if (!verifyChecksum(prefix, payload)) {
        throw new Error('Invalid checksum');
    }

    // Drop checksum
    const data = payload.slice(0, -8);

    // First byte is version byte: type (bit 3-6) + size (bit 0-2)
    // Actually in base32, we need to convert back to 8-bit first
    const converted = convertBits(data, 5, 8, false);
    const versionByte = converted[0];
    const type = (versionByte >> 3) & 0x0f;
    const hash = Buffer.from(converted.slice(1));

    let typeStr = 'unknown';
    if (type === 0) typeStr = 'P2PKH';
    else if (type === 1) typeStr = 'P2SH';

    return { prefix, type: typeStr, hash };
}

export function addressToScriptHash(address: string): string {
    try {
        const decoded = decodeCashAddr(address);
        // console.log(`Decoded address ${address}: prefix=${decoded.prefix}, type=${decoded.type}, hash=${decoded.hash.toString('hex')}`);

        let scriptPubKey: Buffer;

        if (decoded.type === 'P2PKH') {
            // OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
            // 76 a9 <20 bytes> 88 ac
            scriptPubKey = Buffer.concat([
                Buffer.from('76a914', 'hex'),
                decoded.hash,
                Buffer.from('88ac', 'hex')
            ]);
        } else if (decoded.type === 'P2SH') {
            // OP_HASH160 <scriptHash> OP_EQUAL
            // a9 <20 bytes> 87
            scriptPubKey = Buffer.concat([
                Buffer.from('a914', 'hex'),
                decoded.hash,
                Buffer.from('87', 'hex')
            ]);
        } else {
            // console.error(`Unsupported address type for ${address}: ${decoded.type}`);
            throw new Error('Unsupported address type');
        }

        // Electrum uses sha256(scriptPubKey) reversed
        const hash = crypto.createHash('sha256').update(scriptPubKey).digest();
        return hash.reverse().toString('hex');
        return hash.reverse().toString('hex');
    } catch (e) {
        // console.error('Error converting address to script hash:', e);
        return '';
    }
}

export function isValidAddress(address: string): boolean {
    try {
        decodeCashAddr(address);
        return true;
    } catch (e) {
        return false;
    }
}


// --- Electrum Client (Adapted) ---

export class ElectrumClient {
    private client: net.Socket | tls.TLSSocket;
    private host: string;
    private port: number;
    private protocol: 'tcp' | 'ssl';
    private idCounter: number = 0;
    private pending: Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>;
    public isConnected: boolean = false;

    constructor(host: string = '127.0.0.1', port: number = 50001, protocol: 'tcp' | 'ssl' = 'tcp') {
        this.host = host;
        this.port = port;
        this.protocol = protocol;
        this.client = new net.Socket();
        this.pending = new Map();
    }

    private setupClientListeners() {
        this.client.removeAllListeners();
        this.client.on('data', (data) => this.handleData(data));
        this.client.on('error', (err) => {
            console.error('Electrum Client Error:', err);
            this.isConnected = false;
        });
        this.client.on('close', () => {
            if (this.isConnected) console.log('Electrum Client Closed');
            this.isConnected = false;
        });
    }

    connect(): Promise<void> {
        // if (this.isConnected) return Promise.resolve(); // Simple check

        return new Promise((resolve, reject) => {
            if (this.isConnected) return resolve();

            const onConnect = () => {
                console.log(`Connected to Electrum Server at ${this.host}:${this.port}`);
                this.isConnected = true;
                resolve();
            };

            const onError = (err: Error) => {
                this.isConnected = false;
                reject(err);
            };

            // Clean up old socket if needed
            if (this.client) this.client.destroy();

            if (this.protocol === 'ssl') {
                this.client = tls.connect(this.port, this.host, { rejectUnauthorized: false });
            } else {
                this.client = new net.Socket();
            }

            this.setupClientListeners();

            this.client.once(this.protocol === 'ssl' ? 'secureConnect' : 'connect', onConnect);
            this.client.once('error', onError);

            if (this.protocol !== 'ssl') {
                (this.client as net.Socket).connect(this.port, this.host);
            }
        });
    }

    private buffer: string = '';

    private handleData(data: Buffer) {
        this.buffer += data.toString();

        let idx;
        while ((idx = this.buffer.indexOf('\n')) !== -1) {
            const line = this.buffer.substring(0, idx);
            this.buffer = this.buffer.substring(idx + 1);

            if (!line.trim()) continue;

            try {
                const response = JSON.parse(line);
                if (response.id !== undefined && this.pending.has(response.id)) {
                    const { resolve, reject } = this.pending.get(response.id)!;
                    this.pending.delete(response.id);
                    if (response.error) {
                        reject(response.error);
                    } else {
                        resolve(response.result);
                    }
                }
            } catch (e) {
                console.error('Failed to parse Electrum response:', e);
            }
        }
    }

    request(method: string, params: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                // Try to reconnect?
                return reject(new Error('Socket is not connected'));
            }

            const id = this.idCounter++;
            const request = JSON.stringify({ jsonrpc: '2.0', id, method, params });

            // Timeout handler
            const timeout = setTimeout(() => {
                if (this.pending.has(id)) {
                    this.pending.delete(id);
                    reject(new Error(`Request ${method} timed out`));
                }
            }, 120000);

            this.pending.set(id, {
                resolve: (val) => { clearTimeout(timeout); resolve(val); },
                reject: (err) => { clearTimeout(timeout); reject(err); }
            });

            this.client.write(request + '\n');
        });
    }

    async getHistory(address: string) {
        const scripthash = addressToScriptHash(address);
        if (!scripthash) return [];
        return this.request('blockchain.scripthash.get_history', [scripthash]);
    }

    async getBalance(address: string) {
        const scripthash = addressToScriptHash(address);
        if (!scripthash) return { confirmed: 0, unconfirmed: 0 };
        return this.request('blockchain.scripthash.get_balance', [scripthash]);
    }

    async getLatestHeader() {
        // Returns { height, hex, ... } usually
        return this.request('blockchain.headers.subscribe');
    }

    async getTransactionIdFromPos(height: number, pos: number = 0): Promise<string | null> {
        try {
            // blockchain.transaction.id_from_pos(height, tx_pos, merkle=False)
            const result = await this.request('blockchain.transaction.id_from_pos', [height, pos, false]);
            return result; // Result is the tx_hash string (or hex?) usually string
        } catch (e: any) {
            if (e.message && e.message.includes('failed to get block txids')) {
                // Expected on some servers, silence or debug log
                // console.debug(`TXID lookup not supported for height ${height}`);
            } else {
                console.warn(`Failed to get txid for height ${height}:`, e.message || e);
            }
            return null;
        }
    }

    disconnect() {
        if (this.client) {
            console.log('Disconnecting from Electrum...');
            this.client.destroy();
            this.isConnected = false;
        }
    }
}

// Singleton
// Singleton Pattern for Next.js (avoids multiple connections in dev)
const globalForElectrum = global as unknown as { electrum: ElectrumClient };

export const electrum = globalForElectrum.electrum || new ElectrumClient(
    process.env.ELECTRUM_HOST || '127.0.0.1',
    parseInt(process.env.ELECTRUM_PORT || '50001'),
    (process.env.ELECTRUM_PROTOCOL as 'tcp' | 'ssl') || 'tcp'
);

if (process.env.NODE_ENV !== 'production') globalForElectrum.electrum = electrum;

// Graceful Shutdown
if (typeof process !== 'undefined') {
    const cleanup = () => {
        electrum.disconnect();
    };
    // Avoid adding multiple listeners in dev
    if (!process.listeners('SIGTERM').some(l => l.name === 'cleanupWrapper')) {
        const cleanupWrapper = () => cleanup();
        process.on('SIGTERM', cleanupWrapper);
        process.on('SIGINT', cleanupWrapper);
    }
}
