import AsyncStorage from '@react-native-async-storage/async-storage';
import { setEmergencySettings } from '../reducers/emergencyReducer';
import { DEV_MODE } from '../../utils/config';
import { mockEmergencySettings } from '../../data/mockData';

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
