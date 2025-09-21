// src/utils/weatherAlerts.js
/**
 * weatherAlerts.js
 *
 * Deterministic, OpenWeather-only alert derivation and UX helpers.
 *
 * Purpose:
 * - Convert raw OpenWeather "current" + "forecast (3h steps)" objects into a normalized list
 *   of actionable alerts (Advisory/Watch/Warning) using conservative, region-agnostic thresholds.
 * - Provide small presentation helpers for alert icons and calm-state copy.
 *
 * Key exports:
 * - THRESH: Tunable thresholds for wind, pressure, precip, heat/fog/ice, etc. (units: comments inline)
 * - FLAGS:  Feature toggles (e.g., wildfire risk enablement).
 * - createConditionBasedAlerts(weatherData, forecastData?)
 *      -> [{ id, title, description, category, severity, timestamp, url, precaution }]
 *      Inputs:
 *        • weatherData: OpenWeather "current" shape (must include { main, weather[0] }).
 *        • forecastData: Either an OpenWeather "list" array of 3h steps, or the full API object with { list }.
 *      Behavior:
 *        • Considers the first ~24 hours via 8 x 3h steps (next24h).
 *        • Computes 24h sums/max/min for rain/snow/gusts/temp/humidity; evaluates thunder codes (200–232).
 *        • Emits alerts across categories: Wind, Flood, Snow/Cold (incl. ice, wind chill), Heat, Fog, Storm,
 *          Wildfire (opt-in), generic Low-Pressure/Unsettled Weather, and an informational seismic disclaimer.
 *        • Avoids duplicative light precip advisories if heavier alerts were already issued (flood/winter storm).
 *        • Timestamps are anchored to current observation time (weatherData.dt) to keep ordering stable.
 *
 * - getAlertIconName(category)
 *      -> MaterialCommunityIcons icon name for an alert category (fallback: "alert-circle-outline").
 *
 * - getCalmFallbackMessage(weatherData)
 *      -> Short message string for when no hazardous alerts trigger. Uses weather[0].main classification.
 *
 * Units & assumptions:
 * - Wind/gusts in m/s (converted to km/h for copy), rain/snow are liquid-equivalent mm, visibility meters,
 *   pressure hPa, humidity %, temperature in °C (OpenWeather metric).
 *
 * Notes:
 * - This module is deterministic and side-effect free (aside from string building for descriptions).
 * - No I/O; ideal for unit testing and device-offline derivation when API alerts are unavailable.
 *
 * Author: ResQZone Team (Sunidhi Abhange et al.)
 */


// ---------------- Tunable thresholds (conservative & region-agnostic) ----------------
export const THRESH = {
  wind: { advisoryMs: 10, warningMs: 15, gustWarnMs: 20, gustAdvisoryMs: 15 }, // m/s
  lowPressureHpa: 995,                      // Lower gate to reduce false alarms
  cloudsHeavyPct: 85,                       // %
  flood: { rain3hWatchMm: 10, rain3hWarnMm: 20, rain24WatchMm: 25, rain24WarnMm: 40 }, // mm
  snow:  { snow3hWatchMm: 5,  snow3hWarnMm: 10, snow24WatchMm: 15, snow24WarnMm: 25 }, // mm (liquid eq)
  wintryMixPivotC: 2,                       // ≤ => mix/freezing likely
  iceHumidityPct: 80,                       // RH %
  heat: { advisoryT: 30, advisoryRH: 60, warningT: 35, warningRH: 50 }, // °C, %RH
  fog: { visAdvisoryM: 800, visWarningM: 200, humidityMinPct: 90, windMaxMs: 6 }, // meters, %, m/s
  windChill: { advisoryC: -10, warningC: -20 }, // feels-like °C
  wildfire: { rhMaxPct: 25, tMinC: 28, windMinMs: 5 }, // %, °C, m/s
};

// ---------------- Feature flags (optional) ----------------
export const FLAGS = {
  enableWildfire: true,     // Set false for regions where wildfire alerts are not applicable
};

// ---------------- Helpers ----------------
const isFiniteNum = (v) => typeof v === 'number' && Number.isFinite(v);
const mm = (v) => (isFiniteNum(v) ? v : 0);
const msToKmh = (v) => (isFiniteNum(v) ? v * 3.6 : 0);

// Take first ~24h (OpenWeather 3h steps)
const next24h = (list) => (Array.isArray(list) ? list.slice(0, 8) : []);

const sum24h = (list, path) =>
  next24h(list).reduce((sum, it) => {
    let v = it;
    for (const k of path) v = v?.[k];
    return sum + mm(v);
  }, 0);

const max24h = (list, read) => {
  let m = -Infinity;
  for (const it of next24h(list)) {
    const v = read(it);
    if (isFiniteNum(v) && v > m) m = v;
  }
  return m;
};

const min24h = (list, read) => {
  let m = Infinity;
  for (const it of next24h(list)) {
    const v = read(it);
    if (isFiniteNum(v) && v < m) m = v;
  }
  return m;
};

const any24h = (list, pred) => next24h(list).some(pred);

// Simple heat index-like escalation (coarse & deterministic)
const heatSeverity = (t, rh) => {
  if (!isFiniteNum(t) || !isFiniteNum(rh)) return null;
  if (t >= THRESH.heat.warningT && rh >= THRESH.heat.warningRH) return 'Warning';
  if (t >= THRESH.heat.advisoryT && rh >= THRESH.heat.advisoryRH) return 'Advisory';
  return null;
};

// ---------------- Main ----------------
export const createConditionBasedAlerts = (weatherData, forecastData = []) => {
  if (!weatherData?.main || !weatherData?.weather?.[0]) return [];

  const nowMs = (weatherData.dt ?? Math.floor(Date.now() / 1000)) * 1000;
  const w = weatherData;
  const list = Array.isArray(forecastData) ? forecastData : (forecastData?.list || []);

  // Current snapshot
  const temp = Number(w.main.temp);
  const feels = Number(w.main.feels_like);
  const rh = Number(w.main.humidity);
  const pressure = Number(w.main.pressure);
  const wind = Number(w.wind?.speed ?? 0);     // m/s
  const gustNow = Number(w.wind?.gust ?? 0);   // m/s
  const clouds = Number(w.clouds?.all ?? 0);   // %
  const visM = Number(w.visibility ?? NaN);    // meters
  const name = w.name || 'your area';

  // Forecast stats (~24h)
  const thunder24 = any24h(list, it => {
    const id = it?.weather?.[0]?.id;
    return isFiniteNum(id) && id >= 200 && id < 300;
  });
  const rain3hMax = max24h(list, it => it?.rain?.['3h']);
  const snow3hMax = max24h(list, it => it?.snow?.['3h']);
  const rain24 = sum24h(list, ['rain', '3h']);
  const snow24 = sum24h(list, ['snow', '3h']);
  const gust24Max = max24h(list, it => it?.wind?.gust);
  const minTempNext24 = min24h(list, it => Number(it?.main?.temp));
  const willDropBelowZero = isFiniteNum(minTempNext24) ? (minTempNext24 <= 0) : (isFiniteNum(temp) && temp <= 0);
  const humid24Max = max24h(list, it => Number(it?.main?.humidity));

  // Heat source: warmest forecast point in next 24h (fallback to current)
  const warmest = next24h(list).reduce((best, it) => {
    const t = Number(it?.main?.temp);
    const h = Number(it?.main?.humidity);
    return (isFiniteNum(t) && isFiniteNum(h) && (!best || t > best.temp)) ? { temp: t, rh: h } : best;
  }, null) || (isFiniteNum(temp) && isFiniteNum(rh) ? { temp, rh } : null);

  const alerts = [];

  // --- WIND / GUSTS ---
  const highWind = (isFiniteNum(wind) && wind >= THRESH.wind.warningMs)
                || (isFiniteNum(gustNow) && gustNow >= THRESH.wind.gustWarnMs)
                || (isFiniteNum(gust24Max) && gust24Max >= THRESH.wind.gustWarnMs);

  const breezy = (isFiniteNum(wind) && wind >= THRESH.wind.advisoryMs)
              || (isFiniteNum(gustNow) && gustNow >= THRESH.wind.gustAdvisoryMs)
              || (isFiniteNum(gust24Max) && gust24Max >= THRESH.wind.gustAdvisoryMs);

  if (highWind) {
    const peakMs = Math.max(wind, gustNow, gust24Max);
    const peakKmh = Math.round(msToKmh(peakMs));
    alerts.push({
      id: 'high-wind',
      title: 'High Wind Warning',
      description: `Damaging gusts possible in ${name} (peaks ~${peakKmh} km/h). Secure loose items and use caution outdoors.`,
      category: 'Wind',
      severity: 'Warning',
      timestamp: nowMs,
      url: 'https://example.com/learn/high-wind',
      precaution: 'Secure outdoor items, avoid standing under trees; drive carefully on exposed routes.'
    });
  } else if (breezy) {
    const peakMs = Math.max(wind, gustNow, gust24Max);
    const peakKmh = Math.round(msToKmh(peakMs));
    alerts.push({
      id: 'wind-advisory',
      title: 'Wind Advisory',
      description: `Breezy/locally gusty (~${peakKmh} km/h) expected in ${name}. Lightweight objects may shift.`,
      category: 'Wind',
      severity: 'Advisory',
      timestamp: nowMs,
      url: 'https://example.com/learn/wind-advisory',
      precaution: 'Secure light items and take care on bridges or open roads.'
    });
  }

  // --- LOW PRESSURE / HEAVY CLOUDS (unsettled) ---
  const pressureLow = isFiniteNum(pressure) && pressure <= THRESH.lowPressureHpa;
  const veryCloudy = (isFiniteNum(clouds) && clouds >= 70)
                  || any24h(list, it => (it?.clouds?.all ?? 0) >= THRESH.cloudsHeavyPct);
  const notablePrecip = rain24 >= 10 || snow24 >= 10;
  if (pressureLow && (veryCloudy || notablePrecip)) {
    const likelyFlooding = (isFiniteNum(rh) && rh >= 85) || rain24 >= THRESH.flood.rain24WatchMm;
    alerts.push({
      id: likelyFlooding ? 'flood-watch' : 'low-pressure',
      title: likelyFlooding ? 'Flood Watch (Low Pressure System)' : 'Low-Pressure System Advisory',
      description: likelyFlooding
        ? `Very humid air and/or heavy totals in ${name}. Localized surface water possible in poor drainage.`
        : `Low pressure (~${Math.round(pressure)} hPa) with extensive cloud in ${name}. Showers possible; plan accordingly.`,
      category: likelyFlooding ? 'Flood' : 'Weather',
      severity: likelyFlooding ? 'Watch' : 'Advisory',
      timestamp: nowMs + 1,
      url: 'https://example.com/learn/low-pressure',
      precaution: likelyFlooding
        ? 'Avoid walking/driving through water; move vehicles from flood-prone streets; head to higher ground if needed.'
        : 'Carry a rain layer; allow extra travel time for showers and lower visibility.'
    });
  }

  // --- FOG (current only; forecast fog is unreliable without dedicated fields) ---
  if (isFiniteNum(visM) && isFiniteNum(rh) && rh >= THRESH.fog.humidityMinPct && isFiniteNum(wind) && wind <= THRESH.fog.windMaxMs) {
    if (visM <= THRESH.fog.visWarningM) {
      alerts.push({
        id: 'dense-fog-warning',
        title: 'Dense Fog Warning',
        description: `Very low visibility (~${Math.max(visM, 0)} m) in ${name}. Travel delays likely.`,
        category: 'Weather',
        severity: 'Warning',
        timestamp: nowMs + 2,
        url: 'https://example.com/learn/fog',
        precaution: 'Delay travel if possible; use fog lights; maintain longer stopping distances.'
      });
    } else if (visM <= THRESH.fog.visAdvisoryM) {
      alerts.push({
        id: 'fog-advisory',
        title: 'Fog Advisory',
        description: `Reduced visibility (~${Math.max(visM, 0)} m) in ${name}.`,
        category: 'Weather',
        severity: 'Advisory',
        timestamp: nowMs + 3,
        url: 'https://example.com/learn/fog',
        precaution: 'Drive slowly, use low beams/fog lights, and increase following distance.'
      });
    }
  }

  // --- THUNDERSTORMS (forecast codes 200–232) ---
  if (thunder24) {
    alerts.push({
      id: 'tstorm-watch',
      title: 'Thunderstorm Watch',
      description: `Thunderstorms possible within 24 hours near ${name}. Lightning and brief gusts possible.`,
      category: 'Storm',
      severity: 'Watch',
      timestamp: nowMs + 4,
      url: 'https://example.com/learn/thunderstorms',
      precaution: 'Stay indoors during lightning; unplug sensitive electronics; avoid tall isolated trees.'
    });
  }

  // Track whether heavy rain/snow alerts fired to avoid duplicative light advisories
  let floodIssued = false;
  let winterStormIssued = false;

  // --- HEAVY RAIN / FLOODING ---
  if (rain24 >= THRESH.flood.rain24WarnMm || rain3hMax >= THRESH.flood.rain3hWarnMm) {
    floodIssued = true;
    alerts.push({
      id: 'flood-warning-rain',
      title: 'Flood Warning (Heavy Rain)',
      description: `Very heavy rain totals expected within 24h in ${name}. Rapid water level rise possible.`,
      category: 'Flood',
      severity: 'Warning',
      timestamp: nowMs + 5,
      url: 'https://example.com/learn/flooding',
      precaution: 'Avoid flood zones; never drive through floodwaters; move valuables above ground level.'
    });
  } else if (rain24 >= THRESH.flood.rain24WatchMm || rain3hMax >= THRESH.flood.rain3hWatchMm) {
    floodIssued = true;
    alerts.push({
      id: 'flood-watch-rain',
      title: 'Flood Watch (Heavy Rain)',
      description: `Heavy rain expected within 24h in ${name}. Minor flooding possible in low-lying areas.`,
      category: 'Flood',
      severity: 'Watch',
      timestamp: nowMs + 6,
      url: 'https://example.com/learn/flooding',
      precaution: 'Check local drainage; avoid underpasses and low spots; plan alternate travel routes.'
    });
  }

  // --- SNOW / WINTER WEATHER ---
  // OpenWeather snow['3h'] is liquid equivalent (mm). Depth varies (rough 10:1 avg).
  if (snow24 >= THRESH.snow.snow24WarnMm || snow3hMax >= THRESH.snow.snow3hWarnMm) {
    winterStormIssued = true;
    alerts.push({
      id: 'winter-storm-warning',
      title: 'Winter Storm Warning',
      description: `Heavy snowfall (liquid eq) possible within 24h in ${name}. Hazardous travel and reduced visibility likely.`,
      category: 'Snow',
      severity: 'Warning',
      timestamp: nowMs + 7,
      url: 'https://example.com/learn/winter-storm',
      precaution: 'Avoid non-essential travel; carry emergency kit; clear snow safely to prevent overexertion.'
    });
  } else if (snow24 >= THRESH.snow.snow24WatchMm || snow3hMax >= THRESH.snow.snow3hWatchMm) {
    winterStormIssued = true;
    alerts.push({
      id: 'winter-storm-watch',
      title: 'Winter Storm Watch',
      description: `Significant snowfall (liquid eq) possible within 24h in ${name}. Travel disruptions likely.`,
      category: 'Snow',
      severity: 'Watch',
      timestamp: nowMs + 8,
      url: 'https://example.com/learn/winter-storm',
      precaution: 'Delay travel if possible; keep warm clothing and supplies in vehicles.'
    });
  }

  // --- LIGHT/MODERATE PRECIP ADVISORIES (smart split) ---
  if (!floodIssued && rain24 > 0) {
    const nearFreezing = (isFiniteNum(temp) && temp <= THRESH.wintryMixPivotC)
      || willDropBelowZero
      || (isFiniteNum(minTempNext24) && minTempNext24 <= THRESH.wintryMixPivotC);

    if (nearFreezing && snow24 === 0) {
      alerts.push({
        id: 'freezing-rain-advisory',
        title: 'Freezing Rain Advisory',
        description: `Rain with subfreezing temps expected in ${name}. Ice glaze possible.`,
        category: 'Cold',
        severity: 'Advisory',
        timestamp: nowMs + 9,
        url: 'https://example.com/learn/freezing-rain',
        precaution: 'Avoid travel if possible; black ice risk is high on roads and pavements.'
      });
    } else if (nearFreezing) {
      alerts.push({
        id: 'wintry-mix-advisory',
        title: 'Wintry Mix Advisory',
        description: `Mixed precipitation expected in ${name}. Roads may be icy.`,
        category: 'Cold',
        severity: 'Advisory',
        timestamp: nowMs + 10,
        url: 'https://example.com/learn/wintry-mix',
        precaution: 'Drive carefully, watch for icy spots, and allow extra travel time.'
      });
    } else if (!winterStormIssued) {
      alerts.push({
        id: 'rain-advisory',
        title: 'Rain Advisory',
        description: `Showers expected within 24h in ${name}.`,
        category: 'Rain',
        severity: 'Advisory',
        timestamp: nowMs + 11,
        url: 'https://example.com/learn/rain',
        precaution: 'Carry an umbrella; watch for slick roads and reduced visibility.'
      });
    }
  } else if (!floodIssued && !winterStormIssued && snow24 > 0) {
    alerts.push({
      id: 'snow-advisory',
      title: 'Snow Advisory',
      description: `Light snow showers expected within 24h in ${name}. Roads may be slick.`,
      category: 'Snow',
      severity: 'Advisory',
      timestamp: nowMs + 12,
      url: 'https://example.com/learn/snow',
      precaution: 'Drive slowly, increase following distance, and dress warmly.'
    });
  }

  // --- ICE / FREEZING RISK (black ice) ---
  const precipLikely24 = (rain24 > 0) || (snow24 > 0)
    || any24h(list, it => mm(it?.rain?.['3h']) > 0 || mm(it?.snow?.['3h']) > 0);

  if (
    (isFiniteNum(temp) && temp <= 0) || willDropBelowZero || (isFiniteNum(minTempNext24) && minTempNext24 <= 0)
  ) {
    if (precipLikely24 || (isFiniteNum(rh) && rh >= THRESH.iceHumidityPct) || (isFiniteNum(humid24Max) && humid24Max >= THRESH.iceHumidityPct)) {
      alerts.push({
        id: 'ice-advisory',
        title: 'Icy Surface Advisory',
        description: `Freezing conditions with moisture in ${name}. Black ice possible on roads and pavements.`,
        category: 'Cold',
        severity: 'Advisory',
        timestamp: nowMs + 13,
        url: 'https://example.com/learn/ice',
        precaution: 'Walk/drive with caution; avoid sudden braking; use salt/grit where available.'
      });
    }
  }

  // --- WIND CHILL escalations ---
  if (isFiniteNum(feels)) {
    if (feels <= THRESH.windChill.warningC) {
      alerts.push({
        id: 'wind-chill-warning',
        title: 'Wind Chill Warning',
        description: `Dangerously cold wind chills (feels like ${feels.toFixed(1)}°C) in ${name}.`,
        category: 'Cold',
        severity: 'Warning',
        timestamp: nowMs + 14,
        url: 'https://example.com/learn/wind-chill',
        precaution: 'Limit outdoor exposure; cover skin; watch for frostbite and hypothermia.'
      });
    } else if (feels <= THRESH.windChill.advisoryC) {
      alerts.push({
        id: 'wind-chill-advisory',
        title: 'Wind Chill Advisory',
        description: `Very cold wind chills (feels like ${feels.toFixed(1)}°C) in ${name}.`,
        category: 'Cold',
        severity: 'Advisory',
        timestamp: nowMs + 15,
        url: 'https://example.com/learn/wind-chill',
        precaution: 'Dress in layers, cover extremities, and limit time outdoors.'
      });
    }
  }

  // --- HEAT STRESS (simple heat-index heuristic) ---
  if (warmest) {
    const hs = heatSeverity(warmest.temp, warmest.rh);
    if (hs) {
      alerts.push({
        id: hs === 'Warning' ? 'heat-warning' : 'heat-advisory',
        title: hs === 'Warning' ? 'Heat Warning' : 'Heat Advisory',
        description: hs === 'Warning'
          ? `Dangerously hot (peak ~${Math.round(warmest.temp)}°C, RH ~${Math.round(warmest.rh)}%) expected in ${name}.`
          : `Hot and humid (peak ~${Math.round(warmest.temp)}°C, RH ~${Math.round(warmest.rh)}%) expected in ${name}.`,
        category: 'Heat',
        severity: hs,
        timestamp: nowMs + 16,
        url: 'https://example.com/learn/heat-safety',
        precaution: hs === 'Warning'
          ? 'Limit outdoor activity, drink water frequently, seek shade/AC, and check on vulnerable neighbors.'
          : 'Hydrate often, avoid strenuous activity at midday, and take breaks in the shade.'
      });
    }
  }

  // --- WILDFIRE risk (hot/dry/breezy) ---
  if (FLAGS.enableWildfire && isFiniteNum(rh) && isFiniteNum(temp) && isFiniteNum(wind)) {
    if (rh <= THRESH.wildfire.rhMaxPct && temp >= THRESH.wildfire.tMinC && wind >= THRESH.wildfire.windMinMs) {
      alerts.push({
        id: 'wildfire-risk',
        title: 'Elevated Wildfire Risk',
        description: `Very dry air with warmth and breeze in ${name}.`,
        category: 'Fire',
        severity: 'Watch',
        timestamp: nowMs + 17,
        url: 'https://example.com/learn/wildfire-safety',
        precaution: 'Avoid outdoor burning/sparks; prepare a go-bag; monitor official updates.'
      });
    }
  }

  // --- SEISMIC / VOLCANIC DISCLAIMER (informational only) ---
  alerts.push({
    id: 'seismic-info',
    title: 'No Seismic Alerts From Weather',
    description:
      'Earthquakes and volcanic activity are not predictable from weather data. For real seismic alerts, integrate official feeds (e.g., USGS/EMSC/UK monitoring).',
    category: 'Information',
    severity: 'Info',
    timestamp: nowMs + 18,
    url: 'https://example.com/learn/seismic',
    precaution: 'Keep an emergency kit and family plan; follow national seismic agency guidance.'
  });

  return alerts;
};

// ---------------- Icons (MaterialCommunityIcons) ----------------
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

// ---------------- Calm state copy ----------------
export const getCalmFallbackMessage = (weatherData) => {
  const main = weatherData?.weather?.[0]?.main || 'Clear';
  switch (main) {
    case 'Clear':   return 'Clear sky → No hazardous weather expected.';
    case 'Clouds':  return 'Cloudy skies, but no severe systems detected.';
    case 'Rain':    return 'Light rain only. No flooding or storms predicted.';
    case 'Snow':    return 'Light snow showers. Roads may be slick; otherwise conditions are manageable.';
    case 'Drizzle': return 'Drizzle expected. Roads may be slick, but no major risks.';
    case 'Mist':
    case 'Fog':     return 'Low visibility in fog/mist. Drive carefully; otherwise conditions are stable.';
    default:        return 'Weather is calm. No alerts in your area.';
  }
};
