import { createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL_USERS } from '../../utils/apiPaths.js';
import { post } from '../../utils/api';

export const registerUser = createAsyncThunk(
    'registration/registerUser',
    async (userData, { rejectWithValue }) => {
        try {
            // Optional headers can be passed here
            const headers = {}; // e.g., { Authorization: `Bearer ${token}` }

            const data = await post(
                `${API_URL_USERS}/register`,
                {
                    ...userData,
                    latitude: userData.latitude || null,
                    longitude: userData.longitude || null,
                },
                headers
            );

            await AsyncStorage.setItem('countryCode', userData.country_code);
            await AsyncStorage.setItem('lastPhone', userData.phone_number);
            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Registration failed');
        }
    }
);
