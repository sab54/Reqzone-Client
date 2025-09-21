/**
 * registerActions.js
 *
 * Redux Toolkit async thunk for new user registration.
 *
 * Exports:
 * - **registerUser(userData)**
 *   - POST `${API_URL_USERS}/register` with expanded user payload:
 *     - All fields from `userData`
 *     - Ensures `latitude` and `longitude` keys exist (nullable).
 *   - On success:
 *     - Persists `countryCode` and `lastPhone` into AsyncStorage.
 *     - Returns server `data`.
 *   - On failure:
 *     - Rejects with `error.message` or `"Registration failed"`.
 *
 * Side effects:
 * - Writes AsyncStorage keys:
 *   - `countryCode` ← `userData.country_code`
 *   - `lastPhone`   ← `userData.phone_number`
 *
 * Dependencies:
 * - `post` from `utils/api`
 * - `API_URL_USERS` from `utils/apiPaths`
 * - `AsyncStorage` from `@react-native-async-storage/async-storage`
 *
 * Author: Sunidhi Abhange
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL_USERS } from '../../utils/apiPaths.js';
import { post } from '../../utils/api';

export const registerUser = createAsyncThunk(
    'registration/registerUser',
    async (userData, { rejectWithValue }) => {
        try {
            // Optional headers can be passed here
            const headers = {};

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
