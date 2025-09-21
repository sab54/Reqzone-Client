/**
 * dashboardActions.js
 *
 * Redux Toolkit async thunks for dashboard-related operations.
 *
 * Exports:
 * - **fetchDashboard(userId)**:
 *   - GET `/dashboard/:user_id` to load full dashboard data for the user.
 *   - Returns the API response object on success.
 *   - On error, rejects with a string message (either `error.message` or a fallback).
 *
 * Flow:
 * 1. Invoke API with `get(`${API_URL_DASHBOARD}/${userId}`)`.
 * 2. If resolved, return response to reducers.
 * 3. If rejected, use `rejectWithValue` to provide a user-friendly message.
 *
 * Notes:
 * - Uses `API_URL_DASHBOARD` constant from `utils/apiPaths`.
 * - Uses `get` helper from `utils/api` for HTTP.
 * - Error handling ensures UI receives consistent messages.
 *
 * Author: Sunidhi Abhange
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL_DASHBOARD } from '../../utils/apiPaths';
import { get } from '../../utils/api';

// GET /dashboard/:user_id - Fetch full dashboard data for user
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
