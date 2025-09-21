/**
 * TypingIndicator.test.js
 *
 * What This Test File Covers:
 *
 * 1) Text Variants
 *    - 0 names: "Typing..."
 *    - 1 name:  "<name> is typing..."
 *    - 2 names: "<a> and <b> are typing..."
 *    - 3+ names: "Multiple people are typing..."
 *
 * 2) Dot Rendering & Theming
 *    - Renders exactly three dots.
 *    - Dots use theme.link as background color.
 *
 * 3) Wrapper/Text Theming
 *    - Wrapper uses theme.surface.
 *    - Text uses theme.text.
 *
 * Notes:
 * - We don't assert animation internals; jest.setup already tames Animated.
 * - No source changes required.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import TypingIndicator from '../../../../src/components/Chat/TypingIndicator';
import { Animated } from 'react-native';

// Make Animated.loop synchronous & finite for tests
let loopSpy;
beforeAll(() => {
  loopSpy = jest.spyOn(Animated, 'loop').mockImplementation(() => {
    const stop = jest.fn();
    return {
      start: (cb) => {
        try { if (typeof cb === 'function') cb({ finished: true }); } catch {}
        return { stop };
      },
      stop,
    };
  });
});

afterAll(() => {
  if (loopSpy?.mockRestore) loopSpy.mockRestore();
});


const theme = {
  surface: '#101112',
  text: '#EEF0F2',
  link: '#4E9FFF',
};

const hasBgColor = (styles, color) => {
  const arr = Array.isArray(styles) ? styles.flat() : [styles];
  return arr.some((s) => s && s.backgroundColor === color);
};

const getStyleProp = (styles, key) => {
  const arr = Array.isArray(styles) ? styles.flat() : [styles];
  // last one wins (like RN style merging)
  let val;
  arr.forEach((s) => {
    if (s && Object.prototype.hasOwnProperty.call(s, key)) val = s[key];
  });
  return val;
};

describe('TypingIndicator', () => {
  test('renders "Typing..." when no usernames', () => {
    const { getByText } = render(<TypingIndicator theme={theme} usernames={[]} />);
    expect(getByText('Typing...')).toBeTruthy();
  });

  test('renders "<name> is typing..." for one username', () => {
    const { getByText } = render(<TypingIndicator theme={theme} usernames={['Alice']} />);
    expect(getByText('Alice is typing...')).toBeTruthy();
  });

  test('renders "<a> and <b> are typing..." for two usernames', () => {
    const { getByText } = render(<TypingIndicator theme={theme} usernames={['Alice', 'Bob']} />);
    expect(getByText('Alice and Bob are typing...')).toBeTruthy();
  });

  test('renders "Multiple people are typing..." for 3+ usernames', () => {
    const { getByText } = render(
      <TypingIndicator theme={theme} usernames={['A', 'B', 'C']} />
    );
    expect(getByText('Multiple people are typing...')).toBeTruthy();
  });

  test('renders exactly three dots using theme.link color', () => {
    const { UNSAFE_getAllByType } = render(
      <TypingIndicator theme={theme} usernames={['Alice']} />
    );

    // Grab Animated.View nodes (each dot is an Animated.View)
    const dots = UNSAFE_getAllByType(Animated.View);

    // There can be other animated nodes depending on test environment;
    // filter to those with the dot background color from theme.link
    const dotNodes = dots.filter((n) => hasBgColor(n.props.style, theme.link));

    expect(dotNodes).toHaveLength(3);
    dotNodes.forEach((node) => {
      expect(hasBgColor(node.props.style, theme.link)).toBe(true);
    });
  });

  test('applies theme colors to wrapper and text', () => {
    const { toJSON, getByText } = render(
      <TypingIndicator theme={theme} usernames={[]} />
    );

    // Root wrapper is the first View in the tree
    const tree = toJSON();
    // tree is a View wrapper with style applied
    const wrapperStyle = tree.props.style;
    expect(getStyleProp(wrapperStyle, 'backgroundColor')).toBe(theme.surface);

    // Text node should have theme.text as color
    const label = getByText('Typing...');
    expect(getStyleProp(label.props.style, 'color')).toBe(theme.text);
  });
});
