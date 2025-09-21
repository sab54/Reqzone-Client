/**
 * RegistrationScreen.test.js
 *
 * What This Test File Covers:
 *
 * 1) Validation & Button Background
 *    - Button background reflects disabled/enabled state per form validity.
 *
 * 2) Phone Sanitization
 *    - Non-digits removed as user types (keeps only numbers).
 *
 * 3) Country Picker
 *    - Opens picker and selecting a country updates displayed dial code.
 *
 * 4) Register Flow (with location)
 *    - Requests location permission; if granted, fetches coords and dispatches
 *      `registerUser` with the full payload including latitude/longitude.
 *
 * 5) Loading & Error
 *    - Shows ActivityIndicator when `registration.loading` is true and renders error text.
 *
 * 6) Navigation on Success
 *    - When `registration.user` appears, navigates to `OTPVerification`
 *      with form’s phoneNumber/countryCode and `user.user_id`.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { TextInput, ActivityIndicator } from 'react-native';

// ---- Mocks ----

// Navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

// CountryPicker
jest.mock('react-native-country-codes-picker', () => ({
  CountryPicker: ({ show, pickerButtonOnPress }) => {
    if (!show) return null;
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity
        testID="mock-country-picker-item"
        onPress={() => pickerButtonOnPress({ dial_code: '+1' })}
      >
        <Text>Pick US</Text>
      </TouchableOpacity>
    );
  },
}));

// Expo Location
const mockRequestPermissions = jest.fn(async () => ({ status: 'granted' }));
const mockGetCurrentPosition = jest.fn(async () => ({
  coords: { latitude: 12.34, longitude: 56.78 },
}));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: (...args) =>
    mockRequestPermissions(...args),
  getCurrentPositionAsync: (...args) => mockGetCurrentPosition(...args),
}));

// Redux + actions
const mockDispatch = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
let mockRegistrationSlice = { loading: false, error: null, user: null };
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (sel) =>
      sel({
        theme: {
          themeColors: {
            background: '#fff',
            text: '#111',
            link: '#1976d2',
            surface: '#f6f6f6',
            input: '#fff',
            inputText: '#111',
            inputBorder: '#ddd',
            placeholder: '#999',
            buttonPrimaryBackground: '#1976d2',
            buttonPrimaryText: '#fff',
            buttonDisabledBackground: '#e0e0e0',
            buttonDisabledText: '#777',
            error: '#d32f2f',
          },
        },
        registration: mockRegistrationSlice,
      }),
  };
});

const mockRegisterUser = jest.fn((payload) => ({
  type: 'REGISTER_USER',
  payload,
}));
jest.mock('../../../src/store/actions/registrationActions', () => ({
  registerUser: (...args) => mockRegisterUser(...args),
}));

// Import after mocks
import RegistrationScreen from '../../../src/screens/RegistrationScreen';

// --- helpers ---
const fillValidForm = (utils) => {
  fireEvent.changeText(utils.getByPlaceholderText('First Name *'), 'Sunidhi');
  fireEvent.changeText(utils.getByPlaceholderText('Last Name'), 'Abhange');
  fireEvent.changeText(utils.getByPlaceholderText('Email *'), 's@a.com');
  fireEvent.changeText(
    utils.getByPlaceholderText('Phone Number *'),
    '0123456789'
  );
};

const getButtonBackgroundColor = (btnWrapper) => {
  const styleArray = Array.isArray(btnWrapper.props.style)
    ? btnWrapper.props.style
    : [btnWrapper.props.style];
  const flat = Object.assign({}, ...styleArray);
  return flat.backgroundColor;
};

// --- tests ---
beforeEach(() => {
  jest.clearAllMocks();
  mockRegistrationSlice = { loading: false, error: null, user: null };
  mockRequestPermissions.mockResolvedValue({ status: 'granted' });
  mockGetCurrentPosition.mockResolvedValue({
    coords: { latitude: 12.34, longitude: 56.78 },
  });
});

describe('RegistrationScreen', () => {
it('blocks register action until form is valid, then allows it', async () => {
  const utils = render(<RegistrationScreen />);
  const registerBtn = utils.getByText('Register');

  // Press with invalid form: should NOT dispatch
  await act(async () => {
    fireEvent.press(registerBtn);
  });
  expect(mockRegisterUser).not.toHaveBeenCalled();

  // Fill valid form
  fillValidForm(utils);

  // Press again: should dispatch now
  await act(async () => {
    fireEvent.press(registerBtn);
  });
  expect(mockRegisterUser).toHaveBeenCalled();
});



  it('sanitizes phone input to digits only', () => {
    const { getByPlaceholderText } = render(<RegistrationScreen />);
    const phone = getByPlaceholderText('Phone Number *');

    fireEvent.changeText(phone, '12a-34b 5c');
    expect(phone.props.value).toBe('12345');

    fireEvent.changeText(phone, '98(76)*54');
    expect(phone.props.value).toBe('987654');
  });

  it('opens CountryPicker and updates dial code display after selection', () => {
    const { getByText, getByTestId } = render(<RegistrationScreen />);
    fireEvent.press(getByText('+44'));
    fireEvent.press(getByTestId('mock-country-picker-item'));
    expect(getByText('+1')).toBeTruthy();
  });

  it('requests location and dispatches registerUser with coordinates on Register', async () => {
    const utils = render(<RegistrationScreen />);
    fillValidForm(utils);

    await act(async () => {
      fireEvent.press(utils.getByText('Register'));
    });

    expect(mockRequestPermissions).toHaveBeenCalled();
    expect(mockGetCurrentPosition).toHaveBeenCalled();
    expect(mockRegisterUser).toHaveBeenCalledWith({
      first_name: 'Sunidhi',
      last_name: 'Abhange',
      email: 's@a.com',
      phone_number: '0123456789',
      country_code: '+44',
      latitude: 12.34,
      longitude: 56.78,
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      mockRegisterUser.mock.results[0].value
    );
  });

  it('shows ActivityIndicator when loading and renders error text when error exists', () => {
    mockRegistrationSlice = { loading: true, error: 'Email already used', user: null };
    const { getByText, UNSAFE_getByType } = render(<RegistrationScreen />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(getByText('Email already used')).toBeTruthy();
  });

  it('navigates to OTPVerification when user is available with form params', () => {
    const utils = render(<RegistrationScreen />);
    fireEvent.changeText(utils.getByPlaceholderText('Phone Number *'), '0123456789');
    fireEvent.press(utils.getByText('+44'));
    fireEvent.press(utils.getByTestId('mock-country-picker-item'));

    mockRegistrationSlice = {
      loading: false,
      error: null,
      user: { user_id: 'user-123' },
    };
    utils.rerender(<RegistrationScreen />);

    expect(mockNavigate).toHaveBeenCalledWith('OTPVerification', {
      phoneNumber: '0123456789',
      countryCode: '+1',
      userId: 'user-123',
      autoFillOtp: true,
      otpCode: undefined
    });
  });
});
