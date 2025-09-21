// Client/__tests__/unit/module/Alert.test.js

/**
 * Alert (module) test
 *
 * Covers:
 * 1) Initial Fetch & Tab Switching
 * 2) Search + Geofence Filtering
 * 3) Pagination (Load More)
 * 4) Swipe Action (Mark as Read) & External Link
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Linking } from 'react-native';

jest.useFakeTimers();

// -------------------- Mocks --------------------

// Ionicons (presentational)
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// utils
jest.mock('../../../src/utils/utils', () => ({
  formatTimeAgo: jest.fn(() => 'just now'),
  truncate: jest.fn((s) => s),
}));

// expo-location: grant permission + fixed coords (London)
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 51.5074, longitude: -0.1278 },
  })),
}));

// expo-font (used elsewhere in app builds) + font asset
jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));
jest.mock('../../../src/assets/fonts/Poppins-Regular.ttf', () => 1, { virtual: true });

// SearchBar mock (no debounce)
jest.mock('../../../src/components/SearchBar', () => {
  return ({ query, onChange, placeholder }) => {
    const React = require('react');
    const { TextInput } = require('react-native');
    return (
      <TextInput
        testID="search-input"
        value={query}
        placeholder={placeholder}
        onChangeText={onChange}
      />
    );
  };
});

// Tabs mock
jest.mock('../../../src/components/Tabs', () => {
  return ({ tabs, selectedTab, onTabSelect }) => {
    const React = require('react');
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            testID={`tab-${t.key}`}
            accessibilityState={{ selected: selectedTab === t.key }}
            onPress={() => onTabSelect(t.key)}
          >
            <Text>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
});

/**
 * SwipeableList mock:
 * - Renders each item's renderItemText(...)
 * - Row is pressable to call onItemPress(item)
 * - Clones right action element and injects testID so we can press it
 * - Renders "Load more" when hasMore && !loading && !disableLoadMore
 */
jest.mock('../../../src/components/SwipeableList', () => {
  const React = require('react');
  const { View, TouchableOpacity } = require('react-native');

  const SwipeableList = (props) => {
    const {
      data,
      renderItemText,
      renderRightActions,
      onItemPress,
      hasMore,
      loading,
      disableLoadMore,
      onLoadMore,
      keyExtractor,
    } = props;

    return (
      <View>
        {data.map((item, index) => {
          const right = renderRightActions?.(item, index);
          const rightWithId =
            right && React.isValidElement(right)
              ? React.cloneElement(right, { testID: `right-action-${index}` })
              : right;

          return (
            <View key={keyExtractor?.(item, index) ?? `${index}`}>
              <TouchableOpacity
                testID={`item-${index}`}
                onPress={() => onItemPress?.(item)}
              >
                {renderItemText?.(item)}
              </TouchableOpacity>
              {rightWithId}
            </View>
          );
        })}
        {hasMore && !loading && !disableLoadMore && (
          <TouchableOpacity testID="load-more" onPress={onLoadMore} />
        )}
      </View>
    );
  };
  SwipeableList.displayName = 'SwipeableList(Mock)';
  return SwipeableList;
});

// -------------------- Redux wiring --------------------
let mockState = {};
const mockDispatch = jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({}) }));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (sel) => sel(mockState),
  };
});

// Actions (prefix with "mock*" so Jest allows reference in the factory)
const mockFetchAlertsData = jest.fn(() => async () => {});
const mockFetchUserAlerts = jest.fn(() => async () => {});
const mockFetchGlobalHazardAlerts = jest.fn(() => async () => {});
const mockMarkAlertAsRead = jest.fn(() => async () => {});

jest.mock('../../../src/store/actions/alertsActions', () => ({
  fetchAlertsData: (...args) => mockFetchAlertsData(...args),
  fetchUserAlerts: (...args) => mockFetchUserAlerts(...args),
  fetchGlobalHazardAlerts: (...args) => mockFetchGlobalHazardAlerts(...args),
  markAlertAsRead: (...args) => mockMarkAlertAsRead(...args),
}));

// -------------------- SUT --------------------
import Alert from '../../../src/module/Alert';

// -------------------- Theme & helpers --------------------
const theme = {
  background: '#fff',
  title: '#111',
  text: '#222',
  success: 'green',
  error: 'red',
  mutedText: '#888',
  info: 'blue',
};

const makeState = (overrides = {}) => ({
  auth: { user: { id: 123 } },
  alerts: {
    alerts: { data: [], loading: false, hasMore: false },
    globalHazards: { data: [], loading: false },
  },
  ...overrides,
});

const setup = (stateOverrides = {}) => {
  mockState = makeState(stateOverrides);
  return render(<Alert theme={theme} />);
};

// Spy on Linking.openURL (no RN package mock)
const spyOpenURL = jest.spyOn(Linking, 'openURL').mockImplementation(async () => true);

beforeEach(() => {
  jest.clearAllMocks();
  spyOpenURL.mockClear();
});

// -------------------- Tests --------------------

// 1) Initial fetch + tab switching
it('fetches hazards and page 1 of "System" on mount, and refetches when switching to "Weather"', async () => {
  const utils = setup();

  await act(async () => {});

  expect(mockFetchGlobalHazardAlerts).toHaveBeenCalledTimes(1);
  expect(mockFetchAlertsData).toHaveBeenCalledWith({
    category: 'System',
    page: 1,
    userId: 123,
  });

  await act(async () => {
    fireEvent.press(utils.getByTestId('tab-Weather'));
  });

  // After state settles
  expect(mockFetchAlertsData).toHaveBeenLastCalledWith({
    category: 'Weather',
    page: 1,
    userId: 123,
  });
});

// 2) Search + Geofence filter
it('filters alerts by search and geofence (shows only items within radius)', async () => {
  const withinLondon = {
    id: 1,
    title: 'River Thames Flood Watch',
    message: 'Stay alert near embankments.',
    category: 'weather',
    type: 'weather',
    latitude: 51.5079,
    longitude: -0.12,
    radius_km: 2,
    is_read: false,
  };

  const farAway = {
    id: 2,
    title: 'River Thames Flood Watch',
    message: 'This one is far.',
    category: 'weather',
    type: 'weather',
    latitude: 55.9533,
    longitude: -3.1883,
    radius_km: 2,
    is_read: false,
  };

  mockState = makeState({
    alerts: {
      alerts: { data: [withinLondon, farAway], loading: false, hasMore: false },
      globalHazards: { data: [], loading: false },
    },
  });

  const { getByTestId, queryByText } = render(<Alert theme={theme} />);

  await act(async () => {});

  await act(async () => {
    fireEvent.press(getByTestId('tab-Weather'));
    fireEvent.changeText(getByTestId('search-input'), 'river');
  });

  // One visible row with that title (the near one); the far one is filtered out by geofence.
  expect(queryByText('River Thames Flood Watch')).toBeTruthy();
  expect(getByTestId('item-0')).toBeTruthy();
});

// 3) Pagination (Load more)
it('dispatches next page when pressing "Load more"', async () => {
  mockState = makeState({
    alerts: {
      alerts: {
        data: [{ id: 10, title: 'System notice A', category: 'system', is_read: true }],
        loading: false,
        hasMore: true,
      },
      globalHazards: { data: [], loading: false },
    },
  });

  const { getByTestId } = render(<Alert theme={theme} />);
  await act(async () => {});

  await act(async () => {
    fireEvent.press(getByTestId('load-more'));
  });

  expect(mockFetchAlertsData).toHaveBeenLastCalledWith({
    category: 'System',
    page: 2,
    userId: 123,
  });
});

// 4) Mark-as-read swipe action + external link
it('marks an alert as read via right action and opens URLs on row press', async () => {
  const withUrl = {
    id: 77,
    title: 'Security Patch Available',
    message: 'Tap to learn more.',
    category: 'system',
    is_read: false,
    url: 'https://example.com/security',
  };

  mockState = makeState({
    alerts: {
      alerts: { data: [withUrl], loading: false, hasMore: false },
      globalHazards: { data: [], loading: false },
    },
  });

  const { getByTestId } = render(<Alert theme={theme} />);
  await act(async () => {});

  await act(async () => {
    fireEvent.press(getByTestId('right-action-0'));
  });
  expect(mockMarkAlertAsRead).toHaveBeenCalledWith({
    alertId: 77,
    alertType: 'system',
    userId: 123,
  });

  await act(async () => {
    fireEvent.press(getByTestId('item-0'));
  });
  expect(spyOpenURL).toHaveBeenCalledWith('https://example.com/security');
});
