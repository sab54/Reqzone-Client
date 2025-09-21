/**
 * documentsActions.js
 *
 * Redux Toolkit async thunks for user documents:
 *
 * Exports:
 * - **fetchDocuments()**
 *   - Loads all documents for the current user via `GET ${API_URL_DOCUMENTS}/:user_id`.
 *   - Maps each item to:
 *       { ...doc, file_url: `${BASE_URL}${doc.file_url}`, read: !!doc.read_at }
 *   - Rejects with a string message on failure.
 *
 * - **addDocument(doc)**
 *   - Validates input (requires current user id, doc.url, doc.title).
 *   - Posts an enriched document `{ ...doc, user_id, uploadedAt: ISOString }` to `${API_URL_DOCUMENTS}`.
 *   - Returns the enriched document.
 *
 * - **removeDocument(doc)**
 *   - Validates input (requires current user id and doc.url).
 *   - Sends `del(${API_URL_DOCUMENTS}, { user_id, url: doc.url })`.
 *   - Returns the removed document URL.
 *
 * - **clearAllDocuments()**
 *   - Validates user id; calls `del(${API_URL_DOCUMENTS}/all, { user_id })`.
 *   - Returns `true` on success.
 *
 * - **markDocumentAsRead({ documentId })**
 *   - Posts `{ user_id, document_id }` to `${API_URL_DOCUMENTS}/read`.
 *   - Returns the numeric/string `documentId`.
 *
 * - **markDocumentAsUnread({ documentId })**
 *   - Deletes `{ user_id, document_id }` at `${API_URL_DOCUMENTS}/read`.
 *   - Returns the numeric/string `documentId`.
 *
 * Notes:
 * - Uses `get`, `post`, `del` from `utils/api`, `API_URL_DOCUMENTS` from `utils/apiPaths`,
 *   and `BASE_URL` from `utils/config`.
 * - All thunks surface user-friendly messages via `rejectWithValue`.
 *
 * Author: Sunidhi Abhange
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { get, post, del } from '../../utils/api';
import { API_URL_DOCUMENTS } from '../../utils/apiPaths';
import { BASE_URL } from '../../utils/config';

// Load all documents
export const fetchDocuments = createAsyncThunk(
    'documents/fetchDocuments',
    async (_, { getState, rejectWithValue }) => {
        try {
            const user_id = getState().auth?.user?.id;
            if (!user_id) throw new Error('User ID not found');

            const response = await get(`${API_URL_DOCUMENTS}/${user_id}`);

            const data = response.data.map((doc) => ({
                ...doc,
                file_url: `${BASE_URL}${doc.file_url}`,
                read: !!doc.read_at, // ← Convert read_at to boolean flag
            }));
            return data;
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to fetch documents'
            );
        }
    }
);

// Add a new document
export const addDocument = createAsyncThunk(
    'documents/addDocument',
    async (doc, { getState, rejectWithValue }) => {
        try {
            const user_id = getState().auth?.user?.id;
            if (!user_id || !doc?.url || !doc?.title)
                throw new Error('Invalid document data');

            const enrichedDoc = {
                ...doc,
                user_id,
                uploadedAt: new Date().toISOString(),
            };

            await post(`${API_URL_DOCUMENTS}`, enrichedDoc);
            return enrichedDoc;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to add document');
        }
    }
);

// Remove a document
export const removeDocument = createAsyncThunk(
    'documents/removeDocument',
    async (doc, { getState, rejectWithValue }) => {
        try {
            const user_id = getState().auth?.user?.id;
            if (!user_id || !doc?.url) throw new Error('Invalid input');

            await del(`${API_URL_DOCUMENTS}`, {
                user_id,
                url: doc.url,
            });

            return doc.url;
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to remove document'
            );
        }
    }
);

// Clear all documents
export const clearAllDocuments = createAsyncThunk(
    'documents/clearAllDocuments',
    async (_, { getState, rejectWithValue }) => {
        try {
            const user_id = getState().auth?.user?.id;
            if (!user_id) throw new Error('User ID not found');

            await del(`${API_URL_DOCUMENTS}/all`, { user_id });
            return true;
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to clear documents'
            );
        }
    }
);

// Mark document as read
export const markDocumentAsRead = createAsyncThunk(
    'documents/markDocumentAsRead',
    async (documentId, { getState, rejectWithValue }) => {
        try {
            const user_id = getState().auth?.user?.id;
            if (!user_id) throw new Error('User ID missing');

            await post(`${API_URL_DOCUMENTS}/read`, {
                user_id,
                document_id: documentId.documentId,
            });
            return documentId.documentId;
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to mark document as read'
            );
        }
    }
);

// Mark document as unread
export const markDocumentAsUnread = createAsyncThunk(
    'documents/markDocumentAsUnread',
    async (documentId, { getState, rejectWithValue }) => {
        try {
            const user_id = getState().auth?.user?.id;
            if (!user_id) throw new Error('User ID missing');

            await del(`${API_URL_DOCUMENTS}/read`, {
                user_id,
                document_id: documentId.documentId,
            });
            return documentId.documentId;
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to mark document as unread'
            );
        }
    }
);
