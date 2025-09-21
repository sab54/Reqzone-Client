/**
 * themeReducer.test.js
 *
 * What These Tests Cover (3):
 *
 * 1) Initial State & Unknown Action
 *    - Returns initial state and ignores unknown actions.
 *
 * 2) setThemeMode
 *    - Updates mode string only, leaves isDarkMode/themeColors unchanged.
 *
 * 3) setEffectiveDarkMode
 *    - Updates isDarkMode flag and regenerates themeColors via getThemeColors.
 */

// __tests__/unit/store/reducers/themeReducer.test.js
import reducer, {
  setThemeMode,
  setEffectiveDarkMode,
} from '../../../../src/store/reducers/themeReducer';
import { getThemeColors } from '../../../../src/theme/themeTokens';

const initial = {
  mode: 'system',
  isDarkMode: false,
  themeColors: getThemeColors(false),
};

describe('theme reducer', () => {
  it('1) returns initial state and ignores unknown actions', () => {
    const s0 = reducer(undefined, { type: '@@INIT' });
    expect(s0).toEqual(initial);

    const prev = { ...initial, mode: 'dark' };
    const next = reducer(prev, { type: 'theme/NOT_A_REAL_ACTION' });
    expect(next).toEqual(prev);
  });

  it('2) setThemeMode changes mode only', () => {
    const prev = reducer(undefined, { type: '@@INIT' });
    const updated = reducer(prev, setThemeMode('light'));

    expect(updated.mode).toBe('light');
    // unchanged:
    expect(updated.isDarkMode).toBe(prev.isDarkMode);
    expect(updated.themeColors).toEqual(prev.themeColors);
  });

  it('3) setEffectiveDarkMode updates dark mode + themeColors', () => {
    const prev = reducer(undefined, { type: '@@INIT' });

    const dark = reducer(prev, setEffectiveDarkMode(true));
    expect(dark.isDarkMode).toBe(true);
    expect(dark.themeColors).toEqual(getThemeColors(true));

    const light = reducer(dark, setEffectiveDarkMode(false));
    expect(light.isDarkMode).toBe(false);
    expect(light.themeColors).toEqual(getThemeColors(false));
  });
});

