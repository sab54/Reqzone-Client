// __tests__/unit/screens/ResourcesScreen.test.js
/**
 * ResourcesScreen.test.js
 *
 * What This Test File Covers:
 *
 * 1) Font Loading
 *    - Displays ActivityIndicator + "Loading fonts..." when fonts not loaded.
 *
 * 2) Main Composition
 *    - Renders EmergencyShortcuts, DocumentsScreen, and Footer when fonts loaded.
 *
 * 3) Refresh Control
 *    - Sets refreshing=true on pull-to-refresh and resets after timeout.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { FlatList, ActivityIndicator } from 'react-native';

// ---- Mocks ----

// expo-font
const mockUseFonts = jest.fn(() => [true]);
jest.mock('expo-font', () => ({
  useFonts: (...args) => mockUseFonts(...args),
}));

// Redux theme
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useSelector: (sel) =>
      sel({
        theme: {
          themeColors: {
            background: '#fff',
            primary: '#123456',
            text: '#111',
          },
        },
      }),
  };
});

// Child modules
jest.mock('../../../src/module/EmergencyShortcuts', () => {
  const { Text } = require('react-native');
  return ({ theme }) => <Text testID="shortcuts">EmergencyShortcuts</Text>;
});
jest.mock('../../../src/module/DocumentsScreen', () => {
  const { Text } = require('react-native');
  return ({ theme }) => <Text testID="documents">DocumentsScreen</Text>;
});
jest.mock('../../../src/components/Footer', () => {
  const { Text } = require('react-native');
  return ({ theme }) => <Text testID="footer">Footer</Text>;
});

// Import after mocks
import ResourcesScreen from '../../../src/screens/ResourcesScreen';

describe('ResourcesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when fonts not loaded', () => {
    mockUseFonts.mockReturnValueOnce([false]);
    const { getByText, UNSAFE_getByType } = render(<ResourcesScreen />);

    expect(getByText(/Loading fonts/i)).toBeTruthy();
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders EmergencyShortcuts, DocumentsScreen, and Footer when fonts loaded', () => {
    mockUseFonts.mockReturnValueOnce([true]);
    const { getByTestId } = render(<ResourcesScreen />);

    expect(getByTestId('shortcuts')).toBeTruthy();
    expect(getByTestId('documents')).toBeTruthy();
    expect(getByTestId('footer')).toBeTruthy();
  });

  it('triggers refresh control on pull-to-refresh', () => {
    jest.useFakeTimers();

    const { UNSAFE_getByType } = render(<ResourcesScreen />);
    const list = UNSAFE_getByType(FlatList);

    // Fire onRefresh
    act(() => {
      list.props.refreshControl.props.onRefresh();
    });

    // Immediately: refreshing should be true
    expect(list.props.refreshControl.props.refreshing).toBe(true);

    // Advance timers by 1s
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // After timeout: refreshing resets to false
    expect(list.props.refreshControl.props.refreshing).toBe(false);

    jest.useRealTimers();
  });
});
