import { createAsyncThunk } from '@reduxjs/toolkit';
import { get, post, patch, del } from '../../utils/api';
import { API_URL_ALERTS } from '../../utils/apiPaths';
import { DEV_MODE } from '../../utils/config';
import { mockAlerts } from '../../data/mockData';

// 📌 Fetch User Alerts from /alerts/user/:userId
export const fetchUserAlerts = createAsyncThunk(
    'alerts/fetchUserAlerts',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await get(`${API_URL_ALERTS}/user/${userId}`);
            return response?.alerts || [];
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to fetch user alerts'
            );
        }
    }
);

// 📌 Fetch System Alerts with Pagination & Category OR Full Fetch
export const fetchAlertsData = createAsyncThunk(
    'alerts/fetchAlertsData',
    async (
        {
            category = 'All',
            page = 1,
            pageSize = 6,
            fullSystemFetch = true,
            userId = null,
        },
        { rejectWithValue }
    ) => {
        try {
            // if (DEV_MODE) {
            //     const filtered =
            //         category === 'All'
            //             ? mockAlerts.alerts
            //             : mockAlerts.alerts.filter((a) =>
            //                   `${a.title} ${a.description || ''}`
            //                       .toLowerCase()
            //                       .includes(category.toLowerCase())
            //               );
            //     const paginated = filtered.slice(0, page * pageSize);
            //     return {
            //         alerts: paginated,
            //         hasMore: filtered.length > page * pageSize,
            //         totalCount: filtered.length,
            //         fromUserFetch: false,
            //         page,
            //     };
            // }

            let response;
            if (fullSystemFetch) {
                // Pass userId to get 'is_read' field for system alerts
                response = await get(
                    `${API_URL_ALERTS}/system${
                        userId ? `?userId=${userId}` : ''
                    }`
                );
                return {
                    alerts: response?.systemAlerts || [],
                    hasMore: false,
                    totalCount: response?.systemAlerts?.length || 0,
                    fromUserFetch: false,
                    page: 1,
                };
            } else {
                response = await get(
                    `${API_URL_ALERTS}?category=${category}&page=${page}&pageSize=${pageSize}`
                );
                return {
                    alerts: response?.alerts || [],
                    hasMore: response?.hasMore || false,
                    totalCount: response?.totalCount || 0,
                    fromUserFetch: false,
                    page,
                };
            }
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch alerts');
        }
    }
);

// 📌 Create System Alert
export const createSystemAlert = createAsyncThunk(
    'alerts/createSystemAlert',
    async (
        {
            userIds,
            title,
            message,
            urgency,
            latitude,
            longitude,
            radius_km,
            source,
        },
        { rejectWithValue }
    ) => {
        try {
            const payload = {
                userIds,
                title,
                message,
                urgency,
                latitude,
                longitude,
                radius_km,
                source,
            };
            const response = await post(`${API_URL_ALERTS}/system`, payload);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to create system alert'
            );
        }
    }
);

// 📌 Create Emergency Alert
export const createEmergencyAlert = createAsyncThunk(
    'alerts/createEmergencyAlert',
    async (
        { title, message, urgency, latitude, longitude, radius_km, created_by },
        { rejectWithValue }
    ) => {
        try {
            const payload = {
                title,
                message,
                urgency,
                latitude,
                longitude,
                radius_km,
                created_by,
            };
            const response = await post(`${API_URL_ALERTS}/emergency`, payload);
            return response;
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to create emergency alert'
            );
        }
    }
);

// 📌 Mark Alert as Read
export const markAlertAsRead = createAsyncThunk(
    'alerts/markAlertAsRead',
    async ({ alertId, alertType, userId }, { rejectWithValue }) => {
        try {
            const response = await patch(`${API_URL_ALERTS}/${alertId}/read`, {
                type: alertType,
                userId, // Only needed for system
            });
            return { alertId, response, alertType };
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to mark alert as read'
            );
        }
    }
);

// 📌 Delete Alert
export const deleteAlert = createAsyncThunk(
    'alerts/deleteAlert',
    async (alertId, { rejectWithValue }) => {
        try {
            await del(`${API_URL_ALERTS}/${alertId}`);
            return alertId;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to delete alert');
        }
    }
);

// 📌 Load Pending Actions (mock or real)
export const loadPendingActions = createAsyncThunk(
    'alerts/loadPendingActions',
    async (_, { rejectWithValue }) => {
        try {
            if (DEV_MODE) return mockAlerts.pendingActions || [];
            const response = await get(`${API_URL_ALERTS}/pending-actions`);
            return response?.pendingActions || [];
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to load pending actions'
            );
        }
    }
);

// 📌 Clear Pending Actions (local only)
export const clearPendingActions = () => ({ type: 'CLEAR_PENDING_ACTIONS' });
