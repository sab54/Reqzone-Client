/**
 * LoginScreen.test.js
 *
 * What This Test File Covers:
 *
 * 1. Basic Rendering & Prefill
 *    - Renders core inputs/buttons and prefills phone/country code from AsyncStorage.
 *
 * 2. Validation
 *    - Prevents submission while phone number is not 10 digits (asserts no dispatch/navigation even if pressed).
 *
 * 3. Successful OTP Request
 *    - Dispatches requestOtp with correct payload and navigates to OTPVerification on success.
 *
 * 4. Country Picker
 *    - Opens mocked picker and updates selected country code after choosing a country.
 */
// __tests__/unit/screens/LoginScreen.test.js
jest.spyOn(console, 'error').mockImplementation(() => {});

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestOtp } from '@/store/actions/loginActions';
import LoginScreen from '@/screens/LoginScreen';
import { Animated, Keyboard } from 'react-native';

// Patch Animated + Keyboard behaviors to run synchronously and safely
beforeAll(() => {
  jest.spyOn(Animated, 'timing').mockImplementation((value, config) => ({
    start: (cb) => {
      if (value && typeof value.setValue === 'function' && config && typeof config.toValue === 'number') {
        value.setValue(config.toValue);
      }
      if (cb) cb({ finished: true });
    },
  }));

  jest.spyOn(Animated, 'sequence').mockImplementation((anims = []) => ({
    start: (cb) => {
      anims.forEach((a) => a && typeof a.start === 'function' && a.start());
      if (cb) cb({ finished: true });
    },
  }));

  jest.spyOn(Keyboard, 'addListener').mockImplementation(() => ({ remove: jest.fn() }));
  jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

// Mock LinearGradient and BlurView using local requires (no JSX from outer scope)
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  return {
    LinearGradient: ({ children }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock('expo-blur', () => {
  const React = require('react');
  return {
    BlurView: ({ children }) =>
      React.createElement(React.Fragment, null, children),
  };
});

// Mock CountryPicker (uses RN exports safely)
jest.mock('react-native-country-codes-picker', () => {
  const React = require('react');
  const { Text, TouchableOpacity } = require('react-native');

  const CountryPicker = ({ show, pickerButtonOnPress, onBackdropPress }) => {
    if (!show) return null;
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Text, { testID: 'country-picker-title' }, 'CountryPicker'),
      React.createElement(
        TouchableOpacity,
        { onPress: () => pickerButtonOnPress({ dial_code: '+91' }) },
        React.createElement(Text, null, 'Select +91')
      ),
      React.createElement(
        TouchableOpacity,
        { onPress: onBackdropPress },
        React.createElement(Text, null, 'Close Picker')
      )
    );
  };

  return { CountryPicker };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock action creator
jest.mock('@/store/actions/loginActions', () => ({
  requestOtp: jest.fn((payload) => ({ type: 'REQUEST_OTP', payload })),
}));

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

const baseTheme = {
  inputText: '#111',
  surface: '#fafafa',
  input: '#fff',
  inputBorder: '#ddd',
  placeholder: '#aaa',
  buttonPrimaryBackground: '#007bff',
  disabled: '#cccccc',
  buttonPrimaryText: '#ffffff',
  error: '#ff0000',
};

// microtask/timeout flush to silence act() warnings from async effects
const flush = () => new Promise((res) => setTimeout(res, 0));

const setup = async (overrides = {}) => {
  useDispatch.mockReturnValue(mockDispatch);
  useNavigation.mockReturnValue({ navigate: mockNavigate });

  useSelector.mockImplementation((selector) =>
    selector({
      theme: { themeColors: baseTheme },
      auth: { loading: false, error: null, ...overrides },
    })
  );

  AsyncStorage.getItem.mockImplementation(async (key) => {
    if (key === 'countryCode') return null;
    if (key === 'lastPhone') return null;
    return null;
  });

  mockDispatch.mockReturnValue({
    unwrap: jest.fn().mockResolvedValue({ user_id: 'user-123', otp_code: '654321' }),
  });

  const utils = render(<LoginScreen />);

  // Let useEffect + AsyncStorage resolves commit state updates
  await flush();

  return utils;
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders basic UI and prefills from AsyncStorage when available', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce('+1') // countryCode
      .mockResolvedValueOnce('9876543210'); // lastPhone

    const { getByPlaceholderText, getByText, queryByTestId } = await setup();

    // Core UI present
    expect(getByText('+1')).toBeTruthy();
    expect(getByPlaceholderText('Phone Number')).toBeTruthy();
    expect(getByText('➔')).toBeTruthy();

    // Prefill applied after async load
    await waitFor(() => {
      expect(getByText('+1')).toBeTruthy();
      expect(getByPlaceholderText('Phone Number').props.value).toBe('9876543210');
    });

    // Picker closed by default
    expect(queryByTestId('country-picker-title')).toBeNull();
  });

  it('prevents submission while phone number is not 10 digits', async () => {
    const { getByPlaceholderText, getByText } = await setup();

    const input = getByPlaceholderText('Phone Number');
    act(() => {
      fireEvent.changeText(input, '12345'); // invalid length
    });

    // Try pressing the submit arrow anyway
    fireEvent.press(getByText('➔'));

    // No dispatch/navigation should occur
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();

    // Now enter a valid number and ensure press triggers the flow
    act(() => {
      fireEvent.changeText(input, '1234567890');
    });
    await act(async () => {
      fireEvent.press(getByText('➔'));
    });

    expect(requestOtp).toHaveBeenCalledWith({
      phone_number: '1234567890',
      country_code: '+44',
    });
    expect(mockDispatch).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('dispatches requestOtp and navigates on valid submit', async () => {
    const { getByPlaceholderText, getByText } = await setup();

    const input = getByPlaceholderText('Phone Number');
    act(() => {
      fireEvent.changeText(input, '1234567890');
    });

    await act(async () => {
      fireEvent.press(getByText('➔'));
    });

    expect(requestOtp).toHaveBeenCalledWith({
      phone_number: '1234567890',
      country_code: '+44',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'REQUEST_OTP',
        payload: { phone_number: '1234567890', country_code: '+44' },
      })
    );

    expect(mockNavigate).toHaveBeenCalledWith('OTPVerification', {
      phoneNumber: '1234567890',
      countryCode: '+44',
      userId: 'user-123',
      otpCode: '654321',
      autoFillOtp: expect.any(Boolean),
    });
  });

  it('opens CountryPicker and updates selected country code', async () => {
    const { getByText, queryByText } = await setup();

    fireEvent.press(getByText('+44')); // open picker

    expect(getByText('CountryPicker')).toBeTruthy();

    fireEvent.press(getByText('Select +91'));

    await waitFor(() => {
      expect(queryByText('CountryPicker')).toBeNull();
      expect(getByText('+91')).toBeTruthy();
    });
  });
});
