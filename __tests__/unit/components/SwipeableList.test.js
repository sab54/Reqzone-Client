// __tests__/unit/components/SwipeableList.test.js

/**
 * SwipeableList.test.js
 *
 * Covers:
 * 1) Empty state when not loading.
 * 2) Renders rows with icon + text and fires onItemPress (when not swiping).
 * 3) Suppresses onItemPress during swipe start, then allows press after reset.
 * 4) "Load More" calls onLoadMore and auto-scrolls to bottom via ref.
 *
 * Notes:
 * - Mocks Ionicons and Swipeable.
 * - Uses fake timers to advance setTimeout calls (tap guard & auto-scroll).
 * - No component changes required.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// 👉 Update this path to match your project layout
import SwipeableList from '../../../src/components/SwipeableList';

// ---- Mocks ----

// Mock @expo/vector-icons Ionicons (render as simple View)
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Ionicons = (props) => <View testID="Ionicon" {...props} />;
  return { __esModule: true, Ionicons };
});

// Mock react-native-gesture-handler Swipeable:
// - Render children inside a View with testID so we can query rows.
// - Expose `onSwipeableWillOpen` on the rendered node’s props so tests can call it directly.
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Swipeable = (props) => (
    <View testID="SwipeableRow" {...props}>
      {props.children}
    </View>
  );
  return { Swipeable };
});

const theme = {
  text: '#111',
  card: '#fff',
  border: '#eee',
  primary: '#4B7BE5',
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('SwipeableList', () => {
  test('shows empty text when not loading and no data', () => {
    const { getByText, queryByTestId } = render(
      <SwipeableList
        data={[]}
        totalCount={0}
        loading={false}
        theme={theme}
        emptyText="No items available."
      />
    );

    expect(getByText('No items available.')).toBeTruthy();
    // No rows
    expect(queryByTestId('SwipeableRow')).toBeNull();
  });

  test('renders a row with icon + text and fires onItemPress when not swiping', () => {
    const onItemPress = jest.fn();
    const data = [{ id: 1, title: 'Alpha' }];

    const { getByText, getAllByTestId } = render(
      <SwipeableList
        data={data}
        totalCount={1}
        theme={theme}
        renderItemText={(item) => item.title}
        onItemPress={onItemPress}
      />
    );

    // Icon exists
    const icons = getAllByTestId('Ionicon');
    expect(icons.length).toBeGreaterThan(0);

    // Tap the row text (TouchableOpacity wraps content)
    fireEvent.press(getByText('Alpha'));
    expect(onItemPress).toHaveBeenCalledWith({ id: 1, title: 'Alpha' });
  });

  test('suppresses onItemPress during swipe start, then allows press after reset', () => {
    const onItemPress = jest.fn();
    const handleSwipeStart = jest.fn();
    const data = [{ id: 2, title: 'Bravo' }];

    const utils = render(
      <SwipeableList
        data={data}
        totalCount={1}
        theme={theme}
        renderItemText={(item) => item.title}
        onItemPress={onItemPress}
        handleSwipeStart={handleSwipeStart}
      />
    );

    const { getByText, getByTestId, rerender } = utils;

    // Trigger the swipe start BEFORE pressing (so isSwipingRef.current = true)
    const row = getByTestId('SwipeableRow');
    act(() => {
      row.props.onSwipeableWillOpen && row.props.onSwipeableWillOpen();
    });

    // First press immediately after swipe start should be ignored
    fireEvent.press(getByText('Bravo'));
    expect(onItemPress).not.toHaveBeenCalled();
    expect(handleSwipeStart).toHaveBeenCalledWith(0);

    // After the 100ms guard, press should work again
    act(() => {
      jest.advanceTimersByTime(120);
    });

    // Re-render (no new swipe)
    rerender(
      <SwipeableList
        data={data}
        totalCount={1}
        theme={theme}
        renderItemText={(item) => item.title}
        onItemPress={onItemPress}
        handleSwipeStart={handleSwipeStart}
      />
    );

    fireEvent.press(getByText('Bravo'));
    expect(onItemPress).toHaveBeenCalledWith({ id: 2, title: 'Bravo' });
  });

 test('"Load More" calls onLoadMore and auto-scrolls to bottom via ref', () => {
  const onLoadMore = jest.fn();

  // Use an object ref because the component expects ref.current
  const listRef = React.createRef();

  const { getByText } = render(
    <SwipeableList
      ref={listRef}
      data={[{ id: 1, title: 'Row' }]}
      totalCount={10}
      hasMore
      loading={false}
      disableLoadMore={false}
      onLoadMore={onLoadMore}
      theme={{ text: '#111', card: '#fff', border: '#eee', primary: '#4B7BE5' }}
      renderItemText={(item) => item.title}
    />
  );

  // Tap "Load More"
  fireEvent.press(getByText('Load More'));
  expect(onLoadMore).toHaveBeenCalled();

  // Patch the real instance method BEFORE timers fire
  const mockScrollToEnd = jest.fn();
  if (listRef.current && typeof listRef.current.scrollToEnd === 'function') {
    listRef.current.scrollToEnd = mockScrollToEnd;
  }

  // Advance past the component's 300ms timeout
  act(() => {
    jest.advanceTimersByTime(320);
  });

  expect(mockScrollToEnd).toHaveBeenCalledWith({ animated: true });
});
});
