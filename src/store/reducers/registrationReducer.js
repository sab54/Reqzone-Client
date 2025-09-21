// src/store/reducers/registrationReducer.js
/**
 * registrationReducer.js
 *
 * Manages the user registration flow.
 *
 * State:
 * - `loading`: true while registration is in progress
 * - `user`: newly registered user object (or null if none)
 * - `error`: last error message, if any
 *
 * Extra reducers:
 * - `registerUser.pending` → sets `loading=true`, clears error
 * - `registerUser.fulfilled` → sets `loading=false`, stores user payload, clears error
 * - `registerUser.rejected` → sets `loading=false`, stores error
 *
 * Notes:
 * - No local reducers; everything is handled by thunks.
 * - `user` is fully replaced on success.
 */

import { createSlice } from '@reduxjs/toolkit';
import { registerUser } from '../actions/registrationActions';

const initialState = {
    loading: false,
    user: null,
    error: null,
};

const registrationSlice = createSlice({
    name: 'registration',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.error = null;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default registrationSlice.reducer;
