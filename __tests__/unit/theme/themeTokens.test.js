/**
 * getThemeColors.test.js
 *
 * What This Test File Covers:
 *
 * 1. Dark Mode Palette
 *    - Ensures dark mode returns expected root values (e.g., mode = "dark", background dark hex).
 *
 * 2. Light Mode Palette
 *    - Ensures light mode returns expected root values (e.g., mode = "light", background white).
 *
 * 3. Semantic Consistency
 *    - Confirms that critical keys (e.g., title, text, error, success) exist in both palettes.
 *
 * 4. Overrides/Fixed Values
 *    - Ensures non-conditional values (e.g., buttonPrimaryBackground = "#0078D4") remain constant across modes.
 *
 * Notes:
 * - Only semantic correctness is validated — not visual fidelity.
 */

import { getThemeColors } from '../../../src/theme/themeTokens';

describe('getThemeColors', () => {
  test('returns dark mode palette when isDarkMode = true', () => {
    const colors = getThemeColors(true);
    expect(colors.mode).toBe('dark');
    expect(colors.background).toBe('#12161C');
    expect(colors.text).toBe('#D1D5DB');
  });

  test('returns light mode palette when isDarkMode = false', () => {
    const colors = getThemeColors(false);
    expect(colors.mode).toBe('light');
    expect(colors.background).toBe('#ffffff');
    expect(colors.text).toBe('#5f6368');
  });

  test('contains critical semantic keys in both palettes', () => {
    const dark = getThemeColors(true);
    const light = getThemeColors(false);
    const keys = ['title', 'text', 'error', 'success', 'buttonPrimaryBackground'];

    keys.forEach((key) => {
      expect(dark).toHaveProperty(key);
      expect(light).toHaveProperty(key);
    });
  });

  test('non-conditional values remain constant across modes', () => {
    const dark = getThemeColors(true);
    const light = getThemeColors(false);

    expect(dark.buttonPrimaryBackground).toBe('#0078D4');
    expect(light.buttonPrimaryBackground).toBe('#0078D4');

    expect(dark.buttonSecondaryBackground).toBe('#D93F2B');
    expect(light.buttonSecondaryBackground).toBe('#D93F2B');
  });
});
