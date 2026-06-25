'use strict';

process.env.SHARE_LINK_ENCRYPTION_KEY = 'test-encryption-key-for-unit-tests';

const { encryptApiKey, decryptApiKey, keyHint } = require('../../src/lib/apiKeyVault');

describe('apiKeyVault', () => {
    it('encrypts and decrypts an API key round-trip', () => {
        const original = 'AIzaSyTestKey1234567890';
        const encrypted = encryptApiKey(original);
        const decrypted = decryptApiKey(encrypted);
        expect(decrypted).toBe(original);
    });

    it('returns null when ciphertext fields are missing', () => {
        expect(decryptApiKey({})).toBeNull();
    });

    it('returns a safe key hint', () => {
        expect(keyHint('AIzaSyTestKey7890')).toBe('…7890');
    });
});
