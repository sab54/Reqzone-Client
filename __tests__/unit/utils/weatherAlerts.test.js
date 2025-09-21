/**
 * Client/src/utils/__tests__/weatherAlerts.test.js
 *
 * What This Test File Covers:
 *
 * 1) Wind Alerts
 *    - Emits "High Wind Warning" when gusts/mean wind exceed configured thresholds.
 *
 * 2) Flood / Rain Logic
 *    - Emits "Flood Warning (Heavy Rain)" when 24h or 3h rain exceeds warn thresholds.
 *
 * 3) Fog Advisory/Warning
 *    - Emits advisory when visibility low, RH high, and winds light.
 *
 * 4) Heat / Icon / Calm Copy
 *    - Emits heat advisory or warning based on warmest 24h point.
 *    - Maps alert categories to icon names.
 *    - Provides calm fallback copy per OpenWeather "main".
 */

import {
  THRESH,
  FLAGS,
  createConditionBasedAlerts,
  getAlertIconName,
  getCalmFallbackMessage,
} from '../../../src/utils/weatherAlerts';

// Utility to build a single 3h forecast entry
const f3h = ({
  rain3h,
  snow3h,
  gust,
  speed,
  temp,
  humidity,
  pressure,
  clouds,
  weatherId,
}) => ({
  dt: 1, // not used in logic besides ordering
  main: {
    temp,
    humidity,
    pressure,
  },
  wind: {
    speed,
    gust,
  },
  clouds: { all: clouds },
  visibility: 10000,
  weather: [{ id: weatherId, main: 'Rain' }],
  rain: rain3h != null ? { '3h': rain3h } : undefined,
  snow: snow3h != null ? { '3h': snow3h } : undefined,
});

const fixedNow = 1_700_000_000; // stable "now" in seconds for timestamps

describe('weatherAlerts: condition derivation', () => {
  it('emits High Wind Warning when gusts exceed thresholds', () => {
    const weatherData = {
      dt: fixedNow,
      name: 'Testville',
      main: { temp: 12, feels_like: 10, humidity: 70, pressure: 1008 },
      wind: { speed: THRESH.wind.warningMs + 0.1, gust: THRESH.wind.gustWarnMs + 1 }, // exceeds both
      clouds: { all: 40 },
      visibility: 8000,
      weather: [{ id: 801, main: 'Clouds' }],
    };

    const forecast = {
      list: new Array(8).fill(
        f3h({
          gust: THRESH.wind.gustWarnMs + 2,
          speed: THRESH.wind.warningMs + 0.2,
          temp: 12,
          humidity: 70,
          pressure: 1008,
          clouds: 50,
          weatherId: 500,
        })
      ),
    };

    const alerts = createConditionBasedAlerts(weatherData, forecast);
    const windWarn = alerts.find((a) => a.id === 'high-wind');
    expect(windWarn).toBeTruthy();
    expect(windWarn.severity).toBe('Warning');
    expect(windWarn.category).toBe('Wind');
  });

  it('emits Flood Warning when 24h rain exceeds threshold', () => {
    const weatherData = {
      dt: fixedNow,
      name: 'Raintown',
      main: { temp: 14, feels_like: 13, humidity: 95, pressure: 994 }, // low pressure too
      wind: { speed: 3, gust: 5 },
      clouds: { all: 90 },
      visibility: 9000,
      weather: [{ id: 500, main: 'Rain' }],
    };

    // Sum of 8 x 3h rain = 8 * 6 = 48 mm (exceeds THRESH.flood.rain24WarnMm default 40)
    const forecast = {
      list: Array.from({ length: 8 }, () =>
        f3h({
          rain3h: Math.max(6, THRESH.flood.rain24WarnMm / 8 + 1),
          temp: 14,
          humidity: 95,
          pressure: 994,
          clouds: 95,
          weatherId: 500,
        })
      ),
    };

    const alerts = createConditionBasedAlerts(weatherData, forecast);
    const flood = alerts.find((a) => a.id === 'flood-warning-rain');
    expect(flood).toBeTruthy();
    expect(flood.severity).toBe('Warning');
    expect(flood.category).toBe('Flood');

    // Ensure we did NOT also push the lighter "rain-advisory" when floodIssued is true
    const rainAdvisory = alerts.find((a) => a.id === 'rain-advisory');
    expect(rainAdvisory).toBeFalsy();
  });

  it('emits Fog Advisory when visibility is low, RH high, and winds light', () => {
    const weatherData = {
      dt: fixedNow,
      name: 'Fog City',
      main: { temp: 8, feels_like: 7, humidity: Math.max(THRESH.fog.humidityMinPct, 92) },
      wind: { speed: Math.min(THRESH.fog.windMaxMs, 3) },
      clouds: { all: 60 },
      visibility: Math.min(THRESH.fog.visAdvisoryM, 600), // between 200 and 800 -> Advisory
      weather: [{ id: 741, main: 'Fog' }],
    };

    const alerts = createConditionBasedAlerts(weatherData, []); // forecast not needed for fog
    const fog = alerts.find((a) => a.id === 'fog-advisory' || a.id === 'dense-fog-warning');
    expect(fog).toBeTruthy();
    expect(['Advisory', 'Warning']).toContain(fog.severity);
    expect(fog.category).toBe('Weather');
  });

  it('emits Heat Advisory/Warning based on warmest 24h point; icons & calm copy work', () => {
    const weatherData = {
      dt: fixedNow,
      name: 'Warmville',
      main: { temp: 29, feels_like: 30, humidity: 55, pressure: 1005 },
      wind: { speed: 2 },
      clouds: { all: 20 },
      visibility: 10000,
      weather: [{ id: 800, main: 'Clear' }],
    };

    // Make one hot/humid step that triggers at least Advisory; possibly Warning depending on THRESH
    const hotT = Math.max(THRESH.heat.advisoryT + 1, 31);
    const hotRH = Math.max(THRESH.heat.advisoryRH + 5, 65);
    const forecast = {
      list: [
        f3h({ temp: hotT, humidity: hotRH, speed: 2, clouds: 10, pressure: 1006, weatherId: 800 }),
        ...new Array(7).fill(f3h({ temp: 25, humidity: 40, speed: 2, clouds: 10, pressure: 1006, weatherId: 800 })),
      ],
    };

    const alerts = createConditionBasedAlerts(weatherData, forecast);

    const heat = alerts.find((a) => a.category === 'Heat');
    expect(heat).toBeTruthy();
    expect(['Advisory', 'Warning']).toContain(heat.severity);

    // Icon mapping sanity checks
    expect(getAlertIconName('Wind')).toBe('weather-windy');
    expect(getAlertIconName('Flood')).toBe('waves');
    expect(getAlertIconName('Unknown')).toBe('alert-circle-outline');

    // Calm copy (when main == 'Clear')
    expect(getCalmFallbackMessage({ weather: [{ main: 'Clear' }] })).toMatch(/No hazardous weather/i);
  });
});

describe('weatherAlerts: defaults & flags', () => {
  it('wildfire flag gating works (no throw, optional alert appears only when enabled)', () => {
    const weatherData = {
      dt: fixedNow,
      name: 'Drylands',
      main: { temp: THRESH.wildfire.tMinC + 2, feels_like: THRESH.wildfire.tMinC + 2, humidity: THRESH.wildfire.rhMaxPct - 5, pressure: 1008 },
      wind: { speed: THRESH.wildfire.windMinMs + 1 },
      clouds: { all: 5 },
      visibility: 10000,
      weather: [{ id: 800, main: 'Clear' }],
    };

    const alerts = createConditionBasedAlerts(weatherData, []);
    // If FLAGS.enableWildfire is true (default), we should see a wildfire-risk Watch.
    if (FLAGS.enableWildfire) {
      expect(alerts.some((a) => a.id === 'wildfire-risk')).toBe(true);
    } else {
      expect(alerts.some((a) => a.id === 'wildfire-risk')).toBe(false);
    }
  });
});
