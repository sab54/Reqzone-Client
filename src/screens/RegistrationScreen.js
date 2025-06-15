import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
    ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { CountryPicker } from 'react-native-country-codes-picker';
import { registerUser } from '../store/actions/registrationActions';
import * as Location from 'expo-location'; // 🚀 Replaced Geolocation with expo-location

const RegistrationScreen = () => {
    const { themeColors } = useSelector((state) => state.theme);
    const { loading, error, user } = useSelector((state) => state.registration);
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        countryCode: '+44',
        latitude: null,
        longitude: null,
    });

    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);

    const handleInputChange = (key, value) => {
        setForm({ ...form, [key]: value });
    };

    const validateForm = () => {
        const { firstName, email, phoneNumber } = form;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return (
            firstName.trim() !== '' &&
            email.trim() !== '' &&
            emailRegex.test(email.trim()) &&
            phoneNumber.trim().length === 10
        );
    };

    useEffect(() => {
        setIsFormValid(validateForm());
    }, [form]);

    useEffect(() => {
        if (user) {
            navigation.navigate('OTPVerification', {
                phoneNumber: form.phoneNumber,
                countryCode: form.countryCode,
                userId: user.user_id,
            });
        }
    }, [user]);

    const getLocationAndRegister = async () => {
        let latitude = null;
        let longitude = null;

        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Permission to access location was denied');
            } else {
                let location = await Location.getCurrentPositionAsync({});
                latitude = location.coords.latitude;
                longitude = location.coords.longitude;
            }
        } catch (error) {
            console.error('Failed to get location:', error);
        }

        handleRegister(latitude, longitude);
    };

    const handleRegister = (latitude = null, longitude = null) => {
        if (!isFormValid) return;
        dispatch(
            registerUser({
                first_name: form.firstName,
                last_name: form.lastName,
                email: form.email,
                phone_number: form.phoneNumber,
                country_code: form.countryCode,
                latitude,
                longitude,
            })
        );
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.container,
                        { backgroundColor: themeColors.background },
                    ]}
                >
                    <Text style={[styles.header, { color: themeColors.text }]}>
                        Create Account
                    </Text>

                    <TextInput
                        style={[styles.input, getInputStyle(themeColors)]}
                        placeholder='First Name *'
                        placeholderTextColor={themeColors.placeholder}
                        value={form.firstName}
                        onChangeText={(v) => handleInputChange('firstName', v)}
                    />

                    <TextInput
                        style={[styles.input, getInputStyle(themeColors)]}
                        placeholder='Last Name'
                        placeholderTextColor={themeColors.placeholder}
                        value={form.lastName}
                        onChangeText={(v) => handleInputChange('lastName', v)}
                    />

                    <TextInput
                        style={[styles.input, getInputStyle(themeColors)]}
                        placeholder='Email *'
                        placeholderTextColor={themeColors.placeholder}
                        keyboardType='email-address'
                        autoCapitalize='none'
                        value={form.email}
                        onChangeText={(v) => handleInputChange('email', v)}
                    />

                    <View style={styles.inputButtonContainer}>
                        <TouchableOpacity
                            onPress={() => setShowCountryPicker(true)}
                            style={[
                                styles.countryCodeBox,
                                { backgroundColor: themeColors.surface },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.countryCodeText,
                                    { color: themeColors.text },
                                ]}
                            >
                                {form.countryCode}
                            </Text>
                        </TouchableOpacity>

                        <TextInput
                            style={[
                                styles.phoneInput,
                                {
                                    backgroundColor: themeColors.input,
                                    borderColor: themeColors.inputBorder,
                                    color: themeColors.inputText,
                                },
                            ]}
                            placeholder='Phone Number *'
                            placeholderTextColor={themeColors.placeholder}
                            keyboardType='phone-pad'
                            maxLength={10}
                            value={form.phoneNumber}
                            onChangeText={(v) =>
                                handleInputChange(
                                    'phoneNumber',
                                    v.replace(/[^0-9]/g, '')
                                )
                            }
                        />
                    </View>

                    {error && (
                        <Text
                            style={[
                                styles.errorText,
                                { color: themeColors.error },
                            ]}
                        >
                            {error}
                        </Text>
                    )}

                    <TouchableOpacity
                        onPress={getLocationAndRegister}
                        style={[
                            styles.button,
                            {
                                backgroundColor: isFormValid
                                    ? themeColors.buttonPrimaryBackground
                                    : themeColors.buttonDisabledBackground,
                            },
                        ]}
                        disabled={!isFormValid || loading}
                    >
                        {loading ? (
                            <ActivityIndicator
                                color={themeColors.buttonPrimaryText}
                            />
                        ) : (
                            <Text
                                style={[
                                    styles.buttonText,
                                    {
                                        color: isFormValid
                                            ? themeColors.buttonPrimaryText
                                            : themeColors.buttonDisabledText,
                                    },
                                ]}
                            >
                                Register
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text
                            style={[
                                styles.loginLink,
                                { color: themeColors.link },
                            ]}
                        >
                            Already have an account? Log in
                        </Text>
                    </TouchableOpacity>

                    <CountryPicker
                        show={showCountryPicker}
                        pickerButtonOnPress={(item) => {
                            handleInputChange(
                                'countryCode',
                                `${item.dial_code}`
                            );
                            setShowCountryPicker(false);
                        }}
                        onBackdropPress={() => setShowCountryPicker(false)}
                        style={{
                            modal: {
                                backgroundColor: '#ffffff',
                                height: 400,
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                paddingHorizontal: 16,
                                paddingTop: 20,
                            },
                            backdrop: { backgroundColor: 'rgba(0,0,0,0.6)' },
                            countryButtonStyles: {
                                backgroundColor: '#f0f0f0',
                                borderRadius: 12,
                                marginVertical: 6,
                                paddingVertical: 12,
                                paddingHorizontal: 15,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            },
                            countryNameText: {
                                color: '#000',
                                fontFamily: 'Poppins',
                                fontSize: 16,
                            },
                            dialCodeText: {
                                color: '#000',
                                fontFamily: 'Poppins',
                                fontSize: 14,
                                marginLeft: 10,
                            },
                            searchInput: {
                                backgroundColor: '#f5f5f5',
                                color: '#000',
                                borderColor: '#d0d0d0',
                                borderWidth: 1,
                                fontFamily: 'Poppins',
                                borderRadius: 10,
                                paddingHorizontal: 15,
                                marginBottom: 10,
                                height: 50,
                            },
                            searchMessageText: {
                                color: '#999',
                                fontFamily: 'Poppins',
                                fontSize: 14,
                                textAlign: 'center',
                                marginTop: 20,
                            },
                        }}
                        theme={{
                            backgroundColor: '#ffffff',
                            onBackgroundTextColor: '#000000',
                            textColor: '#000000',
                            subheaderBackgroundColor: '#f5f5f5',
                            filterPlaceholderTextColor: '#aaaaaa',
                            primaryColor: '#007bff',
                            primaryColorVariant: '#0056b3',
                        }}
                        showSearch
                        searchPlaceholder='Search country'
                        showCallingCode
                        searchMessage='No country found'
                        enableModalAvoiding={true}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
};

const getInputStyle = (themeColors) => ({
    backgroundColor: themeColors.input,
    color: themeColors.inputText,
    borderColor: themeColors.inputBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontFamily: 'Poppins',
    fontSize: 16,
    marginBottom: 15,
});

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontFamily: 'PoppinsBold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 50,
    },
    inputButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 55,
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 10,
    },
    countryCodeBox: {
        paddingHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    countryCodeText: {
        fontSize: 16,
        fontFamily: 'Poppins',
    },
    phoneInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 10,
        fontSize: 16,
        fontFamily: 'Poppins',
        borderLeftWidth: 1,
    },
    button: {
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        fontFamily: 'PoppinsBold',
        fontSize: 16,
    },
    loginLink: {
        marginTop: 20,
        fontFamily: 'Poppins',
        fontSize: 14,
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
    errorText: {
        fontFamily: 'Poppins',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 5,
    },
});

export default RegistrationScreen;
