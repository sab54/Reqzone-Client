// __tests__/unit/components/Tabs.test.js

/**
 * Tabs.test.js
 *
 * What This Test File Covers:
 *
 * 1) Spring Animation Wiring
 *    - Ensures `Animated.spring` is called with the selected tab index when `selectedTab` changes.
 *
 * 2) Rendering & Styles
 *    - Renders all tab labels and applies selected/unselected/disabled styles based on theme.
 *
 * 3) onTabSelect Callback
 *    - Pressing an enabled tab calls `onTabSelect(key)`. Disabled tabs do not trigger it.
 *
 * 4) Scrollable Prop
 *    - Toggles the `horizontal` prop of the underlying ScrollView when `scrollable` is true/false.
 *
 * Notes:
 * - We do not run real animations; we assert wiring, props, and styles.
 * - Jest fake timers are enabled to avoid teardown-time timers from RN setup.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated, ScrollView } from 'react-native';

// 👉 Update this import path to match your project structure
import Tabs from '../../../src/components/Tabs';

const baseTheme = {
  primary: '#3498db',
  text: '#111111',
  muted: '#999999',
  surface: '#f5f5f5',
  border: '#dddddd',
};

beforeAll(() => {
  // Prevent RN setup timers from firing after environment teardown
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.clearAllMocks();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('Tabs', () => {
  test('calls Animated.spring with the selected tab index on change', () => {
    const springSpy = jest.spyOn(Animated, 'spring');

    const tabs = [
      { key: 'home', label: 'Home' },
      { key: 'trending', label: 'Trending' },
      { key: 'saved', label: 'Saved' },
    ];

    const { rerender } = render(
      <Tabs
        tabs={tabs}
        selectedTab="home"
        onTabSelect={jest.fn()}
        theme={baseTheme}
      />
    );

    // Initial selection ("home" => index 0) triggers a spring
    expect(springSpy).toHaveBeenCalled();
    expect(springSpy.mock.calls[0][1]).toEqual(
      expect.objectContaining({ toValue: 0, useNativeDriver: false })
    );

    // Change selection to "saved" (index 2)
    rerender(
      <Tabs
        tabs={tabs}
        selectedTab="saved"
        onTabSelect={jest.fn()}
        theme={baseTheme}
      />
    );

    const lastCall = springSpy.mock.calls[springSpy.mock.calls.length - 1];
    expect(lastCall[1]).toEqual(
      expect.objectContaining({ toValue: 2, useNativeDriver: false })
    );
  });

  test('renders tab labels and applies selected/unselected/disabled styles', () => {
    const tabs = [
      { key: 'home', label: 'Home' },
      { key: 'trending', label: 'Trending' },
      { key: 'saved', label: 'Saved', disabled: true },
    ];

    const { getByText } = render(
      <Tabs
        tabs={tabs}
        selectedTab="trending"
        onTabSelect={jest.fn()}
        theme={baseTheme}
      />
    );

    const homeText = getByText('Home');
    const trendingText = getByText('Trending');
    const savedText = getByText('Saved');

    const styleOf = (node) =>
      Array.isArray(node.props.style)
        ? Object.assign({}, ...node.props.style)
        : node.props.style;

    const homeStyle = styleOf(homeText);
    const trendingStyle = styleOf(trendingText);
    const savedStyle = styleOf(savedText);

    // Selected: theme.primary & fontWeight '600'
    expect(trendingStyle.color).toBe(baseTheme.primary);
    expect(trendingStyle.fontWeight).toBe('600');

    // Unselected: theme.text & fontWeight '500'
    expect(homeStyle.color).toBe(baseTheme.text);
    expect(homeStyle.fontWeight).toBe('500');

    // Disabled: theme.muted
    expect(savedStyle.color).toBe(baseTheme.muted);
  });

  test('pressing an enabled tab calls onTabSelect; disabled does not', () => {
    const onTabSelect = jest.fn();
    const tabs = [
      { key: 'home', label: 'Home' },
      { key: 'trending', label: 'Trending' },
      { key: 'saved', label: 'Saved', disabled: true },
    ];

    const { getByText } = render(
      <Tabs
        tabs={tabs}
        selectedTab="home"
        onTabSelect={onTabSelect}
        theme={baseTheme}
      />
    );

    fireEvent.press(getByText('Trending'));
    expect(onTabSelect).toHaveBeenCalledWith('trending');

    fireEvent.press(getByText('Saved'));
    expect(onTabSelect).toHaveBeenCalledTimes(1);
  });

  test('scrollable prop toggles ScrollView horizontal', () => {
    const tabs = [
      { key: 'one', label: 'One' },
      { key: 'two', label: 'Two' },
    ];

    const { rerender, UNSAFE_getAllByType } = render(
      <Tabs
        tabs={tabs}
        selectedTab="one"
        onTabSelect={jest.fn()}
        theme={baseTheme}
        scrollable={false}
      />
    );

    let sv = UNSAFE_getAllByType(ScrollView)[0];
    expect(sv.props.horizontal).toBe(false);

    rerender(
      <Tabs
        tabs={tabs}
        selectedTab="one"
        onTabSelect={jest.fn()}
        theme={baseTheme}
        scrollable
      />
    );

    sv = UNSAFE_getAllByType(ScrollView)[0];
    expect(sv.props.horizontal).toBe(true);
  });
});
