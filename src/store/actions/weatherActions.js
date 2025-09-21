/**
 * weatherActions.js
 *
 * Thunks for current weather and 5-day forecast with DEV-mode mocks and
 * 1-hour caching.
 *
 * Helpers:
 * - **isOneHourPassed(lastFetch)**: returns true if `lastFetch` is falsy or older than 1 hour.
 *
 * Exports:
 * - **fetchWeatherData()**
 *   Flow:
 *   1) setWeatherLoading(true), setWeatherError(null).
 *   2) If DEV_MODE → dispatch mockWeatherData and stop.
 *   3) If last fetch < 1h and cache exists → use cached state and stop.
 *   4) Else → getUserLocation(), call OpenWeather `/data/2.5/weather`.
 *   5) Dispatch setWeatherData(data) and setLastWeatherFetch(ISO timestamp).
 *   6) On error → setWeatherError(message).
 *   7) finally → setWeatherLoading(false).
 *
 * - **fetchForecastData()**
 *   Flow:
 *   1) If DEV_MODE → take mockForecastData.list, filter items with '12:00:00',
 *      slice to 5, dispatch setForecastData(daily) and stop.
 *   2) If last fetch < 1h and cached forecast exists → use cached state and stop.
 *   3) Else → getUserLocation(), call OpenWeather `/data/2.5/forecast`.
 *   4) Build `daily` (noon entries, first 5), dispatch setForecastData(daily)
 *      and setLastForecastFetch(ISO timestamp).
 *   5) On error → setWeatherError(message).
 *
 * Notes:
 * - Uses `OPENWEATHER_API_KEY` from config and `getUserLocation()` util.
 * - Caching uses timestamps stored in reducer (`lastWeatherFetch`, `lastForecastFetch`).
 *
 * Author: Sunidhi Abhange
 */

import { DEV_MODE, OPENWEATHER_API_KEY } from '../../utils/config';
import {
    setWeatherData,
    setForecastData,
    setWeatherLoading,
    setWeatherError,
    setLastWeatherFetch,
    setLastForecastFetch,
} from '../reducers/weatherReducer';
import { mockWeatherData, mockForecastData } from '../../data/mockData';
import { getUserLocation } from '../../utils/utils';

// Helper to check if an hour has passed since the last fetch
const isOneHourPassed = (lastFetch) => {
    if (!lastFetch) return true;

    const lastTime = new Date(lastFetch);
    const now = new Date();
    const diffInMs = now - lastTime;
    return diffInMs > 3600000; // 1 hour = 3600000 ms
};

export const fetchWeatherData = () => async (dispatch, getState) => {
    try {
        dispatch(setWeatherLoading(true));
        dispatch(setWeatherError(null));

        const state = getState();
        const lastFetch = state.weather.lastWeatherFetch;

        // If DEV_MODE is true, use mock data
        if (DEV_MODE) {
            dispatch(setWeatherData(mockWeatherData));
            dispatch(setWeatherLoading(false));
            return;
        }

        const shouldFetch = isOneHourPassed(lastFetch);

        if (!shouldFetch) {
            const cached = state.weather.current;
            if (cached) {
                dispatch(setWeatherData(cached));
                dispatch(setWeatherLoading(false));
                return;
            }
        }

        const { latitude, longitude } = await getUserLocation();
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        const data = await res.json();

        dispatch(setWeatherData(data));
        dispatch(setLastWeatherFetch(new Date().toISOString())); // Store last fetch timestamp
    } catch (err) {
        dispatch(setWeatherError(err.message));
    } finally {
        dispatch(setWeatherLoading(false));
    }
};

export const fetchForecastData = () => async (dispatch, getState) => {
    try {
        const state = getState();
        const lastFetch = state.weather.lastForecastFetch;

        // If DEV_MODE is true, use mock data
        if (DEV_MODE) {
            const daily = mockForecastData.list
                .filter((item) => item.dt_txt.includes('12:00:00'))
                .slice(0, 5);
            dispatch(setForecastData(daily));
            return;
        }

        const shouldFetch = isOneHourPassed(lastFetch);

        if (!shouldFetch) {
            const cached = state.weather.forecast;
            if (cached) {
                dispatch(setForecastData(cached));
                return;
            }
        }

        const { latitude, longitude } = await getUserLocation();
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        const data = await res.json();

        const daily = data.list
            .filter((item) => item.dt_txt.includes('12:00:00'))
            .slice(0, 5);

        dispatch(setForecastData(daily));
        dispatch(setLastForecastFetch(new Date().toISOString())); // Store last fetch timestamp
    } catch (err) {
        dispatch(setWeatherError(err.message));
    }
};
