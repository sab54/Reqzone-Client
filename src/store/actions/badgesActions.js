// src/store/actions/badgesActions.js
/**
 * badgesActions.js
 *
 * Redux Toolkit async thunks for managing badges:
 * - Fetch all available badges
 * - Fetch badges earned by a specific user
 * - Manually award a badge to a user
 *
 * Thunks:
 * - **fetchAllBadges()**
 *   GET `${API_URL_BADGES}` → returns `response.badges` or `[]`.
 *
 * - **fetchUserBadges(userId)**
 *   GET `${API_URL_BADGES}/user/${userId}` → returns `response.earned` or `[]`.
 *
 * - **awardBadgeToUser({ userId, badgeId })**
 *   POST `${API_URL_BADGES}/award` with `{ user_id, badge_id }` → returns API response as-is.
 *
 * Error Handling:
 * - Each thunk catches errors and returns `rejectWithValue(message)` where `message`
 *   is `error.message` or a readable fallback.
 *
 * Notes:
 * - Network helpers come from `utils/api` (`get`, `post`).
 * - URL base constant comes from `utils/apiPaths` (`API_URL_BADGES`).
 *
 * Author: Sunidhi Abhange
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL_BADGES } from '../../utils/apiPaths';
import { get, post } from '../../utils/api';

// GET /badges - Fetch all available badges
export const fetchAllBadges = createAsyncThunk(
    'badges/fetchAllBadges',
    async (_, { rejectWithValue }) => {
        try {
            const response = await get(`${API_URL_BADGES}`);
            return response?.badges || [];
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch badges');
        }
    }
);

// GET /badges/user/:user_id - Fetch badges earned by user
export const fetchUserBadges = createAsyncThunk(
    'badges/fetchUserBadges',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await get(`${API_URL_BADGES}/user/${userId}`);
            return response?.earned || [];
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to fetch user badges'
            );
        }
    }
);

// POST /badges/award - Manually award a badge to a user
export const awardBadgeToUser = createAsyncThunk(
    'badges/awardBadgeToUser',
    async ({ userId, badgeId }, { rejectWithValue }) => {
        try {
            const response = await post(`${API_URL_BADGES}/award`, {
                user_id: userId,
                badge_id: badgeId,
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to award badge');
        }
    }
);
