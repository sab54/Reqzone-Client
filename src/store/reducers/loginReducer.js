// src/store/reducers/loginReducer.js
/**
 * loginReducer.js
 *
 * Handles authentication flow and user session state.
 *
 * State:
 * - `loading`: async in-flight flag
 * - `error`: error string, if any
 * - `user`: authenticated user object (or null)
 * - `isVerified`: true if OTP verification succeeded
 *
 * Reducers:
 * - `resetAuthState` → resets to initial state
 *
 * Extra reducers:
 * - `verifyOtp` (pending/fulfilled/rejected)
 *   - pending → loading=true, error cleared, isVerified=false
 *   - fulfilled → user set from payload, isVerified=true
 *   - rejected → error set, isVerified=false
 * - `updateUserLocation` (pending/fulfilled/rejected)
 *   - pending → loading=true, error cleared
 *   - fulfilled → updates `user.latitude` / `user.longitude` if user exists
 *   - rejected → sets error
 * - `logout.fulfilled` → resets to initial state
 *
 * Notes:
 * - Location updates are skipped if no `user` is present.
 * - Reset actions (`resetAuthState`, `logout.fulfilled`) always return a clean state.
 */

import { createSlice } from '@reduxjs/toolkit';
import { verifyOtp, logout, updateUserLocation } from '../actions/loginActions';

const initialState = {
    loading: false,
    error: null,
    user: null,
    isVerified: false,
};

const loginSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        resetAuthState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(verifyOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.isVerified = false;
            })
            .addCase(verifyOtp.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user || null;
                state.isVerified = true;
            })
            .addCase(verifyOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isVerified = false;
            })
            .addCase(updateUserLocation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUserLocation.fulfilled, (state, action) => {
                state.loading = false;
                if (state.user) {
                    state.user.latitude = action.meta.arg.latitude;
                    state.user.longitude = action.meta.arg.longitude;
                }
            })
            .addCase(updateUserLocation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(logout.fulfilled, () => initialState);
    },
});

export const { resetAuthState } = loginSlice.actions;
export default loginSlice.reducer;
