// src/store/reducers/documentsReducer.js
/**
 * documentsReducer.js
 *
 * Manages a list of user documents with async load/add/remove/clear flows
 * and read/unread toggles.
 *
 * State:
 * - `documents`: array of document objects (id, url, title, read, ...)
 * - `loading`: true while `fetchDocuments` is pending
 * - `error`: last error string, if any
 *
 * Extra reducers:
 * - `fetchDocuments` (pending/fulfilled/rejected)
 *   - pending: `loading=true`, `error=null`
 *   - fulfilled: replaces `documents` with payload if Array, else []
 *   - rejected: `loading=false`, set `error`
 * - `addDocument` (fulfilled/rejected)
 *   - fulfilled: unshifts new doc to the front
 *   - rejected: set `error`
 * - `removeDocument` (fulfilled/rejected)
 *   - fulfilled: removes by matching `url`
 *   - rejected: set `error`
 * - `clearAllDocuments` (fulfilled/rejected)
 *   - fulfilled: empties `documents`
 *   - rejected: set `error`
 * - `markDocumentAsRead` / `markDocumentAsUnread` (fulfilled/rejected)
 *   - fulfilled: flip `read` flag for the matching `id`
 *   - rejected: set `error`
 *
 * Notes:
 * - Only `fetchDocuments` toggles the top-level `loading`.
 * - Insert order is newest-first due to `unshift`.
 */

import { createSlice } from '@reduxjs/toolkit';
import {
    fetchDocuments,
    addDocument,
    removeDocument,
    clearAllDocuments,
    markDocumentAsRead,
    markDocumentAsUnread,
} from '../actions/documentsActions';

const initialState = {
    documents: [],
    loading: false,
    error: null,
};

const documentsSlice = createSlice({
    name: 'documents',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch documents
            .addCase(fetchDocuments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDocuments.fulfilled, (state, action) => {
                state.loading = false;
                state.documents = Array.isArray(action.payload)
                    ? action.payload
                    : [];
            })
            .addCase(fetchDocuments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Add document
            .addCase(addDocument.fulfilled, (state, action) => {
                state.documents.unshift(action.payload);
            })
            .addCase(addDocument.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Remove document
            .addCase(removeDocument.fulfilled, (state, action) => {
                state.documents = state.documents.filter(
                    (doc) => doc.url !== action.payload
                );
            })
            .addCase(removeDocument.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Clear all documents
            .addCase(clearAllDocuments.fulfilled, (state) => {
                state.documents = [];
            })
            .addCase(clearAllDocuments.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Mark document as read
            .addCase(markDocumentAsRead.fulfilled, (state, action) => {
                const documentId = action.payload;
                const doc = state.documents.find((d) => d.id === documentId);
                if (doc) doc.read = true;
            })
            .addCase(markDocumentAsRead.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Mark document as unread
            .addCase(markDocumentAsUnread.fulfilled, (state, action) => {
                const documentId = action.payload;
                const doc = state.documents.find((d) => d.id === documentId);
                if (doc) doc.read = false;
            })
            .addCase(markDocumentAsUnread.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

export default documentsSlice.reducer;
