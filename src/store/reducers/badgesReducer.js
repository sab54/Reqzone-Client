// src/store/reducers/badgesReducer.js
/**
 * badgesReducer.js
 *
 * Slice managing all available badges, a user’s earned badges, and badge-awarding state.
 *
 * State shape:
 * - `allBadges`: list of all possible badges
 * - `userBadges`: badges the user has already earned
 * - `loading`: async flag for any badge operation
 * - `error`: last error message, if any
 * - `lastAwarded`: the most recently awarded badge (object or id)
 *
 * Reducers:
 * - `clearBadgeState` → clears `lastAwarded` and `error` while leaving data intact
 *
 * Extra reducers:
 * - `fetchAllBadges` (pending/fulfilled/rejected)
 *   - loads master list of badges
 * - `fetchUserBadges` (pending/fulfilled/rejected)
 *   - loads the user’s earned badges
 * - `awardBadgeToUser` (pending/fulfilled/rejected)
 *   - updates `lastAwarded` on success
 *
 * Notes:
 * - All thunks set `loading` and reset `error` during pending state
 * - Fulfilled cases replace their respective slices entirely
 * - Rejected cases store the error message in `error`
 */

import { createSlice } from '@reduxjs/toolkit';
import {
    fetchAllBadges,
    fetchUserBadges,
    awardBadgeToUser,
} from '../actions/badgesActions';

const initialState = {
    allBadges: [],
    userBadges: [],
    loading: false,
    error: null,
    lastAwarded: null,
};

const badgesSlice = createSlice({
    name: 'badges',
    initialState,
    reducers: {
        clearBadgeState: (state) => {
            state.lastAwarded = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllBadges.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllBadges.fulfilled, (state, action) => {
                state.loading = false;
                state.allBadges = action.payload;
            })
            .addCase(fetchAllBadges.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(fetchUserBadges.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserBadges.fulfilled, (state, action) => {
                state.loading = false;
                state.userBadges = action.payload;
            })
            .addCase(fetchUserBadges.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(awardBadgeToUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(awardBadgeToUser.fulfilled, (state, action) => {
                state.loading = false;
                state.lastAwarded = action.payload;
            })
            .addCase(awardBadgeToUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearBadgeState } = badgesSlice.actions;
export default badgesSlice.reducer;
