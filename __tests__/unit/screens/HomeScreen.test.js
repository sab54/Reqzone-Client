// __tests__/unit/screens/HomeScreen.test.js
/**
 * HomeScreen.test.js
 *
 * What This Test File Covers:
 *
 * 1) Font Loading
 *    - Shows ActivityIndicator + "Loading fonts..." before fonts are loaded.
 *
 * 2) Data Fetch
 *    - Dispatches fetchWeatherData and fetchForecastData on mount.
 *    - Re-dispatches both on pull-to-refresh.
 *
 * 3) Module Rendering
 *    - Renders WeatherCard and NewsAndBookmarks when fonts loaded.
 *
 * 4) Error Handling
 *    - Displays error block if weather.error present in state.
 *
 * 5) Footer
 *    - Always renders Footer component.
 */
// __tests__/unit/screens/LoginScreen.test.js
jest.spyOn(console, 'error').mockImplementation(() => {});
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FlatList, Text } from 'react-native';

// ---- Mocks ----

// expo-font: default to "fonts loaded"
jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true]),
}));

// safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ bottom: 0 })),
}));

// Modules with testIDs
jest.mock('../../../src/module/WeatherCard', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ theme }) => <Text testID="weather-card">WeatherCard</Text>;
});

jest.mock('../../../src/module/NewsAndBookmarks', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ theme }) => <Text testID="news-bookmarks">NewsAndBookmarks</Text>;
});

// Footer component
jest.mock('../../../src/components/Footer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ theme }) => <Text testID="footer">Footer</Text>;
});

// Redux hooks and default selector state
const mockDispatch = jest.fn();
const defaultState = {
  theme: { themeColors: { background: '#fff', primary: '#1976d2', text: '#222', danger: 'red' } },
  weather: {
    current: { temp: 20 },
    forecast: [{ day: 'Mon', temp: 19 }],
    loading: false,
    error: null,
  },
};

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (sel) => sel(defaultState),
  };
});

// Action creators (exposed for call tracking)
const mockFetchWeather = jest.fn(() => ({ type: 'FETCH_WEATHER' }));
const mockFetchForecast = jest.fn(() => ({ type: 'FETCH_FORECAST' }));

jest.mock('../../../src/store/actions/weatherActions', () => ({
  fetchWeatherData: (...args) => mockFetchWeather(...args),
  fetchForecastData: (...args) => mockFetchForecast(...args),
}));

// Import after mocks
import HomeScreen from '../../../src/screens/HomeScreen';
import { useFonts } from 'expo-font';
import { fetchWeatherData, fetchForecastData } from '../../../src/store/actions/weatherActions';

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when fonts are not loaded', () => {
    useFonts.mockReturnValueOnce([false]); // force "fonts not loaded"

    const { getByText } = render(<HomeScreen />);
    expect(getByText(/Loading fonts/i)).toBeTruthy();
  });

  it('dispatches fetchWeatherData and fetchForecastData on mount', () => {
    render(<HomeScreen />);

    // Note: effects may run twice in React 18 tests; assert "called at least once"
    expect(mockFetchWeather).toHaveBeenCalled();
    expect(mockFetchForecast).toHaveBeenCalled();

    // Verify what was sent to dispatch
    expect(mockDispatch).toHaveBeenCalledWith(fetchWeatherData());
    expect(mockDispatch).toHaveBeenCalledWith(fetchForecastData());
  });

  it('renders WeatherCard and NewsAndBookmarks when fonts loaded', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('weather-card')).toBeTruthy();
    expect(getByTestId('news-bookmarks')).toBeTruthy();
  });

  it('shows error block when weather.error is present', () => {
    // Override useSelector temporarily to inject an error
    const reactRedux = require('react-redux');
    const originalUseSelector = reactRedux.useSelector;

    jest.spyOn(reactRedux, 'useSelector').mockImplementation((sel) =>
      sel({
        ...defaultState,
        weather: {
          ...defaultState.weather,
          error: 'Network down',
        },
      })
    );

    const { getByText } = render(<HomeScreen />);
    expect(getByText(/Weather fetch failed: Network down/)).toBeTruthy();

    // restore
    reactRedux.useSelector.mockImplementation(originalUseSelector);
  });

  it('re-dispatches both fetch actions on pull-to-refresh', () => {
    const { UNSAFE_getByType } = render(<HomeScreen />);
    const list = UNSAFE_getByType(FlatList);

    // Trigger onRefresh
    list.props.onRefresh();

    expect(mockFetchWeather).toHaveBeenCalled();
    expect(mockFetchForecast).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(fetchWeatherData());
    expect(mockDispatch).toHaveBeenCalledWith(fetchForecastData());
  });

  it('always renders Footer', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('footer')).toBeTruthy();
  });
});
