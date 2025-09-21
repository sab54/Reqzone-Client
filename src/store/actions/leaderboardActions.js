/**
 * leaderboardActions.js
 *
 * Redux Toolkit async thunk for loading the leaderboard.
 *
 * Exports:
 * - **fetchLeaderboard({ city, role })**
 *   - GET `/leaderboard` with optional query params (?city=...&role=...).
 *   - Returns `response.leaderboard` array or empty array if not present.
 *   - Rejects with a user-friendly string message if request fails.
 *
 * Flow:
 * 1. Build query string with `city` and `role` if provided.
 * 2. Call `get(`${API_URL_LEADERBOARD}?...`)`.
 * 3. Return `response.leaderboard` if available, else `[]`.
 * 4. On error, `rejectWithValue(error.message || 'Failed to fetch leaderboard')`.
 *
 * Notes:
 * - Uses `get` helper from `utils/api`.
 * - URL base comes from `API_URL_LEADERBOARD` in `utils/apiPaths`.
 *
 * Author: Sunidhi Abhange
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL_LEADERBOARD } from '../../utils/apiPaths';
import { get } from '../../utils/api';

// GET /leaderboard - Top users globally or filtered by city/role
export const fetchLeaderboard = createAsyncThunk(
    'leaderboard/fetchLeaderboard',
    async ({ city = null, role = null } = {}, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams();
            if (city) params.append('city', city);
            if (role) params.append('role', role);

            const queryString = params.toString();
            const response = await get(
                `${API_URL_LEADERBOARD}${queryString ? `?${queryString}` : ''}`
            );

            return response?.leaderboard || [];
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to fetch leaderboard'
            );
        }
    }
);
