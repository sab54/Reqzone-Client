/**
 * LevelUpToast.test.js
 *
 * What This Test File Covers:
 *
 * 1. Rendering with props
 *    - Ensures the toast renders the correct message for a given `level`.
 *
 * 2. Theme application
 *    - Confirms that `theme.card` is applied as background and `theme.primary` is applied to text color.
 *
 * 3. Animated value usage
 *    - Asserts the `opacity` style reflects the numeric value of the provided Animated.Value.
 *      (Accepts either a raw number or an Animated node, depending on the RN test env/mocks.)
 *
 * 4. Snapshot
 *    - Captures stable output for regression testing.
 *
 * Notes:
 * - No component changes required; this test adapts to environments where Animated flattens to a number.
 */

import React from 'react';
import { Animated } from 'react-native';
import { render } from '@testing-library/react-native';
import LevelUpToast from 'src/components/LevelUpToast';

const theme = {
  card: '#ffffff',
  primary: '#123456',
  shadow: '#654321',
};

describe('LevelUpToast', () => {
  it('renders the correct message for the given level', () => {
    const { getByText } = render(
      <LevelUpToast animatedValue={new Animated.Value(1)} level={7} theme={theme} />
    );
    expect(getByText("🎉 Level Up! You're now Level 7!")).toBeTruthy();
  });

  it('applies theme colors to container and text', () => {
    const animatedValue = new Animated.Value(0.8);
    const { getByText, toJSON } = render(
      <LevelUpToast animatedValue={animatedValue} level={5} theme={theme} />
    );

    // Text color from theme.primary
    const text = getByText("🎉 Level Up! You're now Level 5!");
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: theme.primary })])
    );

    // Container background from theme.card
    const tree = toJSON();
    const containerStyle = tree.props.style;
    const flattened = Array.isArray(containerStyle)
      ? Object.assign({}, ...containerStyle)
      : containerStyle;
    expect(flattened.backgroundColor).toBe(theme.card);
  });

  it('uses the provided animated value for opacity (accepts number or Animated node)', () => {
    const animatedValue = new Animated.Value(0.5);
    const { toJSON } = render(
      <LevelUpToast animatedValue={animatedValue} level={10} theme={theme} />
    );

    const root = toJSON();
    const containerStyle = root.props.style;
    const flattened = Array.isArray(containerStyle)
      ? Object.assign({}, ...containerStyle)
      : containerStyle;

    // Resolve numeric value from style.opacity; RN test env may give number or Animated node
    const resolve = (v) => (typeof v === 'number' ? v : v?.__getValue?.());
    const resolvedOpacity = resolve(flattened.opacity);

    expect(typeof resolvedOpacity).toBe('number');
    expect(resolvedOpacity).toBeCloseTo(0.5, 5);

    // Sanity check: source value also holds 0.5
    expect(animatedValue.__getValue()).toBeCloseTo(0.5, 5);
  });

  it('matches snapshot', () => {
    const tree = render(
      <LevelUpToast animatedValue={new Animated.Value(1)} level={3} theme={theme} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
