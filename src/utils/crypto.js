import 'react-native-get-random-values'; // MUST BE FIRST
import CryptoJS from 'crypto-js';
import { ENCRYPTION_KEY, IV_LENGTH } from './config'; // Ensure ENCRYPTION_KEY is 32 characters

/**
 * Generates secure random bytes for IV using Web Crypto API.
 * Works in React Native with `react-native-get-random-values` installed.
 */
const getRandomBytes = (length) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array); // ✅ secure random
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
