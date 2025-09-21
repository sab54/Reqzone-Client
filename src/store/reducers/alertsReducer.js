// src/store/reducers/alertsReducer.js
/**
 * alertsReducer.js
 *
 * Manages three related slices:
 * - **alerts**: user/system alerts with paging flags (`hasMore`, `totalCount`).
 * - **pendingActions**: actionable items the user can toggle/clear.
 * - **globalHazards**: country-scoped hazard alerts with a timestamp.
 *
 * Action handling:
 * - `alerts/fetchUserAlerts` (pending/fulfilled/rejected)
 *   - Loads the full user alerts list in one shot; `totalCount = payload.length`.
 * - `alerts/fetchAlertsData` (pending/fulfilled/rejected)
 *   - Paged fetch; page 1 **replaces** list, page >1 **appends**.
 *   - Also sets `hasMore` and `totalCount` from payload.
 * - `alerts/markAlertAsRead/fulfilled`
 *   - Marks a specific alert (`payload.alertId`) as read (id match).
 * - `alerts/deleteAlert/fulfilled`
 *   - Removes the alert by id and decrements `totalCount` (floored at 0).
 * - `alerts/loadPendingActions` (pending/fulfilled/rejected)
 *   - Manages loading/errors and replaces `pendingActions.data`.
 * - `TOGGLE_ACTION`
 *   - Flips `completed` on a matching pending action by id.
 * - `CLEAR_PENDING_ACTIONS`
 *   - Empties the pending actions list.
 * - `alerts/fetchGlobalHazardAlerts` (pending/fulfilled/rejected)
 *   - Replaces the global hazards block with `{ data, country, timestamp }`.
 *
 * Notes:
 * - Pure reducer; all updates are immutable and replace-only where applicable.
 * - Missing/undefined payloads default to safe fallbacks (e.g., `[]` for lists).
 */

const initialState = {
    alerts: {
        data: [],
        loading: false,
        hasMore: false,
        totalCount: 0,
        error: null,
    },
    pendingActions: {
        data: [],
        loading: false,
        error: null,
    },
    globalHazards: {
        data: [],
        loading: false,
        error: null,
        country: null,
        timestamp: null,
    },
};

const alertsReducer = (state = initialState, action) => {
    switch (action.type) {
        // Alerts Loading
        case 'alerts/fetchUserAlerts/pending':
        case 'alerts/fetchAlertsData/pending':
            return {
                ...state,
                alerts: {
                    ...state.alerts,
                    loading: true,
                    error: null,
                },
            };

        case 'alerts/fetchUserAlerts/fulfilled':
            return {
                ...state,
                alerts: {
                    ...state.alerts,
                    loading: false,
                    data: action.payload || [],
                    hasMore: false,
                    totalCount: action.payload?.length || 0,
                    error: null,
                },
            };

        case 'alerts/fetchAlertsData/fulfilled':
            return {
                ...state,
                alerts: {
                    ...state.alerts,
                    loading: false,
                    data:
                        action.meta.arg.page === 1
                            ? action.payload.alerts
                            : [...state.alerts.data, ...action.payload.alerts],
                    hasMore: action.payload.hasMore ?? false,
                    totalCount: action.payload.totalCount ?? 0,
                    error: null,
                },
            };

        case 'alerts/fetchUserAlerts/rejected':
        case 'alerts/fetchAlertsData/rejected':
            return {
                ...state,
                alerts: {
                    ...state.alerts,
                    loading: false,
                    error: action.payload || 'Error fetching alerts',
                },
            };

        // Mark Alert as Read
        case 'alerts/markAlertAsRead/fulfilled':
            return {
                ...state,
                alerts: {
                    ...state.alerts,
                    data: state.alerts.data.map((alert) =>
                        alert.id === action.payload.alertId
                            ? { ...alert, is_read: true }
                            : alert
                    ),
                },
            };

        // Delete Alert
        case 'alerts/deleteAlert/fulfilled':
            return {
                ...state,
                alerts: {
                    ...state.alerts,
                    data: state.alerts.data.filter(
                        (alert) => alert.id !== action.payload
                    ),
                    totalCount: Math.max(state.alerts.totalCount - 1, 0),
                },
            };

        // Pending Actions Handling
        case 'alerts/loadPendingActions/pending':
            return {
                ...state,
                pendingActions: {
                    ...state.pendingActions,
                    loading: true,
                    error: null,
                },
            };
        case 'alerts/loadPendingActions/fulfilled':
            return {
                ...state,
                pendingActions: {
                    ...state.pendingActions,
                    loading: false,
                    data: action.payload || [],
                    error: null,
                },
            };
        case 'alerts/loadPendingActions/rejected':
            return {
                ...state,
                pendingActions: {
                    ...state.pendingActions,
                    loading: false,
                    error: action.payload || 'Error fetching pending actions',
                },
            };

        // Toggle Action
        case 'TOGGLE_ACTION':
            return {
                ...state,
                pendingActions: {
                    ...state.pendingActions,
                    data: state.pendingActions.data.map((actionItem) =>
                        actionItem.id === action.payload
                            ? {
                                  ...actionItem,
                                  completed: !actionItem.completed,
                              }
                            : actionItem
                    ),
                },
            };

        // Clear Pending Actions
        case 'CLEAR_PENDING_ACTIONS':
            return {
                ...state,
                pendingActions: {
                    ...state.pendingActions,
                    data: [],
                },
            };

        // Global Hazard Alerts
        case 'alerts/fetchGlobalHazardAlerts/pending':
            return {
                ...state,
                globalHazards: {
                    ...state.globalHazards,
                    loading: true,
                    error: null,
                },
            };
        case 'alerts/fetchGlobalHazardAlerts/fulfilled':
            return {
                ...state,
                globalHazards: {
                    loading: false,
                    error: null,
                    data: action.payload.alerts,
                    country: action.payload.country,
                    timestamp: action.payload.timestamp,
                },
            };
        case 'alerts/fetchGlobalHazardAlerts/rejected':
            return {
                ...state,
                globalHazards: {
                    ...state.globalHazards,
                    loading: false,
                    error:
                        action.payload ||
                        'Failed to fetch global hazard alerts',
                },
            };

        default:
            return state;
    }
};

export default alertsReducer;
