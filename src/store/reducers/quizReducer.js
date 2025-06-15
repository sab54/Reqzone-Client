import { createSlice } from '@reduxjs/toolkit';
import {
    fetchQuizzes,
    getQuizById,
    submitQuiz,
    fetchQuizHistory,
    fetchQuizStats,
    generateQuizAI,
} from '../actions/quizActions';

const initialState = {
    quizzes: [],
    quiz: null, // holds the currently selected quiz (from getQuizById)
    submissionResult: null,
    quizHistory: [],
    quizStats: {},
    loading: false,
    isLoadingQuiz: false, // separate loading state for getQuizById
    error: null,
};

const quizzesSlice = createSlice({
    name: 'quizzes',
    initialState,
    reducers: {
        clearQuizState: (state) => {
            state.quiz = null;
            state.submissionResult = null;
            state.error = null;
        },
        clearQuizSubmissionResult: (state) => {
            state.submissionResult = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // 📌 fetchQuizzes
            .addCase(fetchQuizzes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchQuizzes.fulfilled, (state, action) => {
                state.loading = false;
                state.quizzes = action.payload;
            })
            .addCase(fetchQuizzes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // 📌 getQuizById
            .addCase(getQuizById.pending, (state) => {
                state.isLoadingQuiz = true;
                state.error = null;
            })
            .addCase(getQuizById.fulfilled, (state, action) => {
                state.isLoadingQuiz = false;
                state.quiz = action.payload;
            })
            .addCase(getQuizById.rejected, (state, action) => {
                state.isLoadingQuiz = false;
                state.error = action.payload;
            })

            // 📌 submitQuiz
            .addCase(submitQuiz.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(submitQuiz.fulfilled, (state, action) => {
                state.loading = false;
                state.submissionResult = action.payload;
            })
            .addCase(submitQuiz.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // 📌 fetchQuizHistory
            .addCase(fetchQuizHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchQuizHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.quizHistory = action.payload;
            })
            .addCase(fetchQuizHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // 📌 fetchQuizStats
            .addCase(fetchQuizStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchQuizStats.fulfilled, (state, action) => {
                state.loading = false;
                state.quizStats = action.payload;
            })
            .addCase(fetchQuizStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // 📌 generateQuizAI
            .addCase(generateQuizAI.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(generateQuizAI.fulfilled, (state, action) => {
                state.loading = false;
                state.quizzes.unshift(action.payload); // insert newly created quiz
            })
            .addCase(generateQuizAI.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearQuizState, clearQuizSubmissionResult } =
    quizzesSlice.actions;

export default quizzesSlice.reducer;
