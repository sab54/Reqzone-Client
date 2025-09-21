/**
 * utils.js
 *
 * Collection of utility functions for location services, time formatting,
 * and text handling within the app.
 *
 * Key Functionalities:
 *
 * 1. **getUserLocation**
 *    - Requests foreground location permissions using `expo-location`.
 *    - If granted, retrieves the user’s current coordinates.
 *    - Returns `{ latitude, longitude }`.
 *    - Throws an error if permission is denied.
 *
 * 2. **reverseGeocode**
 *    - Uses the OpenCage Data API to convert latitude/longitude into
 *      human-readable location data.
 *    - Extracts `countryCode` (uppercased) and `region` (region/state/county/city).
 *    - Returns an object:
 *      ```js
 *      {
 *        countryCode: 'US',
 *        region: 'California',
 *        ...components, // raw OpenCage components
 *        hasErrors: false
 *      }
 *      ```
 *    - On error: returns default `{ countryCode: 'GB', region: 'England', hasErrors: true }`.
 *
 * 3. **formatTimeAgo**
 *    - Humanizes the elapsed time since a given date string.
 *    - Returns:
 *      - `"X min ago"` if under 1 hour.
 *      - `"X hr ago"` if under 24 hours.
 *      - `"X days ago"` otherwise.
 *
 * 4. **truncate**
 *    - Trims text to a specified length (default 50 chars).
 *    - Prevents cutting mid-word by removing trailing partial words.
 *    - Appends `"..."` if truncation occurs.
 *    - Returns empty string if input is invalid or empty.
 *
 * 5. **formatTime (default export)**
 *    - Formats a given date into 12-hour clock format.
 *    - Returns `"HH:MM AM/PM"`.
 *    - Returns empty string if date is falsy/invalid.
 *
 * Notes:
 * - Requires `OPENCAGE_API_KEY` defined in `config.js` for reverse geocoding.
 * - Designed for use in chat, alerts, and location-sensitive features.
 * - Handles both happy paths and graceful fallbacks on API/permission errors.
 *
 * Author: Sunidhi Abhange
 */

import axios from 'axios';
import * as Location from 'expo-location';

import { OPENCAGE_API_KEY } from './config';

// Get User's Coordinates via Expo Location API
export const getUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
        throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({});
    return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
    };
};

// Reverse Geocode to Get Country Code from Coordinates
export const reverseGeocode = async (lat, lon) => {
    try {
        const res = await axios.get(
            `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${OPENCAGE_API_KEY}`
        );

        const components = res.data?.results?.[0]?.components || {};

        const countryCode = components.country_code?.toUpperCase() || 'GB';
        const region =
            components.region ||
            components.state ||
            components.county ||
            components.city ||
            '';

        return {
            countryCode,
            region,
            ...components,
            hasErrors: false,
        };
    } catch (error) {
        console.error('Reverse geocoding failed:', error);
        return {
            countryCode: 'GB',
            region: 'England',
            hasErrors: true,
        };
    }
};

export const formatTimeAgo = (dateString) => {
    const time = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - time) / (1000 * 60));
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
    return `${Math.floor(diff / 1440)} days ago`;
};

export const truncate = (text, length = 50) => {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim();
    return trimmed.length > length
        ? trimmed.slice(0, length).replace(/\s+\S*$/, '') + '...'
        : trimmed;
};

export default function formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // convert 0 to 12 for 12-hour format
    const mins = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${mins} ${ampm}`;
}
