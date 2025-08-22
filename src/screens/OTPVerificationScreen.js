import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Keyboard,
    TouchableWithoutFeedback,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { verifyOtp, requestOtp } from '../store/actions/loginActions';

const OTPVerificationScreen = () => {
    const { themeColors } = useSelector((state) => state.theme);
    const { loading, error, isVerified } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const route = useRoute();
    const { phoneNumber, countryCode, userId, otpCode, autoFillOtp } =
        route.params;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(30);
    const inputs = useRef([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Autofill OTP and auto-verify if flag is true
    useEffect(() => {
        if (autoFillOtp && otpCode && otpCode.length === 6) {
            const otpArray = otpCode.split('');
            setOtp(otpArray);

            // Move focus to the last input or blur all
            const lastIndex = otpArray.findIndex((digit) => digit === '');
            const focusIndex = lastIndex === -1 ? 5 : lastIndex;
            inputs.current[focusIndex]?.focus();

            // Auto-verify
            dispatch(verifyOtp({ user_id: userId, otp_code: otpCode }));
        }
    }, [autoFillOtp, otpCode]);

    // Navigate on success
    useEffect(() => {
        if (isVerified) {
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }
    }, [isVerified]);

    const handleOtpChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 5) {
            inputs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits are filled
        const finalOtp = newOtp.join('');
        if (finalOtp.length === 6 && newOtp.every((d) => d !== '')) {
            dispatch(verifyOtp({ user_id: userId, otp_code: finalOtp }));
        }
    };

    const handleVerify = () => {
        const finalOtp = otp.join('');
        if (finalOtp.length === 6) {
            dispatch(verifyOtp({ user_id: userId, otp_code: finalOtp }));
        } else {
            alert('Please enter a valid 6-digit OTP');
        }
    };

    const handleResend = async () => {
        setOtp(['', '', '', '', '', '']);
        setTimer(30);
        inputs.current[0].focus();

        try {
            await dispatch(
                requestOtp({
                    phone_number: phoneNumber,
                    country_code: countryCode,
                })
            ).unwrap();
        } catch (err) {
            console.error('Failed to resend OTP:', err);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View
                style={[
                    styles.container,
                    { backgroundColor: themeColors.background },
                ]}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text
                        style={[
                            styles.backButtonText,
                            { color: themeColors.link },
                        ]}
                    >
                        ← Back
                    </Text>
                </TouchableOpacity>

                <View style={styles.content}>
                    <Text style={[styles.title, { color: themeColors.title }]}>
                        Verify OTP
                    </Text>
                    <Text
                        style={[styles.subtitle, { color: themeColors.text }]}
                    >
                        Enter the 6-digit code sent to {countryCode}{' '}
                        {phoneNumber}
                    </Text>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputs.current[index] = ref)}
                                style={[
                                    styles.otpBox,
                                    {
                                        borderColor: themeColors.inputBorder,
                                        backgroundColor: themeColors.surface,
                                        color: themeColors.text,
                                    },
                                ]}
                                keyboardType='number-pad'
                                maxLength={1}
                                value={digit}
                                onChangeText={(text) =>
                                    handleOtpChange(text, index)
                                }
                                returnKeyType='done'
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            {
                                backgroundColor:
                                    themeColors.buttonPrimaryBackground,
                            },
                        ]}
                        onPress={handleVerify}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator
                                color={themeColors.buttonPrimaryText}
                            />
                        ) : (
                            <Text
                                style={[
                                    styles.buttonText,
                                    { color: themeColors.buttonPrimaryText },
                                ]}
                            >
                                Verify
                            </Text>
                        )}
                    </TouchableOpacity>

                    {error && (
                        <Text
                            style={{
                                color: themeColors.error,
                                marginTop: 12,
                                fontFamily: 'Poppins',
                                fontSize: 14,
                                textAlign: 'center',
                            }}
                        >
                            {typeof error === 'string'
                                ? error
                                : error?.message || 'An error occurred'}
                        </Text>
                    )}

                    {timer > 0 ? (
                        <Text
                            style={[
                                styles.timerText,
                                { color: themeColors.text },
                            ]}
                        >
                            Resend OTP in {timer} sec
                        </Text>
                    ) : (
                        <TouchableOpacity onPress={handleResend}>
                            <Text
                                style={[
                                    styles.resendText,
                                    { color: themeColors.link },
                                ]}
                            >
                                Resend OTP
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 40 : 60,
        paddingHorizontal: 24,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 40 : 60,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontFamily: 'PoppinsBold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        fontFamily: 'Poppins',
        marginBottom: 32,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    otpBox: {
        width: 48,
        height: 58,
        borderWidth: 1,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 20,
        fontFamily: 'PoppinsBold',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
    },
    buttonText: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
    },
    timerText: {
        marginTop: 20,
        fontSize: 14,
        fontFamily: 'Poppins',
    },
    resendText: {
        marginTop: 20,
        fontSize: 16,
        fontFamily: 'PoppinsBold',
        textDecorationLine: 'underline',
    },
});

export default OTPVerificationScreen;
