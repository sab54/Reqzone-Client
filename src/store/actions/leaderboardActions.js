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
