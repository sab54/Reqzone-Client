import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL_DASHBOARD } from '../../utils/apiPaths';
import { get } from '../../utils/api';

/**
 * GET /dashboard/:user_id - Fetch full dashboard data for user
 */
export const fetchDashboard = createAsyncThunk(
    'dashboard/fetchDashboard',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await get(`${API_URL_DASHBOARD}/${userId}`);
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to load dashboard');
        }
    }
);
