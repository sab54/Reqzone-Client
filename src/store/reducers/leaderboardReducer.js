// src/store/reducers/leaderboardReducer.js
/**
 * leaderboardReducer.js
 *
 * Manages the leaderboard state.
 *
 * State:
 * - `leaderboard`: array of ranked user entries
 * - `loading`: true while leaderboard data is being fetched
 * - `error`: error message or null
 *
 * Reducers:
 * - `clearLeaderboard` → empties the leaderboard and clears error
 *
 * Extra reducers:
 * - `fetchLeaderboard.pending` → sets loading=true, clears error
 * - `fetchLeaderboard.fulfilled` → sets loading=false, replaces leaderboard with payload
 * - `fetchLeaderboard.rejected` → sets loading=false, sets error
 *
 * Notes:
 * - Payload for `fulfilled` is expected to be an array of entries.
 * - `clearLeaderboard` does not touch `loading`.
 */

import { createSlice } from '@reduxjs/toolkit';
import { fetchLeaderboard } from '../actions/leaderboardActions';

const initialState = {
    leaderboard: [],
    loading: false,
    error: null,
};

const leaderboardSlice = createSlice({
    name: 'leaderboard',
    initialState,
    reducers: {
        clearLeaderboard: (state) => {
            state.leaderboard = [];
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLeaderboard.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLeaderboard.fulfilled, (state, action) => {
                state.loading = false;
                state.leaderboard = action.payload;
            })
            .addCase(fetchLeaderboard.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearLeaderboard } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
