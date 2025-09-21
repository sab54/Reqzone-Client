// src/store/reducers/tasksReducer.js
/**
 * tasksReducer.js
 *
 * Manages daily/weekly tasks, their completion state, and progress tracking.
 *
 * State:
 * - `tasks`: array of task objects
 * - `completedTaskIds`: array of task IDs the user has completed
 * - `loading`: true while any async operation is in-flight
 * - `error`: error string if a request failed
 * - `lastCompleted`: the last task object marked completed
 *
 * Reducers:
 * - `clearTaskStatus` → resets `lastCompleted` and clears `error`
 *
 * Extra reducers:
 * - `fetchTasks` → pending/fulfilled/rejected: loads available tasks
 * - `fetchTaskProgress` → pending/fulfilled/rejected: loads completed tasks by ID
 * - `completeTask` → pending/fulfilled/rejected: adds task ID to `completedTaskIds` if not already, sets `lastCompleted`
 * - `uncompleteTask` → pending/fulfilled/rejected: removes task ID from `completedTaskIds`
 *
 * Notes:
 * - Duplicate task completions are ignored (`completedTaskIds` remains unique).
 * - Both `completeTask` and `uncompleteTask` also toggle `loading` and set `error` on rejection.
 */

import { createSlice } from '@reduxjs/toolkit';
import {
    fetchTasks,
    fetchTaskProgress,
    completeTask,
    uncompleteTask,
} from '../actions/tasksActions';

const initialState = {
    tasks: [],
    completedTaskIds: [],
    loading: false,
    error: null,
    lastCompleted: null,
};

const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        clearTaskStatus: (state) => {
            state.lastCompleted = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchTasks
            .addCase(fetchTasks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks = action.payload;
            })
            .addCase(fetchTasks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // fetchTaskProgress
            .addCase(fetchTaskProgress.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTaskProgress.fulfilled, (state, action) => {
                state.loading = false;
                state.completedTaskIds = action.payload.map((t) => t.task_id);
            })
            .addCase(fetchTaskProgress.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // completeTask
            .addCase(completeTask.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(completeTask.fulfilled, (state, action) => {
                state.loading = false;
                const taskId = action.payload.taskId;
                if (!state.completedTaskIds.includes(taskId)) {
                    state.completedTaskIds.push(taskId);
                }
                state.lastCompleted = action.payload;
            })
            .addCase(completeTask.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // uncompleteTask
            .addCase(uncompleteTask.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uncompleteTask.fulfilled, (state, action) => {
                state.loading = false;
                const taskId = action.payload.taskId;
                state.completedTaskIds = state.completedTaskIds.filter(
                    (id) => id !== taskId
                );
            })
            .addCase(uncompleteTask.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearTaskStatus } = tasksSlice.actions;
export default tasksSlice.reducer;
