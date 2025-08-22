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
