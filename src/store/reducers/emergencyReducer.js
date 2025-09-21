// src/store/reducers/emergencyReducer.js
/**
 * emergencyReducer.js
 *
 * Manages emergency contact settings and the contact list.
 *
 * State:
 * - `countryCode`: ISO country code for default emergency numbers
 * - `customName` / `customNumber`: user-defined fallback contact
 * - `contacts`: array of emergency contacts (id, name, number, ...)
 * - `loading`: async flag for fetching contacts
 * - `error`: last error message, if any
 *
 * Local reducers:
 * - `setCountryCode(code)` / `setCustomName(name)` / `setCustomNumber(number)`
 * - `setEmergencySettings({ countryCode, customName, customNumber })`
 * - `setContacts(list)` → replace contacts
 * - `addContact(contact)` / `removeContact(id)` → local list edits
 * - `setContactsLoading()` → set loading=true, clear error
 * - `setContactsError(msg)` → set loading=false, set error
 *
 * Thunks (extra reducers):
 * - `fetchEmergencyContacts` (pending/fulfilled/rejected)
 *   - pending → loading=true, error=null
 *   - fulfilled → replace contacts, loading=false, error=null
 *   - rejected → loading=false, set error (defaults to generic string)
 * - `addEmergencyContact.fulfilled` → unshift new contact
 * - `deleteEmergencyContact.fulfilled` → remove contact by id
 *
 * Notes:
 * - Only the fetch flow toggles `loading` automatically; others rely on local setters if needed.
 * - Insert order for new contacts is newest-first due to `unshift`.
 */

import { createSlice } from '@reduxjs/toolkit';
import {
    fetchEmergencyContacts,
    addEmergencyContact,
    deleteEmergencyContact,
} from '../actions/emergencyActions';

const initialState = {
    countryCode: 'US',
    customName: '',
    customNumber: '',
    contacts: [],
    loading: false,
    error: null,
};

const emergencySlice = createSlice({
    name: 'emergency',
    initialState,
    reducers: {
        setCountryCode: (state, action) => {
            state.countryCode = action.payload;
        },
        setCustomName: (state, action) => {
            state.customName = action.payload;
        },
        setCustomNumber: (state, action) => {
            state.customNumber = action.payload;
        },
        setEmergencySettings: (state, action) => {
            const { countryCode, customName, customNumber } = action.payload;
            state.countryCode = countryCode;
            state.customName = customName;
            state.customNumber = customNumber;
        },
        // Manual fallback (optional, still safe to keep)
        setContacts: (state, action) => {
            state.contacts = action.payload;
        },
        addContact: (state, action) => {
            state.contacts.push(action.payload);
        },
        removeContact: (state, action) => {
            state.contacts = state.contacts.filter(
                (c) => c.id !== action.payload
            );
        },
        setContactsLoading: (state) => {
            state.loading = true;
            state.error = null;
        },
        setContactsError: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch contacts
            .addCase(fetchEmergencyContacts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmergencyContacts.fulfilled, (state, action) => {
                state.contacts = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase(fetchEmergencyContacts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch contacts';
            })

            // Add contact
            .addCase(addEmergencyContact.fulfilled, (state, action) => {
                state.contacts.unshift(action.payload);
            })

            // Delete contact
            .addCase(deleteEmergencyContact.fulfilled, (state, action) => {
                state.contacts = state.contacts.filter(
                    (c) => c.id !== action.payload
                );
            });
    },
});

export const {
    setCountryCode,
    setCustomName,
    setCustomNumber,
    setEmergencySettings,
    setContacts,
    addContact,
    removeContact,
    setContactsLoading,
    setContactsError,
} = emergencySlice.actions;

export default emergencySlice.reducer;
