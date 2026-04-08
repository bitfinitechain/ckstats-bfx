import { validateBitFiniteAddress } from '../../utils/validateBitFiniteAddress';

describe('validateBitFiniteAddress', () => {
    test('validates BitFinite address starting with f', () => {
        expect(validateBitFiniteAddress('f1234567890abcdef')).toBe(true);
    });

    test('validates another BitFinite address', () => {
        expect(validateBitFiniteAddress('f7XyZ...')).toBe(true);
    });

    test('rejects bitcoin legacy address', () => {
        expect(validateBitFiniteAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')).toBe(false);
    });

    test('rejects bitcoin P2SH address', () => {
        expect(validateBitFiniteAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe(false);
    });

    test('rejects bitcoin bech32 address (bc1q)', () => {
        expect(validateBitFiniteAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toBe(false);
    });

    test('rejects empty string', () => {
        expect(validateBitFiniteAddress('')).toBe(false);
    });

    test('rejects short string', () => {
        expect(validateBitFiniteAddress('f12')).toBe(false);
    });

    test('rejects non-string input', () => {
        expect(validateBitFiniteAddress(null as any)).toBe(false);
        expect(validateBitFiniteAddress(undefined as any)).toBe(false);
    });
});
