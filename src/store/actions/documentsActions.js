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
