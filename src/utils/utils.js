import axios from 'axios';
import * as Location from 'expo-location';

import { OPENCAGE_API_KEY } from './config';

// 📌 Get User's Coordinates via Expo Location API
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

// 📌 Reverse Geocode to Get Country Code from Coordinates
export const reverseGeocode = async (lat, lon) => {
    try {
        const res = await axios.get(
            `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${OPENCAGE_API_KEY}`
        );

        const countryCode =
            res.data?.results?.[0]?.components?.country_code?.toUpperCase() ||
            'GB';
        return { countryCode };
    } catch (error) {
        console.error('Reverse geocoding failed:', error);
        return { countryCode: 'GB' }; // default fallback
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
