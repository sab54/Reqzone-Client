import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COUNTRY_NUMBERS = {
    US: '911',
    UK: '999',
    IN: '112',
    AU: '000',
    FR: '112',
    DE: '112',
};

const SettingsScreen = ({ theme }) => {
    const [contactName, setContactName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [countryCode, setCountryCode] = useState('US');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const name = await AsyncStorage.getItem('emergencyContactName');
        const number = await AsyncStorage.getItem('emergencyContactNumber');
        const country = await AsyncStorage.getItem('emergencyCountry');

        if (name) setContactName(name);
        if (number) setContactNumber(number);
        if (country) setCountryCode(country);
    };

    const saveSettings = async () => {
        await AsyncStorage.setItem('emergencyContactName', contactName);
        await AsyncStorage.setItem('emergencyContactNumber', contactNumber);
        await AsyncStorage.setItem('emergencyCountry', countryCode);
        Alert.alert('Saved', 'Emergency settings saved successfully.');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.title, { color: theme.title }]}>
                Emergency Settings
            </Text>

            <Text style={[styles.label, { color: theme.text }]}>
                Contact Name
            </Text>
            <TextInput
                style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.text },
                ]}
                value={contactName}
                onChangeText={setContactName}
                placeholder='e.g., Mom'
                placeholderTextColor={theme.text + '66'}
            />

            <Text style={[styles.label, { color: theme.text }]}>
                Contact Number
            </Text>
            <TextInput
                style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.text },
                ]}
                value={contactNumber}
                onChangeText={setContactNumber}
                placeholder='e.g., +1234567890'
                keyboardType='phone-pad'
                placeholderTextColor={theme.text + '66'}
            />

            <Text style={[styles.label, { color: theme.text }]}>
                Your Country
            </Text>
            <TextInput
                style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.text },
                ]}
                value={countryCode}
                onChangeText={setCountryCode}
                placeholder='e.g., US'
                placeholderTextColor={theme.text + '66'}
            />

            <Text style={{ color: theme.text, marginVertical: 10 }}>
                Default Emergency Number:{' '}
                {COUNTRY_NUMBERS[countryCode] || '911'}
            </Text>

            <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
                <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Poppins',
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontFamily: 'Poppins',
        marginTop: 6,
    },
    saveButton: {
        marginTop: 20,
        backgroundColor: '#1976D2',
        padding: 12,
        borderRadius: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontFamily: 'PoppinsBold',
        textAlign: 'center',
    },
});

export default SettingsScreen;
