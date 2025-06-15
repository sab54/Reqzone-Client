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
