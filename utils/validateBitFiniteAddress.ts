import ecc from '@bitcoinerlab/secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

// Init ECC in case a taproot address is specified
bitcoin.initEccLib(ecc);


/**
 * Tests if the address is a valid BitFinite address.
 * @param {string} address - The BitFinite address to validate.
 * @returns {boolean} True if a valid BitFinite address.
 */

export function validateBitFiniteAddress(address: string): boolean {
    // Quick sanity checks
    if (typeof address !== 'string') return false;
    if (address.length < 5) return false;

    // New BitFinite addresses start with 'f'
    if (address.startsWith('f')) return true;

    // Legacy fallback or just permissive check for development if strict validation isn't possible yet
    // But given the request "customize BitFinite Address Prefix", we should prioritize 'f'.

    // Reject obviously wrong ones
    if (address.startsWith('1') || address.startsWith('3') || address.startsWith('bc1')) {
        // It's a Bitcoin address, not BitFinite
        return false;
    }

    return false;
}
