// src/utils/weatherAlerts.js
//
// Deterministic, rule-based dummy alerts derived from OpenWeather fields.
// Realistic signals used:
// - Current: main.temp, main.feels_like, main.humidity, main.pressure, wind.speed, wind.gust, clouds.all, dt, name
// - Forecast (next ~24h): list[].weather[0].id, list[].rain['3h'], list[].snow['3h'], list[].wind.gust, list[].main.temp, list[].main.humidity
//
// Each alert: { id, title, description, category, severity, timestamp, url, precaution }
//
// Notes:
// - Thunderstorms: OpenWeather weather.id 200–232
// - Precip volumes: rain['3h'] / snow['3h'] in millimeters
// - Wind speed/ gusts: meters per second when &units=metric
// - We never "predict" earthquakes/volcanoes from weather; we show an info note instead.

const mm = (v) => (typeof v === 'number' ? v : 0);

const selectNext24h = (forecastList) => {
  // Accept an array of forecast items (3h steps). If you pass a midday-only array, this still works
  // but totals will reflect the available items only.
  if (!Array.isArray(forecastList) || forecastList.length === 0) return [];
  // The OpenWeather 5-day forecast is in 3-hour steps. We just take the first 8 items (~24h).
  return forecastList.slice(0, 8);
};

const sum24h = (arr, keyPath) =>
  selectNext24h(arr).reduce((sum, it) => {
    // keyPath like: ["rain", "3h"] or ["snow", "3h"]
    let v = it;
    for (const k of keyPath) v = v?.[k];
    return sum + mm(v);
  }, 0);

const max24h = (arr, read) =>
  selectNext24h(arr).reduce((m, it) => {
    const v = read(it);
    return Math.max(m, typeof v === 'number' ? v : -Infinity);
  }, -Infinity);

const any24h = (arr, predicate) => selectNext24h(arr).some(predicate);

// Simple heat index-like escalation (very coarse & deterministic):
// - Advisory: temp >= 30°C AND humidity >= 60%
// - Warning:  temp >= 35°C AND humidity >= 50%
const heatSeverity = (t, rh) => {
  if (t >= 35 && rh >= 50) return 'Warning';
  if (t >= 30 && rh >= 60) return 'Advisory';
  return null;
};

export const createConditionBasedAlerts = (weatherData, forecastData = []) => {
  if (!weatherData?.main || !weatherData?.weather?.[0]) return [];

  const nowMs = (weatherData.dt ?? Math.floor(Date.now() / 1000)) * 1000;
  const w = weatherData;
  const list = Array.isArray(forecastData) ? forecastData : (forecastData?.list || []);

  // Current snapshot
  const temp = Number(w.main.temp);            // °C
  const feels = Number(w.main.feels_like);     // °C
  const rh = Number(w.main.humidity);          // %
  const pressure = Number(w.main.pressure);    // hPa
  const wind = Number(w.wind?.speed ?? 0);     // m/s
  const gustNow = Number(w.wind?.gust ?? 0);   // m/s
  const clouds = Number(w.clouds?.all ?? 0);   // %
  const name = w.name || 'your area';

  // Forecast stats (~24h)
  const thunder24 = any24h(list, it => {
    const id = it?.weather?.[0]?.id;
    return typeof id === 'number' && id >= 200 && id < 300;
  });
  const rain3hMax = max24h(list, it => it?.rain?.['3h']);
  const snow3hMax = max24h(list, it => it?.snow?.['3h']);
  const rain24 = sum24h(list, ['rain', '3h']);
  const snow24 = sum24h(list, ['snow', '3h']);
  const gust24Max = max24h(list, it => it?.wind?.gust);
  const minTemp24 = max24h(list, it => -Number(it?.main?.temp ?? Infinity)) * -1 || temp; // trick to get min via max of negatives
  const willDropBelowZero = any24h(list, it => Number(it?.main?.temp ?? 99) <= 0);
  const humid24Max = max24h(list, it => Number(it?.main?.humidity ?? -Infinity));

  // Next-midday approximation (for heat checks)
  const nextMidday = list.find(it => String(it?.dt_txt || '').includes('12:00:00'));
  const middayTemp = nextMidday?.main?.temp ?? temp;
  const middayRh = nextMidday?.main?.humidity ?? rh;

  const alerts = [];

  // --- WIND / GUSTS ---
  // High Wind Warning if sustained ≥15 m/s OR gusts ≥20 m/s (now or within 24h)
  if (wind >= 15 || gustNow >= 20 || gust24Max >= 20) {
    alerts.push({
      id: 'high-wind',
      title: 'High Wind Warning',
      description: `Damaging gusts possible in ${name}. Secure loose items and use caution outdoors.`,
      category: 'Wind',
      severity: 'Warning',
      timestamp: nowMs,
      url: 'https://example.com/learn/high-wind',
      precaution: 'Secure outdoor items, avoid standing under trees; drive carefully on exposed routes.'
    });
  } else if (wind >= 8) {
    alerts.push({
      id: 'wind-advisory',
      title: 'Wind Advisory',
      description: `Breezy conditions (≈ ${wind.toFixed(1)} m/s) expected in ${name}. Lightweight objects may shift.`,
      category: 'Wind',
      severity: 'Advisory',
      timestamp: nowMs,
      url: 'https://example.com/learn/wind-advisory',
      precaution: 'Secure light items and take care on bridges or open roads.'
    });
  }

  // --- LOW PRESSURE / CLOUDS  (general unsettled weather)
  if (pressure <= 1000 && (clouds >= 70 || any24h(list, it => (it?.clouds?.all ?? 0) >= 85))) {
    const maybeFlood = rh >= 85 || rain24 >= 20; // more realistic if quite humid or notable total rain
    alerts.push({
      id: maybeFlood ? 'flood-watch' : 'low-pressure',
      title: maybeFlood ? 'Flood Watch (Low Pressure System)' : 'Low-Pressure System Advisory',
      description: maybeFlood
        ? `Very humid air and/or heavy totals in ${name}. Localized surface water possible in poor drainage.`
        : `Low pressure (≈ ${pressure} hPa) with heavy cloud in ${name}. Showers possible; plan accordingly.`,
      category: maybeFlood ? 'Flood' : 'Weather',
      severity: maybeFlood ? 'Watch' : 'Advisory',
      timestamp: nowMs + 1,
      url: 'https://example.com/learn/low-pressure',
      precaution: maybeFlood
        ? 'Avoid walking/driving through water; move vehicles from flood-prone streets; head to higher ground if needed.'
        : 'Carry a rain layer; allow extra travel time for showers and lower visibility.'
    });
  }

  // --- THUNDERSTORMS ---
  if (thunder24) {
    alerts.push({
      id: 'tstorm-watch',
      title: 'Thunderstorm Watch',
      description: `Model guidance shows thunderstorms within 24 hours near ${name}. Lightning and brief gusts possible.`,
      category: 'Storm',
      severity: 'Watch',
      timestamp: nowMs + 2,
      url: 'https://example.com/learn/thunderstorms',
      precaution: 'Stay indoors during lightning; unplug sensitive electronics; avoid tall isolated trees.'
    });
  }

  // --- HEAVY RAIN / FLOODING ---
  // Thresholds (deterministic, conservative):
  // - 3h heavy rain cell: >= 10 mm in any 3h → Flood Watch
  // - 24h accumulation: >= 25 mm → Flood Watch, >= 40 mm → Flood Warning
  if (rain24 >= 40 || rain3hMax >= 20) {
    alerts.push({
      id: 'flood-warning-rain',
      title: 'Flood Warning (Heavy Rain)',
      description: `Very heavy rain totals expected within 24h in ${name}. Rapid water level rise possible.`,
      category: 'Flood',
      severity: 'Warning',
      timestamp: nowMs + 3,
      url: 'https://example.com/learn/flooding',
      precaution: 'Avoid flood zones; never drive through floodwaters; move valuables above ground level.'
    });
  } else if (rain24 >= 25 || rain3hMax >= 10) {
    alerts.push({
      id: 'flood-watch-rain',
      title: 'Flood Watch (Heavy Rain)',
      description: `Heavy rain expected within 24h in ${name}. Minor flooding possible in low-lying areas.`,
      category: 'Flood',
      severity: 'Watch',
      timestamp: nowMs + 4,
      url: 'https://example.com/learn/flooding',
      precaution: 'Check local drainage; avoid underpasses and low spots; plan alternate travel routes.'
    });
  } else if (rain24 > 0) {
    // Light/steady rain advisory
    alerts.push({
      id: 'rain-advisory',
      title: 'Rain Advisory',
      description: `Showers expected within 24h in ${name}.`,
      category: 'Rain',
      severity: 'Advisory',
      timestamp: nowMs + 5,
      url: 'https://example.com/learn/rain',
      precaution: 'Carry an umbrella; watch for slick roads and reduced visibility.'
    });
  }

  // --- SNOW / WINTER WEATHER ---
  // Thresholds:
  // - 3h heavy snow cell: >= 5 mm water equivalent (roughly 5 cm wet snow) → Winter Storm Watch
  // - 24h accumulation: >= 15 mm → Winter Storm Watch, >= 25 mm → Winter Storm Warning
  if (snow24 >= 25 || snow3hMax >= 10) {
    alerts.push({
      id: 'winter-storm-warning',
      title: 'Winter Storm Warning',
      description: `Heavy snowfall possible within 24h in ${name}. Hazardous travel and reduced visibility likely.`,
      category: 'Snow',
      severity: 'Warning',
      timestamp: nowMs + 6,
      url: 'https://example.com/learn/winter-storm',
      precaution: 'Avoid non-essential travel; carry emergency kit; clear snow safely to prevent overexertion.'
    });
  } else if (snow24 >= 15 || snow3hMax >= 5) {
    alerts.push({
      id: 'winter-storm-watch',
      title: 'Winter Storm Watch',
      description: `Significant snowfall possible within 24h in ${name}. Travel disruptions likely.`,
      category: 'Snow',
      severity: 'Watch',
      timestamp: nowMs + 7,
      url: 'https://example.com/learn/winter-storm',
      precaution: 'Delay travel if possible; keep warm clothing and supplies in vehicles.'
    });
  } else if (snow24 > 0) {
    alerts.push({
      id: 'snow-advisory',
      title: 'Snow Advisory',
      description: `Light snow showers expected within 24h in ${name}. Roads may be slick.`,
      category: 'Snow',
      severity: 'Advisory',
      timestamp: nowMs + 8,
      url: 'https://example.com/learn/snow',
      precaution: 'Drive slowly, increase following distance, and dress warmly.'
    });
  }

  // --- ICE / FREEZING RISK ---
  // If temps at/ below 0°C now or within 24h and there is some precip (rain or snow),
  // or high humidity near freezing → icy surfaces advisory.
  const precipLikely24 = rain24 > 0 || snow24 > 0 || any24h(list, it => mm(it?.rain?.['3h']) > 0 || mm(it?.snow?.['3h']) > 0);
  if ((temp <= 0 || willDropBelowZero || minTemp24 <= 0) && (precipLikely24 || rh >= 80 || humid24Max >= 80)) {
    alerts.push({
      id: 'ice-advisory',
      title: 'Icy Surface Advisory',
      description: `Freezing conditions with moisture in ${name}. Black ice possible on roads and pavements.`,
      category: 'Cold',
      severity: 'Advisory',
      timestamp: nowMs + 9,
      url: 'https://example.com/learn/ice',
      precaution: 'Walk/drive with caution; avoid sudden braking; use salt/grit where available.'
    });
  }

  // --- HEAT STRESS (simple heat-index heuristic) ---
  const hs = heatSeverity(middayTemp, middayRh);
  if (hs) {
    alerts.push({
      id: hs === 'Warning' ? 'heat-warning' : 'heat-advisory',
      title: hs === 'Warning' ? 'Heat Warning' : 'Heat Advisory',
      description:
        hs === 'Warning'
          ? `Dangerously hot conditions expected around midday in ${name}.`
          : `Hot and humid conditions expected around midday in ${name}.`,
      category: 'Heat',
      severity: hs,
      timestamp: nowMs + 10,
      url: 'https://example.com/learn/heat-safety',
      precaution:
        hs === 'Warning'
          ? 'Limit outdoor activity, drink water frequently, seek shade/AC, and check on vulnerable neighbors.'
          : 'Hydrate often, avoid strenuous activity at midday, and take breaks in the shade.'
    });
  }

  // --- BASELINE WIND/WEATHER ALREADY COVERED ABOVE ---

  // --- SEISMIC / VOLCANIC DISCLAIMER (non-predictive) ---
  alerts.push({
    id: 'seismic-info',
    title: 'No Seismic Alerts From Weather',
    description:
      'Earthquakes and volcanic activity are not predictable from weather data. For real seismic alerts, integrate official feeds (e.g., USGS/EMSC/UK monitoring).',
    category: 'Information',
    severity: 'Info',
    timestamp: nowMs + 11,
    url: 'https://example.com/learn/seismic',
    precaution: 'Keep an emergency kit and family plan; follow national seismic agency guidance.'
  });

  return alerts;
};

// Icons for categories (MaterialCommunityIcons)
export const getAlertIconName = (category) => {
  switch (category) {
    case 'Wind': return 'weather-windy';
    case 'Storm': return 'weather-lightning';
    case 'Flood': return 'waves';
    case 'Heat': return 'thermometer';
    case 'Cold': return 'snowflake';
    case 'Fire': return 'fire-alert';
    case 'Snow': return 'weather-snowy-heavy';
    case 'Rain': return 'weather-pouring';
    case 'Information': return 'information-outline';
    case 'Weather': return 'weather-cloudy-alert';
    default: return 'alert-circle-outline';
  }
};

/**
 * Meaningful fallback message when there are no actionable alerts.
 * Uses current "main" condition to produce a clear, reassuring note.
 */
export const getCalmFallbackMessage = (weatherData) => {
  const main = weatherData?.weather?.[0]?.main || 'Clear';
  switch (main) {
    case 'Clear':
      return 'Clear sky → You are safe. No disasters expected.';
    case 'Clouds':
      return 'Cloudy skies, but no severe systems detected.';
    case 'Rain':
      return 'Light rain only. No flooding or storms predicted.';
    case 'Snow':
      return 'Light snow showers. Safe, just dress warmly.';
    case 'Drizzle':
      return 'Drizzle expected. Roads may be slick, but no major risks.';
    case 'Mist':
    case 'Fog':
      return 'Low visibility in fog/mist. Drive carefully; otherwise conditions are stable.';
    default:
      return 'Weather is calm. No alerts in your area.';
  }
};
