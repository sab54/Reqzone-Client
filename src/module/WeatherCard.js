// src/components/WeatherCard.js
/**
 * WeatherCard.js
 *
 * A reusable card component that displays current weather conditions,
 * condition-based alerts, and an optional multi-day forecast.
 *
 * Features:
 *  - **Header & Toggle**
 *    - "Weather Overview" header with expand/collapse for forecast.
 *    - Smooth expand/collapse animations (LayoutAnimation).
 *
 *  - **Current Conditions**
 *    - Displays city, temperature (°C/°F toggle), feels-like, humidity, wind speed, and description.
 *    - Uses `MaterialCommunityIcons` for weather condition icons.
 *
 *  - **Unit Switching**
 *    - Switch between Celsius and Fahrenheit with a toggle button.
 *
 *  - **Alerts**
 *    - Uses `createConditionBasedAlerts` (from utils) to generate actionable vs informational alerts.
 *    - Displays severity, description, and optional precautions.
 *    - Falls back to `getCalmFallbackMessage` when no alerts are actionable.
 *
 *  - **Forecast**
 *    - Horizontally scrollable 5-day forecast (dates, icons, temps, and conditions).
 *    - Handles both array input and `{ list: [] }` shape for forecast data.
 *    - Shows loading indicator while forecast is toggling.
 *
 *  - **Loading & Empty State**
 *    - Shows spinner when weather is loading.
 *    - Shows "No weather data available" when no data is present.
 *
 * Props:
 *  - `weatherData` (object): Current weather data (OpenWeather-like shape).
 *  - `forecastData` (array|object): Forecast data (array of days or object with `.list`).
 *  - `loadingWeather` (boolean): Controls loading spinner for current conditions.
 *  - `theme` (object): Theme colors used for background, borders, text, icons, etc.
 *
 * Dependencies:
 *  - `react-native` for UI primitives and animation
 *  - `@expo/vector-icons` (Ionicons, MaterialCommunityIcons)
 *  - `../utils/weatherAlerts` (createConditionBasedAlerts, getAlertIconName, getCalmFallbackMessage)
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  createConditionBasedAlerts,
  getAlertIconName,
  getCalmFallbackMessage,
} from '../utils/weatherAlerts'; // utils path

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WeatherCard = ({ weatherData, forecastData, loadingWeather, theme }) => {
  const [showForecast, setShowForecast] = useState(false);
  const [unit, setUnit] = useState('C');
  const [loadingForecast, setLoadingForecast] = useState(false);

  const toggleForecast = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowForecast((prev) => !prev);
  };

  const convertTemp = (temp) => {
    return unit === 'C'
      ? `${Number(temp).toFixed(1)}°C`
      : `${((Number(temp) * 9) / 5 + 32).toFixed(1)}°F`;
  };

  const getWeatherIcon = (weatherMain) => {
    switch (weatherMain) {
      case 'Clear': return 'weather-sunny';
      case 'Clouds': return 'weather-cloudy';
      case 'Rain': return 'weather-rainy';
      case 'Snow': return 'weather-snowy';
      default: return 'weather-partly-cloudy';
    }
  };

  const hasWeatherData = weatherData?.main && weatherData?.weather?.[0] && weatherData?.name;

  const handleForecastToggle = () => {
    setLoadingForecast(true);
    toggleForecast();
    setTimeout(() => setLoadingForecast(false), 1500);
  };

  // Normalize forecast list (support array or { list: [] })
  const normalizedForecastList = useMemo(() => {
    if (Array.isArray(forecastData)) return forecastData;
    if (Array.isArray(forecastData?.list)) return forecastData.list;
    return [];
  }, [forecastData]);

  // Build alerts
  const derivedAlerts = useMemo(
    () => createConditionBasedAlerts(weatherData, normalizedForecastList),
    [weatherData, normalizedForecastList]
  );

  const actionableAlerts = useMemo(
    () => derivedAlerts.filter((a) => a.severity !== 'Info'),
    [derivedAlerts]
  );
  const informationalAlerts = useMemo(
    () => derivedAlerts.filter((a) => a.severity === 'Info'),
    [derivedAlerts]
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        },
      ]}
    >
      {/* Header + Forecast Toggle */}
      <TouchableOpacity onPress={handleForecastToggle}>
        <View style={styles.headerRow}>
          <Text style={[styles.cardTitle, { color: theme.title }]}>🌤️ Weather Overview</Text>
          <Ionicons
            name={showForecast ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.icon}
            style={styles.expandIcon}
          />
        </View>
      </TouchableOpacity>

      {/* Loading / Content */}
      {loadingWeather ? (
        <ActivityIndicator size="small" color={theme.text} />
      ) : hasWeatherData ? (
        <>
          {/* Current conditions (now shown BEFORE alerts) */}
          <View style={styles.weatherInfoRow}>
            <MaterialCommunityIcons
              name={getWeatherIcon(weatherData.weather[0].main)}
              size={40}
              color={theme.icon}
              style={styles.weatherIcon}
            />
            <View style={styles.weatherDetails}>
              <Text style={[styles.label, { color: theme.text }]}>City: {weatherData.name}</Text>
              <Text style={[styles.label, { color: theme.text }]}>Temp: {convertTemp(weatherData.main.temp)}</Text>
              <Text style={[styles.label, { color: theme.text }]}>
                Feels Like: {convertTemp(weatherData.main.feels_like)}
              </Text>
            </View>
            <View style={styles.weatherDetails}>
              <Text style={[styles.label, { color: theme.text }]}>Humidity: {weatherData.main.humidity}%</Text>
              <Text style={[styles.label, { color: theme.text }]}>Wind Speed: {weatherData.wind.speed} m/s</Text>
              <Text style={[styles.label, { color: theme.mutedText }]}>{weatherData.weather[0].description}</Text>
            </View>
          </View>

          {/* Unit toggle just under current conditions */}
          <TouchableOpacity onPress={() => setUnit(unit === 'C' ? 'F' : 'C')} style={styles.unitToggle}>
            <Text style={[styles.unitToggleText, { color: theme.link }]}>
              Switch to °{unit === 'C' ? 'F' : 'C'}
            </Text>
          </TouchableOpacity>

          {/* Alerts (now AFTER weather display) */}
          <View style={styles.alertsContainer}>
            <Text style={[styles.subTitle, { color: theme.title }]}>⚠️ Alerts</Text>

            {actionableAlerts.length === 0 ? (
              <View style={[styles.alertRow, { backgroundColor: theme.card, borderLeftColor: theme.border }]}>
                <MaterialCommunityIcons
                  name={getAlertIconName('Information')}
                  size={20}
                  color={theme.icon}
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertTitle, { color: theme.text }]}>
                    {getCalmFallbackMessage(weatherData)}
                  </Text>
                  <Text style={[styles.alertDesc, { color: theme.mutedText }]}>
                    General tip: keep basic supplies (water, torch, power bank) handy year-round.
                  </Text>
                  {informationalAlerts.map((a) => (
                    <Text key={a.id} style={[styles.infoNote, { color: theme.mutedText }]}>
                      • {a.title}: {a.description}
                    </Text>
                  ))}
                </View>
              </View>
            ) : (
              actionableAlerts.map((a) => (
                <View
                  key={a.id}
                  style={[
                    styles.alertRow,
                    { backgroundColor: theme.warningBackground, borderLeftColor: theme.warning },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getAlertIconName(a.category)}
                    size={20}
                    color={theme.icon}
                    style={{ marginRight: 8, marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTitle, { color: theme.text }]}>
                      {a.title} <Text style={{ color: theme.mutedText }}>• {a.severity}</Text>
                    </Text>
                    <Text style={[styles.alertDesc, { color: theme.text }]}>{a.description}</Text>
                    {a.precaution ? (
                      <Text style={[styles.alertPrecaution, { color: theme.link }]}>
                        Precaution: {a.precaution}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Forecast (unchanged) */}
          {normalizedForecastList.length > 0 && showForecast && !loadingForecast && (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.subTitle, { color: theme.title }]}>5-Day Forecast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                {normalizedForecastList.map((day, index) => (
                  <View
                    key={`${day.dt || index}`}
                    style={[
                      styles.forecastCard,
                      { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
                    ]}
                  >
                    <Text style={[styles.date, { color: theme.text }]}>
                      {new Date((day.dt || 0) * 1000).toLocaleDateString(undefined, {
                        weekday: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <MaterialCommunityIcons
                      name={getWeatherIcon(day.weather?.[0]?.main || 'Clouds')}
                      size={30}
                      color={theme.icon}
                      style={{ marginVertical: 4 }}
                    />
                    <Text style={[styles.temp, { color: theme.text }]}>{convertTemp(day.main?.temp ?? 0)}</Text>
                    <Text style={[styles.desc, { color: theme.mutedText }]}>{day.weather?.[0]?.main || '—'}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {normalizedForecastList.length > 0 && showForecast && loadingForecast && (
            <ActivityIndicator size="small" color={theme.text} />
          )}
        </>
      ) : (
        <Text style={[styles.label, { color: theme.mutedText }]}>No weather data available.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 20, borderRadius: 12, padding: 20, elevation: 5, borderWidth: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Poppins', marginBottom: 12 },
  expandIcon: { marginLeft: 10 },
  subTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'Poppins', marginBottom: 10 },
  weatherInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between' },
  weatherIcon: { marginRight: 12 },
  weatherDetails: { flex: 1 },
  label: { fontSize: 14, fontFamily: 'Poppins', marginBottom: 4 },
  scrollContainer: { marginTop: 12 },
  forecastCard: { width: 100, borderRadius: 10, padding: 10, marginRight: 10, alignItems: 'center', justifyContent: 'center', elevation: 2, borderWidth: 1 },
  date: { fontSize: 12, fontFamily: 'Poppins' },
  temp: { fontSize: 16, fontWeight: 'bold', fontFamily: 'Poppins' },
  desc: { fontSize: 12, fontFamily: 'Poppins', textAlign: 'center' },
  unitToggle: { alignSelf: 'flex-end', marginTop: 10 },
  unitToggleText: { fontSize: 13, fontFamily: 'Poppins', textDecorationLine: 'underline' },

  // Alerts styling
  alertsContainer: { marginTop: 16, marginBottom: 12 },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 10, borderRadius: 8, borderLeftWidth: 4, marginBottom: 8 },
  alertTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  alertDesc: { fontFamily: 'Poppins', fontSize: 13, lineHeight: 18 },
  alertPrecaution: { fontFamily: 'Poppins', fontSize: 12, fontStyle: 'italic', marginTop: 4, textDecorationLine: 'underline' },
  infoNote: { fontFamily: 'Poppins', fontSize: 12, marginTop: 6 },
  muted: { fontFamily: 'Poppins', fontSize: 13 },
});

export default WeatherCard;
