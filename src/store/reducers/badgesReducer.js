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
