
// src/store/index.js
/**
 * index.js (Redux Store Configuration)
 *
 * This file defines and configures the Redux store for the application.
 * It centralizes all feature reducers, applies middleware, and sets up
 * Redux DevTools support for debugging in development.
 *
 * Key Responsibilities:
 * - **Reducer Composition**: Combines all slice reducers into a single `rootReducer`.
 * - **Middleware Setup**: Applies Redux Toolkit's default middleware with
 *   `serializableCheck` disabled (required for socket objects and custom functions).
 * - **DevTools Integration**: Enables Redux DevTools extension only in
 *   development mode for easier debugging.
 *
 * Store Structure (state tree):
 * - **Auth**:
 *   - `auth` → loginReducer
 *   - `registration` → registrationReducer
 * - **UI**:
 *   - `theme` → themeReducer
 * - **Features**:
 *   - `chat` → chatReducer
 *   - `weather` → weatherReducer
 *   - `news` → newsReducer
 *   - `bookmarks` → bookmarksReducer
 *   - `documents` → documentsReducer
 *   - `alerts` → alertsReducer
 *   - `emergency` → emergencyReducer
 *   - `gamification` → gamificationReducer
 * - **Games**:
 *   - `quizzes` → quizzesReducer
 *   - `tasks` → tasksReducer
 *   - `badges` → badgesReducer
 *   - `dashboard` → dashboardReducer
 *   - `leaderboard` → leaderboardReducer
 *
 * Notes:
 * - This store is the single source of truth for all global application state.
 * - All reducers should be pure functions and only respond to their slice of the state.
 * - New feature slices must be imported and added to `rootReducer`.
 *
 * Author: Sunidhi Abhange
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';

// Auth-related reducers
import loginReducer from './reducers/loginReducer';
import registrationReducer from './reducers/registrationReducer';

// UI-related
import themeReducer from './reducers/themeReducer';

// Feature modules
import bookmarksReducer from './reducers/bookmarksReducer';
import emergencyReducer from './reducers/emergencyReducer';
import newsReducer from './reducers/newsReducer';
import weatherReducer from './reducers/weatherReducer';
import alertsReducer from './reducers/alertsReducer';
import chatReducer from './reducers/chatReducer';
import gamificationReducer from './reducers/gamificationReducer';
import documentsReducer from './reducers/documentsReducer';

// Game modules
import quizzesReducer from './reducers/quizReducer';
import tasksReducer from './reducers/tasksReducer';
import badgesReducer from './reducers/badgesReducer';
import dashboardReducer from './reducers/dashboardReducer';
import leaderboardReducer from './reducers/leaderboardReducer';

// Combine all feature slices
const rootReducer = combineReducers({
    // Auth
    auth: loginReducer,
    registration: registrationReducer,

    // UI
    theme: themeReducer,

    // Features
    chat: chatReducer,
    weather: weatherReducer,
    news: newsReducer,
    bookmarks: bookmarksReducer,
    documents: documentsReducer,
    alerts: alertsReducer,
    emergency: emergencyReducer,
    gamification: gamificationReducer,

    // Games
    quizzes: quizzesReducer,
    tasks: tasksReducer,
    badges: badgesReducer,
    dashboard: dashboardReducer,
    leaderboard: leaderboardReducer,
});

// Configure the Redux store
const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Needed for socket and custom functions
        }),
    devTools: process.env.NODE_ENV === 'development',
});

export default store;
