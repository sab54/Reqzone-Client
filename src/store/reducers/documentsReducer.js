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
