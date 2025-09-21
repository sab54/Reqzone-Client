/**
 * TipBanner.test.js
 *
 * What This Test File Covers:
 *
 * 1. Basic Rendering
 *    - Renders the tip text prefixed with 💡.
 *
 * 2. Theming Support
 *    - Applies custom highlight and title colors from `theme`.
 *
 * 3. Defaults
 *    - Falls back to default highlight (`#f5f5dc`) and title (`#000`) when no theme provided.
 *
 * 4. Snapshot
 *    - Ensures the structure and text output remain stable.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import TipBanner from '../../../src/components/TipBanner';

const flatten = (style) =>
  Array.isArray(style) ? Object.assign({}, ...style) : style;

const findViewWithStyle = (node, predicate) => {
  if (!node || typeof node !== 'object') return null;
  const { type, props, children } = node;

  if (
    type === 'View' &&
    props &&
    props.style &&
    predicate(flatten(props.style))
  ) {
    return node;
  }
  if (Array.isArray(children)) {
    for (const c of children) {
      const found = findViewWithStyle(c, predicate);
      if (found) return found;
    }
  }
  return null;
};

describe('TipBanner', () => {
  test('renders tip text with 💡 prefix', () => {
    const { getByText } = render(<TipBanner tip="Stay hydrated" />);
    expect(getByText(/💡\s*Stay hydrated/)).toBeTruthy();
  });

  test('applies theme highlight and title colors (no testID required)', () => {
    const theme = { highlight: '#abc123', title: '#654321' };
    const { getByText, toJSON } = render(
      <TipBanner tip="Custom tip" theme={theme} />
    );

    // Text color check
    const text = getByText(/💡\s*Custom tip/);
    const textStyle = flatten(text.props.style);
    expect(textStyle.color).toBe('#654321');

    // Container background via rendered tree
    const tree = toJSON();
    const container = findViewWithStyle(
      tree,
      (s) => s.backgroundColor === '#abc123'
    );
    expect(container).toBeTruthy();
  });

  test('uses default colors when no theme provided', () => {
    const { getByText, toJSON } = render(<TipBanner tip="Default theme tip" />);

    // Text default color
    const text = getByText(/💡\s*Default theme tip/);
    const textStyle = flatten(text.props.style);
    expect(textStyle.color).toBe('#000');

    // Background default color
    const tree = toJSON();
    const container = findViewWithStyle(
      tree,
      (s) => s.backgroundColor === '#f5f5dc'
    );
    expect(container).toBeTruthy();
  });

  test('matches snapshot', () => {
    const { toJSON } = render(<TipBanner tip="Snapshot tip" />);
    expect(toJSON()).toMatchSnapshot();
  });
});
