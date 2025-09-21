/**
 * __tests__/unit/utils/crypto.test.js
 *
 * What this test file covers:
 *
 * 1) encryptBody → shape & round-trip
 *    - Produces "ivHex:encryptedHex" payload and decrypts back to original object.
 *
 * 2) IV length and hex format
 *    - Ensures IV hex matches expected length from IV_LENGTH (16 bytes → 32 hex chars).
 *
 * 3) decryptBody invalid format
 *    - Throws when payload does not contain ":" separator.
 *
 * 4) decryptBody failure on tampered ciphertext
 *    - Throws "Failed to decrypt payload" for malformed ciphertext.
 */

// Satisfy the RN polyfill import used by the implementation
jest.mock('react-native-get-random-values', () => ({}), { virtual: true });

// Ensure the module under test receives stable config values
jest.mock('src/utils/config', () => ({
  ENCRYPTION_KEY: '12345678901234567890123456789012', // 32 chars for AES-256
  IV_LENGTH: 16, // 16-byte IV for AES-CBC
}));

import CryptoJS from 'crypto-js';
import { encryptBody, decryptBody } from 'src/utils/crypto';

describe('utils/crypto encryption helpers', () => {
  const originalCrypto = global.crypto;

  beforeEach(() => {
    // Deterministic getRandomValues so tests are stable
    global.crypto = {
      getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i += 1) arr[i] = i % 256;
        return arr;
      },
    };
  });

  afterEach(() => {
    global.crypto = originalCrypto;
    jest.clearAllMocks();
  });

  it('encryptBody returns payload "ivHex:encryptedHex" and decryptBody round-trips', () => {
    const obj = { user: 'alice', role: 'doctor', n: 42 };

    const { payload } = encryptBody(obj);

    expect(typeof payload).toBe('string');
    expect(payload).toMatch(/^[0-9a-f]+:[0-9a-f]+$/i); // ivHex:cipherHex

    const decoded = decryptBody(payload);
    expect(decoded).toEqual(obj);
  });

  it('payload contains IV with correct hex length and format', () => {
    const { payload } = encryptBody({ test: true });
    const [ivHex] = payload.split(':');

    // 16-byte IV → 32 hex characters
    expect(ivHex).toMatch(/^[0-9a-f]+$/i);
    expect(ivHex.length).toBe(32);
  });

  it('decryptBody throws on invalid payload format (no colon)', () => {
    expect(() => decryptBody('not-a-valid-payload')).toThrow('Invalid payload format');
  });

  it('decryptBody throws on tampered ciphertext', () => {
    const { payload } = encryptBody({ ok: true });
    const [ivHex] = payload.split(':');

    // Replace ciphertext with invalid short hex to force failure
    const badPayload = `${ivHex}:deadbeef`;
    expect(() => decryptBody(badPayload)).toThrow('Failed to decrypt payload');
  });
});
