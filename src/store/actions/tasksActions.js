import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL_TASKS } from '../../utils/apiPaths';
import { get, post } from '../../utils/api';

/**
 * GET /tasks - Fetch all active checklist tasks
 */
export const fetchTasks = createAsyncThunk(
    'tasks/fetchTasks',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await get(`${API_URL_TASKS}/${userId}`);
            return response?.tasks || [];
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch tasks');
        }
    }
);

/**
 * GET /tasks/progress/:user_id - Get user's completed task IDs
 */
export const fetchTaskProgress = createAsyncThunk(
    'tasks/fetchTaskProgress',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await get(`${API_URL_TASKS}/progress/${userId}`);
            return response?.completedTasks || [];
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch progress');
        }
    }
);

/**
 * POST /tasks/complete - Mark a task as completed by user
 */
export const completeTask = createAsyncThunk(
    'tasks/completeTask',
    async ({ userId, taskId }, { rejectWithValue }) => {
        try {
            const payload = { user_id: userId, task_id: taskId };
            const response = await post(`${API_URL_TASKS}/complete`, payload);
            return { taskId, ...response };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to complete task');
        }
    }
);

/**
 * POST /tasks/uncomplete - Mark a task as not completed
 */
export const uncompleteTask = createAsyncThunk(
    'tasks/uncompleteTask',
    async ({ userId, taskId }, { rejectWithValue }) => {
        try {
            const payload = { user_id: userId, task_id: taskId };
            const response = await post(`${API_URL_TASKS}/uncomplete`, payload);
            return { taskId, ...response };
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to uncomplete task'
            );
        }
    }
);
