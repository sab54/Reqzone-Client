import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import WeatherCard from '../../../src/module/WeatherCard';

// --- Mock utils ---
jest.mock('../../../src/utils/weatherAlerts', () => ({
  createConditionBasedAlerts: jest.fn(() => []),
  getAlertIconName: jest.fn(() => 'information'),
  getCalmFallbackMessage: jest.fn(() => 'All is calm.'),
}));

import { createConditionBasedAlerts } from '../../../src/utils/weatherAlerts';

// --- Mock icons ---
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));

const theme = {
  surface: '#fff',
  border: '#ddd',
  shadow: '#000',
  title: '#111',
  text: '#222',
  mutedText: '#555',
  icon: '#444',
  link: '#1976d2',
  warningBackground: '#fff3cd',
  warning: '#856404',
  card: '#f8f9fa',
};

const baseWeather = {
  name: 'London',
  main: { temp: 20, feels_like: 18, humidity: 60 },
  wind: { speed: 3 },
  weather: [{ main: 'Clouds', description: 'broken clouds' }],
};

const baseForecast = [
  { dt: 1670000000, main: { temp: 22 }, weather: [{ main: 'Clear' }] },
  { dt: 1670086400, main: { temp: 19 }, weather: [{ main: 'Rain' }] },
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers(); // use fake timers for forecast toggle
});

it('shows spinner when loadingWeather=true', () => {
  const { UNSAFE_getByType } = render(
    <WeatherCard weatherData={null} forecastData={[]} loadingWeather theme={theme} />
  );

  // Query by type instead of testID
  expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
});

it('shows empty state when no weather data', () => {
  const { getByText } = render(
    <WeatherCard weatherData={null} forecastData={[]} loadingWeather={false} theme={theme} />
  );
  expect(getByText(/No weather data available/i)).toBeTruthy();
});

it('renders current conditions and toggles unit °C/°F', () => {
  const { getByText } = render(
    <WeatherCard weatherData={baseWeather} forecastData={[]} loadingWeather={false} theme={theme} />
  );

  expect(getByText(/City: London/)).toBeTruthy();
  expect(getByText(/Temp: 20.0°C/)).toBeTruthy();

  fireEvent.press(getByText(/Switch to °F/));
  expect(getByText(/Temp: 68.0°F/)).toBeTruthy();
});

it('renders calm fallback when no actionable alerts', () => {
  createConditionBasedAlerts.mockReturnValueOnce([]);

  const { getByText } = render(
    <WeatherCard weatherData={baseWeather} forecastData={[]} loadingWeather={false} theme={theme} />
  );

  expect(getByText(/All is calm/)).toBeTruthy();
});

it('renders actionable alerts with severity and precaution', () => {
  createConditionBasedAlerts.mockReturnValueOnce([
    {
      id: '1',
      title: 'Heavy Rain',
      severity: 'Severe',
      description: 'Flooding expected',
      category: 'Rain',
      precaution: 'Avoid low areas',
    },
  ]);

  const { getByText } = render(
    <WeatherCard weatherData={baseWeather} forecastData={[]} loadingWeather={false} theme={theme} />
  );

  expect(getByText(/Heavy Rain/)).toBeTruthy();
  expect(getByText(/Flooding expected/)).toBeTruthy();
  expect(getByText(/Avoid low areas/)).toBeTruthy();
});

it('expands forecast on toggle and renders forecast cards', () => {
  const { getByText, queryByText } = render(
    <WeatherCard weatherData={baseWeather} forecastData={baseForecast} loadingWeather={false} theme={theme} />
  );

  expect(queryByText(/5-Day Forecast/)).toBeNull();

  act(() => {
    fireEvent.press(getByText(/Weather Overview/));
    jest.runAllTimers(); // advance the 1500ms timeout
  });

  expect(getByText(/5-Day Forecast/)).toBeTruthy();
});
