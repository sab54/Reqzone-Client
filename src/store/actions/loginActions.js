import { createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { post, patch } from '../../utils/api'; // Ensure patch is defined for PATCH requests
import { API_URL_USERS } from '../../utils/apiPaths.js';

/**
 * Request OTP for a phone number
 */
export const requestOtp = createAsyncThunk(
    'auth/requestOtp',
    async ({ phone_number, country_code }, { rejectWithValue }) => {
        try {
            const data = await post(`${API_URL_USERS}/request-otp`, {
                phone_number,
                country_code,
            });

            await AsyncStorage.setItem('countryCode', country_code);
            await AsyncStorage.setItem('lastPhone', phone_number);

            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to request OTP');
        }
    }
);

/**
 * Verify the received OTP
 */
export const verifyOtp = createAsyncThunk(
    'auth/verifyOtp',
    async ({ user_id, otp_code }, { rejectWithValue }) => {
        try {
            const data = await post(`${API_URL_USERS}/verify-otp`, {
                user_id,
                otp_code,
            });

            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'OTP verification failed');
        }
    }
);

/**
 * Logout
 */
export const logout = createAsyncThunk('auth/logout', async () => {
    // Optional: clear any persisted user data
    //await AsyncStorage.multiRemove(['countryCode', 'lastPhone']);
    return true;
});

/**
 * 🚀 Update user location
 */
export const updateUserLocation = createAsyncThunk(
    'auth/updateUserLocation',
    async ({ userId, latitude, longitude }, { rejectWithValue }) => {
        try {
            const data = await patch(`${API_URL_USERS}/${userId}/location`, {
                latitude,
                longitude,
            });
            return data;
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to update location'
            );
        }
    }
);
