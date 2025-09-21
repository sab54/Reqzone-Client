/**
 * quizzesActions.js
 *
 * Redux Toolkit async thunks for quizzes: discovery, retrieval, submission,
 * history & stats, and AI generation.
 *
 * Exports:
 * - **fetchQuizzes(userId)**
 *   - GET `${API_URL_QUIZZES}/user/:userId`
 *   - Returns `response.quizzes || []`
 *
 * - **getQuizById(quizId)**
 *   - GET `${API_URL_QUIZZES}/:quizId`
 *   - Returns `response.quiz || null`
 *
 * - **submitQuiz({ quizId, userId, answers })**
 *   - POST `${API_URL_QUIZZES}/:quizId/submit` with `{ user_id, answers }`
 *   - Returns full `response`
 *
 * - **fetchQuizHistory(userId)**
 *   - GET `${API_URL_QUIZZES}/history/:userId`
 *   - Returns `response.history || []`
 *
 * - **fetchQuizStats(quizId)**
 *   - GET `${API_URL_QUIZZES}/:quizId/stats`
 *   - Returns `response.stats || {}`
 *
 * - **generateQuizAI({ topic, difficulty, createdBy, chatId })**
 *   - POST `${API_URL_QUIZZES}/ai-generate`
 *   - Returns `response.quiz`
 *
 * Error Handling:
 * - Each thunk rejects with `error.message` or a user-friendly fallback.
 *
 * Dependencies:
 * - `get`, `post` from `utils/api`
 * - `API_URL_QUIZZES` from `utils/apiPaths`
 *
 * Author: Sunidhi Abhange
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL_QUIZZES } from '../../utils/apiPaths';
import { get, post } from '../../utils/api';

// GET /quizzes - Fetch all active quizzes
export const fetchQuizzes = createAsyncThunk(
    'quizzes/fetchQuizzes',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await get(`${API_URL_QUIZZES}/user/${userId}`);
            return response?.quizzes || [];
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch quizzes');
        }
    }
);

// GET /quizzes/:id - Fetch quiz with questions & options
export const getQuizById = createAsyncThunk(
    'quizzes/getQuizById',
    async (quizId, { rejectWithValue }) => {
        try {
            const response = await get(`${API_URL_QUIZZES}/${quizId}`);
            return response?.quiz || null;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch quiz');
        }
    }
);

// POST /quizzes/:id/submit - Submit quiz answers
export const submitQuiz = createAsyncThunk(
    'quizzes/submitQuiz',
    async ({ quizId, userId, answers }, { rejectWithValue }) => {
        try {
            const payload = {
                user_id: userId,
                answers,
            };
            const response = await post(
                `${API_URL_QUIZZES}/${quizId}/submit`,
                payload
            );
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to submit quiz');
        }
    }
);

// GET /quizzes/history/:user_id - Get user's quiz submission history
export const fetchQuizHistory = createAsyncThunk(
    'quizzes/fetchQuizHistory',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await get(`${API_URL_QUIZZES}/history/${userId}`);
            return response?.history || [];
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to load quiz history'
            );
        }
    }
);

// GET /quizzes/:id/stats - Get aggregated quiz performance
export const fetchQuizStats = createAsyncThunk(
    'quizzes/fetchQuizStats',
    async (quizId, { rejectWithValue }) => {
        try {
            const response = await get(`${API_URL_QUIZZES}/${quizId}/stats`);
            return response?.stats || {};
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to fetch quiz stats'
            );
        }
    }
);

// POST /ai/generate-quiz - Generate a new quiz using AI
export const generateQuizAI = createAsyncThunk(
    'quizzes/generateQuizAI',
    async ({ topic, difficulty, createdBy, chatId }, { rejectWithValue }) => {
        try {
            const response = await post(`${API_URL_QUIZZES}/ai-generate`, {
                topic,
                difficulty,
                createdBy,
                chatId,
            });
            return response?.quiz;
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to generate quiz using AI'
            );
        }
    }
);
