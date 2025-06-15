import { createSlice } from '@reduxjs/toolkit';
import {
    loadBookmarks,
    addBookmark,
    removeBookmark,
    clearBookmarksAndPersist,
} from '../actions/bookmarksActions';

const initialState = {
    bookmarks: [],
    loading: false,
    error: null,
};

const bookmarksSlice = createSlice({
    name: 'bookmarks',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Load
            .addCase(loadBookmarks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadBookmarks.fulfilled, (state, action) => {
                state.loading = false;
                state.bookmarks = Array.isArray(action.payload)
                    ? action.payload
                    : [];
            })
            .addCase(loadBookmarks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Add
            .addCase(addBookmark.fulfilled, (state, action) => {
                state.bookmarks.unshift(action.payload);
            })
            .addCase(addBookmark.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Remove
            .addCase(removeBookmark.fulfilled, (state, action) => {
                state.bookmarks = state.bookmarks.filter(
                    (a) => a.url !== action.payload
                );
            })
            .addCase(removeBookmark.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Clear all
            .addCase(clearBookmarksAndPersist.fulfilled, (state) => {
                state.bookmarks = [];
            })
            .addCase(clearBookmarksAndPersist.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

export default bookmarksSlice.reducer;
