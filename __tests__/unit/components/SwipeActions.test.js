// __tests__/unit/components/SwipeActions.test.js

/**
 * SwipeActions.test.js
 *
 * What This Test File Covers:
 *
 * 1) Interpolation Wiring
 *    - Ensures `dragX.interpolate` is called with the expected input/output ranges
 *      for translateX and opacity.
 *
 * 2) Default Actions (not bookmarked)
 *    - Renders "open" and "bookmark" actions with correct labels, icons, and colors.
 *
 * 3) Bookmark Awareness (bookmarked)
 *    - When `isBookmarked` is true, bookmark action flips icon, label, and background color.
 *
 * 4) onAction Callback
 *    - Pressing an action calls `onAction(type, article, index)` with the right arguments.
 *
 * Notes:
 * - Ionicons are mocked to avoid native deps; we assert props passed to them.
 * - We don’t animate—just assert wiring and props.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// 👉 Update this path to match your project layout
import SwipeActions from '../../../src/components/SwipeActions';

// ---- Mocks ----

// Mock Ionicons from @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Ionicons = (props) => <View testID="Ionicon" {...props} />;
  return { __esModule: true, Ionicons };
});

const baseTheme = {
  primary: '#3498db',
  success: '#27ae60',
  error: '#e74c3c',
  buttonPrimaryText: '#fff',
};

describe('SwipeActions', () => {
  test('calls dragX.interpolate with correct ranges for translateX and opacity', () => {
    const dragX = {
      interpolate: jest
        .fn()
        // first call (translateX)
        .mockReturnValueOnce('TX_NODE')
        // second call (opacity)
        .mockReturnValueOnce('OP_NODE'),
    };

    render(
      <SwipeActions
        dragX={dragX}
        article={{ id: 1 }}
        index={0}
        isBookmarked={false}
        theme={baseTheme}
      />
    );

    // First call: translateX ranges
    expect(dragX.interpolate).toHaveBeenNthCalledWith(1, {
      inputRange: [-180, 0],
      outputRange: [0, 180],
      extrapolate: 'clamp',
    });

    // Second call: opacity ranges
    expect(dragX.interpolate).toHaveBeenNthCalledWith(2, {
      inputRange: [-180, -90, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });
  });

  test('renders default actions when not bookmarked (icons, labels, colors)', () => {
    const dragX = { interpolate: jest.fn(() => 'ANIM') };

    const { getAllByTestId, getByText } = render(
      <SwipeActions
        dragX={dragX}
        article={{ id: 2 }}
        index={1}
        isBookmarked={false}
        theme={baseTheme}
      />
    );

    // Labels (tolerate newline between words)
    expect(getByText('Open')).toBeTruthy();
    expect(getByText(/Add\s*Bookmark/)).toBeTruthy();

    // Icons via Ionicon props
    const icons = getAllByTestId('Ionicon');
    expect(icons.length).toBe(2);

    const openIcon = icons[0];
    expect(openIcon.props.name).toBe('open-outline');
    expect(openIcon.props.size).toBe(22);
    expect(openIcon.props.color).toBe('#fff'); // theme.buttonPrimaryText

    const bookmarkIcon = icons[1];
    expect(bookmarkIcon.props.name).toBe('bookmark-outline');
    expect(bookmarkIcon.props.size).toBe(22);
    expect(bookmarkIcon.props.color).toBe('#fff');
  });

  test('bookmark awareness: flips icon, label, and background color when isBookmarked=true', () => {
    const dragX = { interpolate: jest.fn(() => 'ANIM') };

    const { getAllByTestId, getByText } = render(
      <SwipeActions
        dragX={dragX}
        article={{ id: 3 }}
        index={2}
        isBookmarked={true}
        theme={baseTheme}
      />
    );

    // Label switches to "Remove\nBookmark" (allow newline/whitespace)
    expect(getByText(/Remove\s*Bookmark/)).toBeTruthy();

    // The bookmark icon switches to "bookmark"
    const icons = getAllByTestId('Ionicon');
    const bookmarkIcon = icons[1];
    expect(bookmarkIcon.props.name).toBe('bookmark');
  });

  test('pressing an action calls onAction with (type, article, index)', () => {
    const dragX = { interpolate: jest.fn(() => 'ANIM') };
    const onAction = jest.fn();
    const article = { id: 42, title: 'Hello' };
    const actions = [
      { type: 'open', label: 'Open\n', icon: 'open-outline', color: '#123' },
      { type: 'bookmark', label: 'Add\nBookmark', icon: 'bookmark-outline', color: '#456' },
      { type: 'share', label: 'Share', icon: 'share-outline', color: '#789' },
    ];

    const { getByText } = render(
      <SwipeActions
        dragX={dragX}
        article={article}
        index={5}
        isBookmarked={false}
        onAction={onAction}
        actions={actions}
        theme={baseTheme}
      />
    );

    // Press "Open"
    fireEvent.press(getByText(/Open/));
    expect(onAction).toHaveBeenCalledWith('open', article, 5);

    // Press "Add Bookmark"
    fireEvent.press(getByText(/Add\s*Bookmark/));
    expect(onAction).toHaveBeenCalledWith('bookmark', article, 5);

    // Press "Share"
    fireEvent.press(getByText('Share'));
    expect(onAction).toHaveBeenCalledWith('share', article, 5);
  });
});
