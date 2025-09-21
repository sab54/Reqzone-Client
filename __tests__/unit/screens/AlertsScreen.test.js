/**
 * AlertScreen.test.js
 *
 * What This Test File Covers:
 *
 * 1) Font Loading
 *    - Shows ActivityIndicator + "Loading fonts..." before fonts are loaded.
 *
 * 2) Data Fetch
 *    - Dispatches fetchWeatherData on mount.
 *
 * 3) Alert Module
 *    - Renders Alert component when fonts loaded.
 *
 * 4) Error Handling
 *    - Displays error block if weather.error present in state.
 *
 * 5) Footer
 *    - Always renders Footer component at the end.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Mocks
jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true]), // default: fonts loaded
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ bottom: 0 })),
}));

// Mock Alert module
jest.mock('../../../src/module/Alert', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ theme }) => <Text testID="alert-module">Alert Module</Text>;
});

// Mock Footer component
jest.mock('../../../src/components/Footer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ theme }) => <Text testID="footer">Footer</Text>;
});

const mockDispatch = jest.fn();

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (sel) =>
      sel({
        theme: { themeColors: { background: '#fff', primary: '#1976d2', text: '#222', danger: 'red' } },
        weather: { error: null },
      }),
  };
});

// expose a controllable action mock
const mockFetchWeather = jest.fn(() => ({ type: 'FETCH_WEATHER' }));
jest.mock('../../../src/store/actions/weatherActions', () => ({
  fetchWeatherData: (...args) => mockFetchWeather(...args),
}));

// Import after mocks
import AlertScreen from '../../../src/screens/AlertsScreen';
import { useFonts } from 'expo-font';
import { fetchWeatherData } from '../../../src/store/actions/weatherActions';

describe('AlertScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

// __tests__/unit/screens/AlertsScreen.test.js
// ...
it('renders loading state when fonts not loaded', () => {
  useFonts.mockReturnValueOnce([false]); // force "fonts not loaded"

  const { getByText } = render(<AlertScreen />);

  // Minimal, version-safe assertion
  expect(getByText(/Loading fonts/i)).toBeTruthy();
});


  it('dispatches fetchWeatherData on mount', () => {
    render(<AlertScreen />);

    expect(mockDispatch).toHaveBeenCalledWith(fetchWeatherData());
    // effects can run twice in React 18 tests; just assert "was called"
    expect(mockFetchWeather).toHaveBeenCalled();
  });

  it('renders Alert module when fonts loaded', () => {
    const { getByTestId } = render(<AlertScreen />);
    expect(getByTestId('alert-module')).toBeTruthy();
  });

  it('renders error block if weather.error present', () => {
    const reactRedux = require('react-redux');
    const originalUseSelector = reactRedux.useSelector;

    // temporarily override to return an error state
    jest.spyOn(reactRedux, 'useSelector').mockImplementation((sel) =>
      sel({
        theme: { themeColors: { background: '#fff', primary: '#1976d2', text: '#222', danger: 'red' } },
        weather: { error: 'Network down' },
      })
    );

    const { getByText } = render(<AlertScreen />);
    expect(getByText(/Weather fetch failed: Network down/)).toBeTruthy();

    // restore
    reactRedux.useSelector.mockImplementation(originalUseSelector);
  });

  it('always renders Footer', () => {
    const { getByTestId } = render(<AlertScreen />);
    expect(getByTestId('footer')).toBeTruthy();
  });
});
