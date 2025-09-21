// src/store/reducers/newsReducer.js
/**
 * newsReducer.js
 *
 * Manages paged news results with simple client-side de-duplication.
 *
 * State:
 * - `articles`: current list of articles (array of { url, ... })
 * - `loading`: fetch-in-flight flag
 * - `page`: next page index to request (starts at 1)
 * - `hasMore`: hint that more pages exist (true if the last append had items)
 * - `totalCount`: total results as reported by the backend/search
 *
 * Reducers:
 * - `setNewsArticles(list)`
 *   - Replaces `articles` (or [] if falsy), resets `page` to 1,
 *     sets `hasMore` to `list.length > 0`.
 * - `appendNewsArticles(list)`
 *   - Appends unique items by `url` (skip duplicates already present),
 *     increments `page` by 1, sets `hasMore` to `list.length > 0`.
 * - `setNewsLoading(boolean)` → toggles `loading`.
 * - `setNewsTotal(number)` → sets `totalCount` (defaults to 0 for falsy).
 *
 * Notes:
 * - De-duplication is based solely on `url`.
 * - `page` indicates the next page to ask for after the current state.
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    articles: [],
    loading: false,
    page: 1,
    hasMore: true,
    totalCount: 0,
};

const newsSlice = createSlice({
    name: 'news',
    initialState,
    reducers: {
        setNewsArticles: (state, action) => {
            state.articles = action.payload || [];
            state.page = 1;
            state.hasMore = (action.payload || []).length > 0;
        },
        appendNewsArticles: (state, action) => {
            const newArticles = action.payload || [];
            const urls = new Set(state.articles.map((a) => a.url));
            const merged = [
                ...state.articles,
                ...newArticles.filter((a) => !urls.has(a.url)),
            ];
            state.articles = merged;
            state.page += 1;
            state.hasMore = newArticles.length > 0;
        },
        setNewsLoading: (state, action) => {
            state.loading = action.payload;
        },
        setNewsTotal: (state, action) => {
            state.totalCount = action.payload || 0;
        },
    },
});

export const {
    setNewsArticles,
    appendNewsArticles,
    setNewsLoading,
    setNewsTotal,
} = newsSlice.actions;

export default newsSlice.reducer;
