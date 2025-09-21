// src/store/reducers/bookmarksReducer.js
/**
 * bookmarksReducer.js
 *
 * Manages a simple bookmark list with async load/add/remove/clear flows.
 *
 * State:
 * - `bookmarks`: array of bookmark objects (shape defined by callers)
 * - `loading`: true while `loadBookmarks` is pending
 * - `error`: last error message, if any
 *
 * Extra reducers:
 * - `loadBookmarks` (pending/fulfilled/rejected)
 *   - pending: sets `loading=true`, clears `error`
 *   - fulfilled: replaces `bookmarks` with payload if it's an array, else []
 *   - rejected: stores error in `error`, sets `loading=false`
 * - `addBookmark` (fulfilled/rejected)
 *   - fulfilled: unshifts new item at the start of `bookmarks`
 *   - rejected: stores error
 * - `removeBookmark` (fulfilled/rejected)
 *   - fulfilled: filters out item whose `url` matches payload
 *   - rejected: stores error
 * - `clearBookmarksAndPersist` (fulfilled/rejected)
 *   - fulfilled: empties `bookmarks`
 *   - rejected: stores error
 *
 * Notes:
 * - Only `loadBookmarks` toggles `loading`; others do not change it.
 * - Replacements are non-merging; list order is preserved except `add` which unshifts.
 */

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
