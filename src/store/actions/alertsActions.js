import { createAsyncThunk } from '@reduxjs/toolkit';
import { get, post, patch, del } from '../../utils/api';
import { API_URL_ALERTS } from '../../utils/apiPaths';
import { DEV_MODE } from '../../utils/config';
import { mockAlerts } from '../../data/mockData';
import { parseString } from 'react-native-xml2js';
import { getUserLocation, reverseGeocode } from '../../utils/utils';

const REGION_FEEDS = {
    US: 'https://alerts.weather.gov/cap/us.php?x=0',
    GB: 'https://www.metoffice.gov.uk/public/data/PWSCache/WarningsRSS/Region/UK.xml',
    // Add more countries as needed
};

const normalizeAlertEntry = (entry, country) => {
    if (country === 'US') {
        return {
            title: entry.title,
            summary: entry.summary,
            area: entry['cap:areaDesc'],
            severity: entry['cap:severity'],
            event: entry['cap:event'],
            effective: entry['cap:effective'],
            expires: entry['cap:expires'],
            link: entry.link?.href || entry.id,
            country,
        };
    } else if (country === 'GB') {
        return {
            title: entry.title,
            summary: entry.description,
            area: entry['georss:point'],
            severity: entry['cap:severity'] || 'Unknown',
            event: entry.category?._ || 'Weather Warning',
            effective: entry['cap:effective'],
            expires: entry['cap:expires'],
            link: entry.link,
            country,
        };
    }
    return null;
};

const parseXml = (xml) =>
    new Promise((resolve, reject) => {
        parseString(xml, { explicitArray: false }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });

export const fetchGlobalHazardAlerts = createAsyncThunk(
    'alerts/fetchGlobalHazardAlerts',
    async (_, { rejectWithValue }) => {
        try {
            const { latitude, longitude } = await getUserLocation();
            const { countryCode } = await reverseGeocode(latitude, longitude);

            const feedUrl = REGION_FEEDS[countryCode];

            console.log('feedUrl: ', feedUrl, countryCode);
            if (!feedUrl) {
                throw new Error(`No feed available for ${countryCode}`);
            }

            const res = await fetch(feedUrl);
            const xml = await res.text();
            const parsed = await parseXml(xml);

            console.log('Responce parsed: ', parsed);

            const entries =
                parsed?.feed?.entry || parsed?.rss?.channel?.item || [];
            const entriesArray = Array.isArray(entries) ? entries : [entries];

            const alerts = entriesArray
                .map((entry) => normalizeAlertEntry(entry, countryCode))
                .filter(Boolean)
                .map((alert) => ({ ...alert, source: 'global' }));

            return {
                alerts,
                country: countryCode,
                count: alerts.length,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to fetch global hazard alerts'
            );
        }
    }
);

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
