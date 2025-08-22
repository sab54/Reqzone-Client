import { BASE_URL } from './config';
import { encryptBody, decryptBody } from './crypto';

/**
 * Handle and normalize fetch responses (with decryption)
 * @param {Response} response
 * @returns {Promise<any>}
 */
const handleResponse = async (response) => {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorMessage = data?.message || 'Something went wrong';
        throw new Error(errorMessage);
    }

    // Decrypt if payload exists
    if (data?.payload) {
        try {
            let decryptedContent = decryptBody(data.payload);

            console.log('Responce decryptedContent: ', decryptedContent);
            return decryptedContent;
        } catch (error) {
            console.error('❌ Failed to decrypt response:', error);
            throw new Error('Invalid encrypted response');
        }
    }

    return data;
};

/**
 * Build request headers
 */
const getHeaders = (extraHeaders = {}) => ({
    'Content-Type': 'application/json',
    ...extraHeaders,
});

/**
 * Serialize query params for GET requests
 */
const serializeParams = (params = {}) =>
    Object.entries(params)
        .map(
            ([key, value]) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        )
        .join('&');

/**
 * GET request with optional query params
 */
export const get = async (endpoint, params = {}, headers = {}) => {
    console.log('🔒 Encrypted GET to:', endpoint);
    console.log('Request GET params:', params);
    console.log('Request GET headers:', headers);
    const { payload } = encryptBody(params);

    const query = Object.keys(params).length
        ? `?${serializeParams(payload)}`
        : '';
    const response = await fetch(`${BASE_URL}${endpoint}${query}`, {
        method: 'GET',
        headers: getHeaders(headers),
    });

    return handleResponse(response);
};

/**
 * POST request — encrypts body
 */
export const post = async (endpoint, body = {}, headers = {}) => {
    console.log('🔒 Encrypted POST to:', endpoint);
    console.log('Request POST body:', body);
    console.log('Request POST headers:', headers);
    const encrypted = encryptBody(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(headers),
        body: JSON.stringify(encrypted),
    });

    return handleResponse(response);
};

/**
 * PUT request — encrypts body
 */
export const put = async (endpoint, body = {}, headers = {}) => {
    console.log('🔒 Encrypted PUT to:', endpoint);
    console.log('Request PUT body:', body);
    console.log('Request PUT headers:', headers);
    const encrypted = encryptBody(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(headers),
        body: JSON.stringify(encrypted),
    });

    return handleResponse(response);
};

/**
 * PATCH request — encrypts body
 */
export const patch = async (endpoint, body = {}, headers = {}) => {
    console.log('🔒 Encrypted PATCH to:', endpoint);
    console.log('Request PATCH body:', body);
    console.log('Request PATCH headers:', headers);
    const encrypted = encryptBody(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: getHeaders(headers),
        body: JSON.stringify(encrypted),
    });

    return handleResponse(response);
};

/**
 * DELETE request — encrypts query params
 */
export const del = async (endpoint, params = {}, headers = {}) => {
    console.log('🔒 Encrypted DELETE to:', endpoint);
    console.log('Request DELETE params:', params);
    console.log('Request DELETE headers:', headers);

    const { payload } = encryptBody(params);

    // Send payload using a single query parameter named "payload"
    const query = payload ? `?payload=${encodeURIComponent(payload)}` : '';

    const response = await fetch(`${BASE_URL}${endpoint}${query}`, {
        method: 'DELETE',
        headers: getHeaders(headers),
    });

    return handleResponse(response);
};
