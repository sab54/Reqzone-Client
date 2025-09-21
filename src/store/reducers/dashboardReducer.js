// src/store/reducers/dashboardReducer.js
/**
 * dashboardReducer.js
 *
 * Manages the dashboard view state:
 * - `profile`: user profile object
 * - `stats`: dashboard statistics object
 * - `loading`: whether `fetchDashboard` is in-flight
 * - `error`: error string or null
 *
 * Reducers:
 * - `clearDashboard` → clears profile, stats, and error
 *
 * Extra reducers:
 * - `fetchDashboard.pending` → sets `loading=true`, clears error
 * - `fetchDashboard.fulfilled` → sets `loading=false`, replaces profile + stats
 * - `fetchDashboard.rejected` → sets `loading=false`, sets error
 *
 * Notes:
 * - `clearDashboard` does not touch `loading`
 * - Payload shape for `fulfilled` is expected as `{ profile, stats }`
 */

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
