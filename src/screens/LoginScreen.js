import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
    Platform,
    Animated,
    ImageBackground,
    Dimensions,
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { CountryPicker } from 'react-native-country-codes-picker';
import { BlurView } from 'expo-blur';
import { requestOtp } from '../store/actions/loginActions';
import { autoSetOTP } from '../utils/config';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LoginScreen = () => {
    const { themeColors } = useSelector((state) => state.theme);
    const { loading, error } = useSelector((state) => state.auth);
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [selectedCountryCode, setSelectedCountryCode] = useState('+44');
    const inputRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;
    const [keyboardOpen, setKeyboardOpen] = useState(false);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
        loadPhoneNumber();

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
        }).start();

        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => setKeyboardOpen(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => setKeyboardOpen(false)
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const loadPhoneNumber = async () => {
        try {
            const savedCountryCode = await AsyncStorage.getItem('countryCode');
            const savedPhone = await AsyncStorage.getItem('lastPhone');

            if (savedPhone) {
                setPhoneNumber(savedPhone);
            }
            if (savedCountryCode) {
                setSelectedCountryCode(savedCountryCode);
            }
        } catch (e) {
            console.error('Failed to load phone:', e);
        }
    };

    const handleLogin = async () => {
        Keyboard.dismiss();
        setErrorMessage('');

        if (phoneNumber.length !== 10) {
            setErrorMessage('Please enter a valid 10-digit phone number.');
            return;
        }

        try {
            const result = await dispatch(
                requestOtp({
                    phone_number: phoneNumber,
                    country_code: selectedCountryCode,
                })
            ).unwrap();

            navigation.navigate('OTPVerification', {
                phoneNumber,
                countryCode: selectedCountryCode,
                userId: result.user_id,
                otpCode: result.otp_code,
                autoFillOtp: autoSetOTP,
            });
        } catch (err) {
            setErrorMessage(err);
        }
    };

    const handleChangePhone = (text) => {
        const cleanText = text.replace(/[^0-9]/g, '');
        setPhoneNumber(cleanText);
    };

    const animateButtonPress = () => {
        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start(() => handleLogin());
    };

    const isPhoneValid = phoneNumber.length === 10;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Animated.View
                    style={[styles.container, { opacity: fadeAnim }]}
                >
                    <ImageBackground
                        source={require('../assets/login_image.png')}
                        style={styles.backgroundImage}
                        resizeMode='cover'
                    >
                        {keyboardOpen && (
                            <BlurView
                                intensity={40}
                                tint='light'
                                style={StyleSheet.absoluteFillObject}
                            />
                        )}

                        <View style={styles.overlay}>
                            <ScrollView
                                contentContainerStyle={styles.scrollContainer}
                                keyboardShouldPersistTaps='handled'
                            >
                                <View style={styles.loginContainer}>
                                    <View style={styles.inputButtonContainer}>
                                        <TouchableOpacity
                                            onPress={() =>
                                                setShowCountryPicker(true)
                                            }
                                            style={[
                                                styles.countryCodeBox,
                                                {
                                                    backgroundColor:
                                                        themeColors.surface,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.countryCodeText,
                                                    { color: themeColors.text },
                                                ]}
                                            >
                                                {selectedCountryCode}
                                            </Text>
                                        </TouchableOpacity>

                                        <TextInput
                                            ref={inputRef}
                                            style={[
                                                styles.phoneInput,
                                                {
                                                    backgroundColor:
                                                        themeColors.input,
                                                    borderColor:
                                                        themeColors.inputBorder,
                                                    color: themeColors.inputText,
                                                },
                                            ]}
                                            placeholder='Phone Number'
                                            placeholderTextColor={
                                                themeColors.placeholder
                                            }
                                            keyboardType={
                                                Platform.OS === 'ios'
                                                    ? 'number-pad'
                                                    : 'numeric'
                                            }
                                            maxLength={10}
                                            value={phoneNumber}
                                            onChangeText={handleChangePhone}
                                            returnKeyType='done'
                                        />

                                        <TouchableOpacity
                                            onPress={animateButtonPress}
                                            activeOpacity={0.7}
                                            disabled={!isPhoneValid || loading}
                                            style={[
                                                styles.submitButton,
                                                {
                                                    backgroundColor:
                                                        isPhoneValid
                                                            ? themeColors.buttonPrimaryBackground
                                                            : themeColors.disabled,
                                                },
                                            ]}
                                        >
                                            {loading ? (
                                                <ActivityIndicator
                                                    color={
                                                        themeColors.buttonPrimaryText
                                                    }
                                                />
                                            ) : (
                                                <Text
                                                    style={[
                                                        styles.arrowText,
                                                        {
                                                            color: themeColors.buttonPrimaryText,
                                                        },
                                                    ]}
                                                >
                                                    ➔
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    {errorMessage ? (
                                        <Text
                                            style={[
                                                styles.errorText,
                                                { color: themeColors.error },
                                            ]}
                                        >
                                            {typeof errorMessage === 'string'
                                                ? errorMessage
                                                : errorMessage?.message ||
                                                  'Unexpected error'}
                                        </Text>
                                    ) : null}

                                    <TouchableOpacity
                                        onPress={() =>
                                            navigation.navigate('Registration')
                                        }
                                    >
                                        <Text
                                            style={{
                                                marginTop: 20,
                                                fontFamily: 'Poppins',
                                                fontSize: 14,
                                                color: themeColors.inputText,
                                                textDecorationLine: 'underline',
                                            }}
                                        >
                                            Don't have an account? Register
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>

                            <CountryPicker
                                show={showCountryPicker}
                                pickerButtonOnPress={(item) => {
                                    setSelectedCountryCode(`${item.dial_code}`);
                                    setShowCountryPicker(false);
                                }}
                                onBackdropPress={() =>
                                    setShowCountryPicker(false)
                                }
                                style={{
                                    modal: {
                                        backgroundColor: '#ffffff',
                                        height: 400,
                                        borderTopLeftRadius: 20,
                                        borderTopRightRadius: 20,
                                        paddingHorizontal: 16,
                                        paddingTop: 20,
                                    },
                                    backdrop: {
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                    },
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
                                        color: '#000000',
                                        fontFamily: 'Poppins',
                                        fontSize: 16,
                                    },
                                    dialCodeText: {
                                        color: '#000000',
                                        fontFamily: 'Poppins',
                                        fontSize: 14,
                                        marginLeft: 10,
                                    },
                                    searchInput: {
                                        backgroundColor: '#f5f5f5',
                                        color: '#000000',
                                        borderColor: '#d0d0d0',
                                        borderWidth: 1,
                                        fontFamily: 'Poppins',
                                        borderRadius: 10,
                                        paddingHorizontal: 15,
                                        marginBottom: 10,
                                        height: 50,
                                    },
                                    searchMessageText: {
                                        color: '#999999',
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
                        </View>
                    </ImageBackground>
                </Animated.View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    backgroundImage: { flex: 1, width: '100%', height: '100%' },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 30,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    scrollContainer: { flexGrow: 1, justifyContent: 'flex-end' },
    loginContainer: { width: '100%', alignItems: 'center' },
    inputButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 55,
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    countryCodeBox: {
        paddingHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    countryCodeText: { fontSize: 16, fontFamily: 'Poppins' },
    phoneInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 10,
        fontSize: 16,
        fontFamily: 'Poppins',
        borderLeftWidth: 1,
    },
    submitButton: {
        height: '100%',
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowText: { fontSize: 24, fontFamily: 'PoppinsBold' },
    errorText: {
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
        fontFamily: 'Poppins',
    },
});

export default LoginScreen;
