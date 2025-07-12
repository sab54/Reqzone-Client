import { createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setEmergencySettings } from '../reducers/emergencyReducer';
import { DEV_MODE } from '../../utils/config';
import { mockEmergencySettings } from '../../data/mockData';
import { get, post, del } from '../../utils/api';
import { API_URL_USERS } from '../../utils/apiPaths';

// Load local emergency settings from AsyncStorage (or mock)
export const loadEmergencySettings = () => async (dispatch) => {
    if (DEV_MODE) {
        dispatch(setEmergencySettings(mockEmergencySettings));
        return;
    }

    const name = await AsyncStorage.getItem('emergencyContactName');
    const number = await AsyncStorage.getItem('emergencyContactNumber');
    const country = await AsyncStorage.getItem('emergencyCountry');

    dispatch(
        setEmergencySettings({
            customName: name || '',
            customNumber: number || '',
            countryCode: country || 'US',
        })
    );
};

// Save local emergency settings to AsyncStorage
export const saveEmergencySettings = (settings) => async (dispatch) => {
    if (DEV_MODE) {
        dispatch(setEmergencySettings(settings));
        return;
    }

    const { customName, customNumber, countryCode } = settings;
    await AsyncStorage.setItem('emergencyContactName', customName);
    await AsyncStorage.setItem('emergencyContactNumber', customNumber);
    await AsyncStorage.setItem('emergencyCountry', countryCode);
    dispatch(setEmergencySettings(settings));
};

// ==========================
// 📌 API-connected actions
// ==========================

// GET /emergency-contacts/:userId
export const fetchEmergencyContacts = createAsyncThunk(
    'emergency/fetchContacts',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await get(
                `${API_URL_USERS}/emergency-contacts/${userId}`
            );
            return response.data || [];
        } catch (err) {
            return rejectWithValue(err.message || 'Failed to fetch contacts');
        }
    }
);

// POST /emergency-contacts
export const addEmergencyContact = createAsyncThunk(
    'emergency/addContact',
    async ({ user_id, name, phone_number }, { rejectWithValue }) => {
        try {
            const response = await post(`${API_URL_USERS}/emergency-contacts`, {
                user_id,
                name,
                phone_number,
            });
            return { user_id, name, phone_number }; // you can return full object if backend returns it
        } catch (err) {
            return rejectWithValue(err.message || 'Failed to add contact');
        }
    }
);

// DELETE /emergency-contacts/:id
export const deleteEmergencyContact = createAsyncThunk(
    'emergency/deleteContact',
    async (contactId, { rejectWithValue }) => {
        try {
            await del(`${API_URL_USERS}/emergency-contacts/${contactId}`);
            return contactId;
        } catch (err) {
            return rejectWithValue(err.message || 'Failed to delete contact');
        }
    }
);
