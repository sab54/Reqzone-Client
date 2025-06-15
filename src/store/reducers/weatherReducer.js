import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    current: null,
    forecast: [],
    loading: false,
    error: null,
    lastWeatherFetch: null,
    lastForecastFetch: null,
};

const weatherSlice = createSlice({
    name: 'weather',
    initialState,
    reducers: {
        setWeatherData: (state, action) => {
            state.current = action.payload;
        },
        setForecastData: (state, action) => {
            state.forecast = action.payload;
        },
        setWeatherLoading: (state, action) => {
            state.loading = action.payload;
        },
        setWeatherError: (state, action) => {
            state.error = action.payload;
        },
        setLastWeatherFetch: (state, action) => {
            state.lastWeatherFetch = action.payload;
        },
        setLastForecastFetch: (state, action) => {
            state.lastForecastFetch = action.payload;
        },
    },
});

export const {
    setWeatherData,
    setForecastData,
    setWeatherLoading,
    setWeatherError,
    setLastWeatherFetch,
    setLastForecastFetch,
} = weatherSlice.actions;

export default weatherSlice.reducer;
