// __tests__/unit/components/SearchBar.test.js

/**
 * SearchBar.test.js
 *
 * Covers:
 * 1) Basic rendering & initial value from `query`.
 * 2) Debounced onChange fires with user input (debounce mocked to immediate).
 * 3) Mic icon renders when showVoice=true.
 * 4) Submitting calls onSubmit and dismisses the keyboard.
 *
 * Notes:
 * - We mock `lodash.debounce` to call immediately for deterministic tests.
 * - We mock Ionicons to avoid native deps.
 * - We use fake timers + act() to flush Animated.timing and silence act warnings.
 */

import React from 'react';
import { Keyboard } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';

// 👉 Update this path to match your project layout if needed
import SearchBar from '../../../src/components/SearchBar';

// Mock lodash debounce to invoke immediately
jest.mock('lodash', () => {
  const original = jest.requireActual('lodash');
  const debounce = (fn) => {
    const wrapped = (...args) => fn(...args);
    wrapped.cancel = jest.fn();
    wrapped.flush = jest.fn();
    return wrapped;
  };
  return { ...original, debounce };
});

// Mock Ionicons from @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Ionicons = (props) => <View testID="Ionicon" {...props} />;
  return { __esModule: true, Ionicons };
});

const theme = {
  text: '#111',
  card: '#f5f5f5',
  input: '#fff',
  accent: '#7aa7ff',
  primary: '#4B7BE5',
};

beforeEach(() => {
  jest.useFakeTimers();
  jest
    .spyOn(global, 'requestAnimationFrame')
    .mockImplementation((cb) => setTimeout(cb, 0));
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
  global.requestAnimationFrame.mockRestore();
  jest.clearAllMocks();
});

describe('SearchBar', () => {
  test('renders with initial query and accessibility props', async () => {
    const { getByPlaceholderText } = render(
      <SearchBar query="hello" onChange={() => {}} theme={theme} />
    );

    await act(async () => {
      jest.runAllTimers();
    });

    const input = getByPlaceholderText('Search...');
    expect(input.props.value).toBe('hello');
    expect(input.props.accessibilityLabel).toBe('Search input');
    expect(input.props.accessibilityHint).toBe('Enter text to search');
    expect(input.props.accessibilityRole).toBe('search');
  });

  test('debounced onChange is called with user text', async () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <SearchBar query="" onChange={onChange} theme={theme} debounceTime={300} />
    );

    const input = getByPlaceholderText('Search...');
    fireEvent.changeText(input, 'resq');
    fireEvent.changeText(input, 'resqz');
    fireEvent.changeText(input, 'resqzone');

    await act(async () => {
      jest.runAllTimers();
    });

    expect(onChange).toHaveBeenLastCalledWith('resqzone');
    // 1 initial call from the mount effect + 3 changeText events
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  test('mic icon renders when showVoice=true', async () => {
    const { getAllByTestId } = render(
      <SearchBar query="" onChange={() => {}} theme={theme} showVoice />
    );

    await act(async () => {
      jest.runAllTimers();
    });

    const icons = getAllByTestId('Ionicon');
    const micIcon = icons.find((node) => node.props.name === 'mic-outline');
    expect(micIcon).toBeTruthy();
  });

  test('onSubmitEditing calls onSubmit and dismisses the keyboard', async () => {
    const onSubmit = jest.fn();
    const dismissSpy = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});

    const { getByPlaceholderText } = render(
      <SearchBar query="query text" onChange={() => {}} onSubmit={onSubmit} theme={theme} />
    );

    const input = getByPlaceholderText('Search...');
    fireEvent(input, 'submitEditing');

    await act(async () => {
      jest.runAllTimers();
    });

    expect(onSubmit).toHaveBeenCalledWith('query text');
    expect(dismissSpy).toHaveBeenCalled();

    dismissSpy.mockRestore();
  });
});
