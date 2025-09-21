/**
 * OTPVerificationScreen.test.js
 *
 * What This Test File Covers:
 *
 * 1) Auto-fill & Auto-verify
 *    - With route params `{ autoFillOtp: true, otpCode: '123456' }`, inputs prefill
 *      and `verifyOtp` is dispatched with `{ user_id, otp_code }`.
 *
 * 2) Manual Entry Auto-submit
 *    - Typing six digits across the inputs auto-advances focus and dispatches `verifyOtp`.
 *
 * 3) Resend Flow
 *    - After timer reaches 0, tapping "Resend OTP" dispatches `requestOtp`, clears inputs,
 *      and resets the countdown text to "Resend OTP in 30 sec".
 *
 * 4) Loading/Error & Back Nav
 *    - Shows spinner in Verify button when `auth.loading` is true and renders error text
 *      when `auth.error` is present. Back button navigates to "Login".
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { TextInput, ActivityIndicator } from 'react-native';
import * as reactRedux from 'react-redux';

// ---- Mocks ----

// Navigation (mutable params per test) — prefix with "mock" for Jest allowance
let mockRouteParams = {
  phoneNumber: '5551234',
  countryCode: '+44',
  userId: 'user-1',
  otpCode: null,
  autoFillOtp: false,
};
const mockNavigate = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, reset: mockReset }),
  useRoute: () => ({ params: mockRouteParams }),
}));

// Redux hooks
const mockDispatch = jest.fn(() => ({ unwrap: () => Promise.resolve() }));

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
            title: '#000',
            link: '#1976d2',
            surface: '#f6f6f6',
            inputBorder: '#ddd',
            buttonPrimaryBackground: '#1976d2',
            buttonPrimaryText: '#fff',
            error: '#d32f2f',
          },
        },
        auth: { loading: false, error: null, isVerified: false },
      }),
  };
});

// Actions – expose call tracking
const mockVerifyOtp = jest.fn((payload) => ({ type: 'VERIFY_OTP', payload }));
const mockRequestOtp = jest.fn((payload) => ({ type: 'REQUEST_OTP', payload }));

jest.mock('../../../src/store/actions/loginActions', () => ({
  verifyOtp: (...args) => mockVerifyOtp(...args),
  requestOtp: (...args) => mockRequestOtp(...args),
}));

// Import after mocks
import OTPVerificationScreen from '../../../src/screens/OTPVerificationScreen';

// Enable fake timers for countdown behavior
beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  // reset default route params
  mockRouteParams = {
    phoneNumber: '5551234',
    countryCode: '+44',
    userId: 'user-1',
    otpCode: null,
    autoFillOtp: false,
  };
});

const getAllInputs = (utils) => utils.UNSAFE_getAllByType(TextInput);

describe('OTPVerificationScreen', () => {
  it('auto-fills and auto-verifies when route provides otpCode with autoFillOtp', () => {
    mockRouteParams.otpCode = '123456';
    mockRouteParams.autoFillOtp = true;

    render(<OTPVerificationScreen />);

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      user_id: 'user-1',
      otp_code: '123456',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      mockVerifyOtp.mock.results[0].value
    );
  });

  it('auto-submits after manual entry of six digits', () => {
    const utils = render(<OTPVerificationScreen />);
    const inputs = getAllInputs(utils);

    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');
    fireEvent.changeText(inputs[3], '4');
    fireEvent.changeText(inputs[4], '5');
    fireEvent.changeText(inputs[5], '6');

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      user_id: 'user-1',
      otp_code: '123456',
    });
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('shows spinner & error when loading/error and supports back navigation', () => {
    // Override selector for THIS test using a fresh require reference
    const rr = require('react-redux');
    const originalUseSelector = rr.useSelector;
    jest.spyOn(rr, 'useSelector').mockImplementation((sel) =>
      sel({
        theme: {
          themeColors: {
            background: '#fff',
            text: '#111',
            title: '#000',
            link: '#1976d2',
            surface: '#f6f6f6',
            inputBorder: '#ddd',
            buttonPrimaryBackground: '#1976d2',
            buttonPrimaryText: '#fff',
            error: '#d32f2f',
          },
        },
        auth: { loading: true, error: 'Invalid code', isVerified: false },
      })
    );

    const { getByText, UNSAFE_getByType } = render(<OTPVerificationScreen />);

    // Spinner visible (query by component type; roles may not map reliably)
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();

    // Error text rendered
    expect(getByText('Invalid code')).toBeTruthy();

    // Back button navigates to Login
    fireEvent.press(getByText('← Back'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');

    // restore
    rr.useSelector.mockImplementation(originalUseSelector);
  });

  it('resends OTP after timer elapses, clears inputs, and resets countdown', async () => {
    const utils = render(<OTPVerificationScreen />);

    // Fast-forward 31s so the "Resend OTP" button appears
    act(() => {
      jest.advanceTimersByTime(31_000);
    });

    const resend = utils.getByText('Resend OTP');
    fireEvent.press(resend);

    expect(mockRequestOtp).toHaveBeenCalledWith({
      phone_number: '5551234',
      country_code: '+44',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      mockRequestOtp.mock.results[0].value
    );

    const inputs = getAllInputs(utils);
    inputs.forEach((inp) => {
      expect(inp.props.value ?? '').toBe('');
    });

    expect(utils.getByText(/Resend OTP in 30 sec/i)).toBeTruthy();
  });
});
