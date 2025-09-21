// src/store/reducers/weatherReducer.js
/**
 * weatherReducer.js
 *
 * This slice manages the weather-related state in the Redux store.
 * It handles both current weather data and forecast data, along with
 * request states (loading, error) and caching timestamps.
 *
 * State Shape:
 * - **current** (object | null): The latest fetched current weather data.
 * - **forecast** (array): An array of forecast entries (5-day, 3-hour intervals).
 * - **loading** (boolean): Indicates whether a fetch request is in progress.
 * - **error** (string | null): Stores an error message when fetch fails.
 * - **lastWeatherFetch** (string | null): ISO timestamp of the last current weather fetch.
 * - **lastForecastFetch** (string | null): ISO timestamp of the last forecast fetch.
 *
 * Reducers:
 * - **setWeatherData(payload)**: Stores the current weather object.
 * - **setForecastData(payload)**: Stores the forecast array.
 * - **setWeatherLoading(payload)**: Sets the loading state (true/false).
 * - **setWeatherError(payload)**: Records an error message (string).
 * - **setLastWeatherFetch(payload)**: Saves the last fetch timestamp for current weather.
 * - **setLastForecastFetch(payload)**: Saves the last fetch timestamp for forecast data.
 *
 * Usage:
 * - Imported into the store as `weather` reducer.
 * - Used in `weatherActions.js` thunks to manage data flow and caching.
 *
 * Author: Sunidhi Abhange
 */

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
