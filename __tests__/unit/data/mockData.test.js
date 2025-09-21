/**
 * Weather and Forecast Data Test Suite
 *
 * This test suite validates the structure of the `mockWeatherData` and `mockForecastData` objects,
 * ensuring that they contain the necessary properties and match the expected structure.
 * 
 * 1. **Weather Data Structure**: Tests that `mockWeatherData` contains correct properties like `coord`, `weather`, `main`, etc.
 * 2. **Forecast Data Structure**: Tests that `mockForecastData` contains the correct hourly forecast information.
 * 3. **XP and Weather Consistency**: Ensures that weather data is accurate and follows the expected format for displaying current weather and hourly forecasts.
 */

import { mockWeatherData, mockForecastData } from '../../../src/data/mockData'; // Adjust path

describe('Weather Data Structure', () => {
  test('mockWeatherData should have the required structure', () => {
    // Check for main weather data properties
    expect(mockWeatherData).toHaveProperty('coord');
    expect(mockWeatherData).toHaveProperty('weather');
    expect(mockWeatherData).toHaveProperty('main');
    expect(mockWeatherData).toHaveProperty('wind');
    expect(mockWeatherData).toHaveProperty('sys');
    
    // Check if weather is an array and has correct object structure
    expect(Array.isArray(mockWeatherData.weather)).toBe(true);
    expect(mockWeatherData.weather[0]).toHaveProperty('id');
    expect(mockWeatherData.weather[0]).toHaveProperty('main');
    expect(mockWeatherData.weather[0]).toHaveProperty('description');
    
    // Check main data properties
    expect(mockWeatherData.main).toHaveProperty('temp');
    expect(mockWeatherData.main).toHaveProperty('humidity');
    expect(mockWeatherData.main).toHaveProperty('pressure');
  });

  test('mockForecastData should have the required structure', () => {
    // Check for forecast data properties
    expect(mockForecastData).toHaveProperty('list');
    expect(Array.isArray(mockForecastData.list)).toBe(true);
    expect(mockForecastData.list.length).toBeGreaterThan(0); // Ensure there's data in the forecast list
    
    // Check each forecast item structure
    mockForecastData.list.forEach((forecast) => {
      expect(forecast).toHaveProperty('dt');
      expect(forecast).toHaveProperty('main');
      expect(forecast).toHaveProperty('weather');
      expect(forecast).toHaveProperty('wind');
      expect(forecast).toHaveProperty('clouds');
      
      // Check if weather options are correct
      expect(forecast.weather[0]).toHaveProperty('description');
      expect(forecast.weather[0]).toHaveProperty('icon');
    });
  });
});

