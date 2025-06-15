import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    countryCode: 'US',
    customName: '',
    customNumber: '',
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
    },
});

export const {
    setCountryCode,
    setCustomName,
    setCustomNumber,
    setEmergencySettings,
} = emergencySlice.actions;
export default emergencySlice.reducer;
