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
