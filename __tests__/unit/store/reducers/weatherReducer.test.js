// __tests__/store/reducers/weatherReducer.test.js
/**
 * weatherReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State & Unknown Action
 *    - Returns the defined initial state and ignores unknown actions (immutability check).
 *
 * 2) setWeatherData & setForecastData
 *    - Replaces `current` and `forecast` with provided payloads (no merges).
 *
 * 3) setWeatherLoading
 *    - Toggles loading flag true → false in sequence.
 *
 * 4) setWeatherError
 *    - Sets an error message without disturbing existing data, and allows clearing later.
 *
 * Notes:
 * - Pure reducer tests — no network or thunks involved.
 * - Mirrors the state shape used by weatherActions tests (current/forecast/loading/error/timestamps).
 */

import reducer, {
  setWeatherData,
  setForecastData,
  setWeatherLoading,
  setWeatherError,
  setLastWeatherFetch,
  setLastForecastFetch,
} from '../../../../src/store/reducers/weatherReducer';

describe('weather reducer', () => {
  it('1) returns initial state and ignores unknown actions (immutability)', () => {
    const initial = reducer(undefined, { type: '@@INIT' });

    // Basic shape assertions
    expect(initial).toEqual({
      current: null,
      forecast: [],
      loading: false,
      error: null,
      lastWeatherFetch: null,
      lastForecastFetch: null,
    });

    const prev = Object.freeze({ ...initial });
    const next = reducer(prev, { type: 'weather/NOT_A_REAL_ACTION', payload: 123 });

    // Unknown action should yield the same reference when state is frozen (no mutation attempts),
    // but at least should equal the previous state
    expect(next).toEqual(prev);
  });

  it('2) setWeatherData & setForecastData replace slices (no merge)', () => {
    const start = reducer(undefined, { type: '@@INIT' });

    const current = { name: 'Testville', main: { temp: 21 } };
    const afterCurrent = reducer(start, setWeatherData(current));
    expect(afterCurrent.current).toEqual(current);
    // unchanged siblings
    expect(afterCurrent.loading).toBe(false);
    expect(afterCurrent.error).toBeNull();

    const forecast = [
      { dt_txt: '2025-01-01 12:00:00', x: 1 },
      { dt_txt: '2025-01-02 12:00:00', x: 2 },
    ];
    const afterForecast = reducer(afterCurrent, setForecastData(forecast));
    expect(afterForecast.forecast).toEqual(forecast);

    // Replacing again should overwrite completely (no merge)
    const forecast2 = [{ dt_txt: '2025-01-03 12:00:00', y: 3 }];
    const afterOverwrite = reducer(afterForecast, setForecastData(forecast2));
    expect(afterOverwrite.forecast).toEqual(forecast2);
  });

  it('3) setWeatherLoading toggles flag true → false', () => {
    const start = reducer(undefined, { type: '@@INIT' });

    const loadingOn = reducer(start, setWeatherLoading(true));
    expect(loadingOn.loading).toBe(true);

    const loadingOff = reducer(loadingOn, setWeatherLoading(false));
    expect(loadingOff.loading).toBe(false);
  });

  it('4) setWeatherError sets message and can be cleared; timestamps are set independently', () => {
    const start = reducer(undefined, { type: '@@INIT' });

    const withError = reducer(start, setWeatherError('oops'));
    expect(withError.error).toBe('oops');
    // Other keys unchanged
    expect(withError.current).toBeNull();
    expect(withError.forecast).toEqual([]);

    // Clear error
    const cleared = reducer(withError, setWeatherError(null));
    expect(cleared.error).toBeNull();

    // Timestamps: ensure they only change when explicitly set
    const iso1 = '2025-09-20T10:00:00.000Z';
    const iso2 = '2025-09-20T10:05:00.000Z';
    const afterTS1 = reducer(cleared, setLastWeatherFetch(iso1));
    expect(afterTS1.lastWeatherFetch).toBe(iso1);
    expect(afterTS1.lastForecastFetch).toBeNull();

    const afterTS2 = reducer(afterTS1, setLastForecastFetch(iso2));
    expect(afterTS2.lastForecastFetch).toBe(iso2);
    expect(afterTS2.lastWeatherFetch).toBe(iso1);
  });
});
