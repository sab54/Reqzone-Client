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
