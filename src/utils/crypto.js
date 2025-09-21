/**
 * cryptoUtils.js
 *
 * Utility functions for encrypting and decrypting request/response payloads
 * using AES-256-CBC (Cipher Block Chaining) with PKCS7 padding.
 *
 * Key Functionalities:
 *
 * - **getRandomBytes**:
 *   Generates a secure random Initialization Vector (IV) of a specified length
 *   using the Web Crypto API (`react-native-get-random-values` ensures RN support).
 *
 * - **encryptBody**:
 *   Encrypts a plain JavaScript object into a secure payload.
 *   - Input: Any serializable JS object.
 *   - Process:
 *     1. Stringify the object.
 *     2. Encrypt using AES-256-CBC with the configured `ENCRYPTION_KEY` and
 *        a randomly generated IV (`IV_LENGTH`).
 *     3. Return an object `{ payload: "ivHex:encryptedHex" }`.
 *   - Output: Encrypted payload with IV in hex form, concatenated with the
 *     ciphertext using `:` as a delimiter.
 *
 * - **decryptBody**:
 *   Decrypts an AES-256-CBC payload back into its original JS object.
 *   - Input: String formatted as `"ivHex:encryptedHex"`.
 *   - Process:
 *     1. Split IV and ciphertext from the payload string.
 *     2. Parse them into WordArray objects.
 *     3. Decrypt using AES-256-CBC with the configured `ENCRYPTION_KEY`.
 *     4. Parse decrypted UTF-8 string back into JSON.
 *   - Output: Original JS object.
 *
 * Error Handling:
 * - `decryptBody` throws if the payload format is invalid (no colon `:` present).
 * - Throws if decryption fails or produces empty output.
 *
 * Notes:
 * - Requires `ENCRYPTION_KEY` to be exactly 32 characters long for AES-256.
 * - `IV_LENGTH` must match the block size (16 bytes for AES).
 * - Ensures sensitive data is secured during transport/storage in the app.
 *
 * Author: Sunidhi Abhange
 */

import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';
import { ENCRYPTION_KEY, IV_LENGTH } from './config';

/**
 * Generates secure random bytes for IV using Web Crypto API.
 * Works in React Native with `react-native-get-random-values` installed.
 */
const getRandomBytes = (length) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return CryptoJS.lib.WordArray.create(array);
};

/**
 * Encrypt a JS object into AES-256-CBC (CBC mode, PKCS7 padding)
 * Output format: { payload: 'ivHex:encryptedHex' }
 */
export const encryptBody = (bodyObject) => {
    const json = JSON.stringify(bodyObject);
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
    const iv = getRandomBytes(IV_LENGTH);

    const encrypted = CryptoJS.AES.encrypt(json, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });

    const ivHex = iv.toString(CryptoJS.enc.Hex);
    const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);

    return {
        payload: `${ivHex}:${encryptedHex}`,
    };
};

/**
 * Decrypts AES-256-CBC string back into JS object.
 * Expects input in format: 'ivHex:encryptedHex'
 */
export const decryptBody = (payload) => {
    if (!payload.includes(':')) {
        throw new Error('Invalid payload format');
    }

    const [ivHex, encryptedHex] = payload.split(':');
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const encryptedWordArray = CryptoJS.enc.Hex.parse(encryptedHex);
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);

    const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: encryptedWordArray },
        key,
        {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        }
    );

    const json = decrypted.toString(CryptoJS.enc.Utf8);
    if (!json) {
        throw new Error('Failed to decrypt payload');
    }

    return JSON.parse(json);
};
