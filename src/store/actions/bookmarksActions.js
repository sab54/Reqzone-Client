// src/store/actions/bookmarksActions.js
/**
 * bookmarksActions.js
 *
 * Redux Toolkit async thunks for managing news bookmarks tied to the
 * authenticated user.
 *
 * Thunks:
 * - **loadBookmarks()**
 *   Loads all bookmarks for the current user from `${API_URL_NEWS}/bookmarks`.
 *   Requires `state.auth.user.id`. Returns the API response as-is.
 *
 * - **addBookmark(article)**
 *   Enriches the given article with `user_id` and an ISO `bookmarkedAt`
 *   timestamp; POSTs to `${API_URL_NEWS}/bookmarks`; returns the enriched
 *   article for optimistic updates.
 *
 * - **removeBookmark(article)**
 *   DELETEs `${API_URL_NEWS}/bookmarks` with `{ user_id, url }`; returns the
 *   removed article URL on success.
 *
 * - **clearBookmarksAndPersist()**
 *   DELETEs `${API_URL_NEWS}/bookmarks/all` with `{ user_id }`; returns `true`
 *   on success for reducer convenience.
 *
 * Error Handling:
 * - Each thunk uses `rejectWithValue(error.message || '<fallback>')`.
 * - Input validation errors (e.g., missing `user_id`/`url`) are thrown and
 *   surfaced via `rejectWithValue`.
 *
 * Dependencies:
 * - API helpers: `get`, `post`, `del` from `utils/api`
 * - Base path: `API_URL_NEWS` from `utils/apiPaths`
 *
 * Author: Sunidhi Abhange
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { get, post, del } from '../../utils/api';
import { API_URL_NEWS } from '../../utils/apiPaths';

// Load all bookmarks from the server
export const loadBookmarks = createAsyncThunk(
    'bookmarks/loadBookmarks',
    async (_, { getState, rejectWithValue }) => {
        try {
            const user_id = getState().auth?.user?.id;
            console.log('user_id: ', user_id);

            if (!user_id) throw new Error('User ID not found');

            const response = await get(`${API_URL_NEWS}/bookmarks`, {
                user_id,
            });

            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to load bookmarks');
        }
    }
);

// Add a bookmark
export const addBookmark = createAsyncThunk(
    'bookmarks/addBookmark',
    async (article, { getState, rejectWithValue }) => {
        try {
            const user_id = getState().auth?.user?.id;
            if (!user_id) throw new Error('User ID not found');

            const enrichedArticle = {
                ...article,
                user_id,
                bookmarkedAt: new Date().toISOString(),
            };

            await post(`${API_URL_NEWS}/bookmarks`, enrichedArticle);

            return enrichedArticle;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to add bookmark');
        }
    }
);

// Remove a bookmark
export const removeBookmark = createAsyncThunk(
    'bookmarks/removeBookmark',
    async (article, { getState, rejectWithValue }) => {
        try {
            const user_id = getState().auth?.user?.id;
            if (!user_id || !article?.url) throw new Error('Invalid input');

            await del(`${API_URL_NEWS}/bookmarks`, {
                user_id,
                url: article.url,
            });

            return article.url;
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to remove bookmark'
            );
        }
    }
);

// Clear all bookmarks (optional: uses /bookmarks/all)
export const clearBookmarksAndPersist = createAsyncThunk(
    'bookmarks/clearAllBookmarks',
    async (_, { getState, rejectWithValue }) => {
        try {
            const user_id = getState().auth?.user?.id;
            if (!user_id) throw new Error('User ID not found');

            await del(`${API_URL_NEWS}/bookmarks/all`, { user_id });

            return true;
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to clear bookmarks'
            );
        }
    }
);
