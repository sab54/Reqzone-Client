import { createSlice } from '@reduxjs/toolkit';
import { fetchDashboard } from '../actions/dashboardActions';

const initialState = {
    profile: null,
    stats: null,
    loading: false,
    error: null,
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        clearDashboard: (state) => {
            state.profile = null;
            state.stats = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboard.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDashboard.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload.profile;
                state.stats = action.payload.stats;
            })
            .addCase(fetchDashboard.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
