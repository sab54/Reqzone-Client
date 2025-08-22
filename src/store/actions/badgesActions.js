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
