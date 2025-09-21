/**
 * apiUrls.js
 *
 * This module centralizes all API endpoint paths used by the client to interact with the server.
 * By defining them here, we ensure consistency across the app and reduce the risk of typos 
 * or mismatched paths.
 *
 * Key functionalities:
 * - **Chat API**: `/v0.0/chat` – handles messaging, conversations, and related actions.
 * - **Users API**: `/v0.0/users` – manages user accounts, profiles, and authentication-related requests.
 * - **News API**: `/v0.0/news` – provides access to news feeds, announcements, or updates.
 * - **Documents API**: `/v0.0/documents` – supports uploading, fetching, and managing shared documents.
 * - **Tasks API**: `/v0.0/tasks` – covers to-do lists, assignments, and progress tracking.
 * - **Quizzes API**: `/v0.0/quizzes` – exposes quiz data, questions, scoring, and results.
 * - **Dashboard API**: `/v0.0/dashboard` – aggregates statistics and overview data for the user.
 * - **Badges API**: `/v0.0/badges` – handles gamification, earned badges, and related achievements.
 * - **Alerts API**: `/v0.0/alerts` – delivers system alerts, notifications, and warnings.
 *
 * Notes:
 * - These constants should be imported wherever an API call is made, rather than hardcoding URLs inline.
 * - Helps maintain clean separation between business logic and endpoint definitions.
 *
 * Author: Sunidhi Abhange
 */

export const API_URL_CHAT = '/v0.0/chat';
export const API_URL_USERS = '/v0.0/users';
export const API_URL_NEWS = '/v0.0/news';
export const API_URL_DOCUMENTS = '/v0.0/documents';

export const API_URL_TASKS = '/v0.0/tasks';
export const API_URL_QUIZZES = '/v0.0/quizzes';
export const API_URL_DASHBOARD = '/v0.0/dashboard';
export const API_URL_BADGES = '/v0.0/badges';

export const API_URL_ALERTS = '/v0.0/alerts';
