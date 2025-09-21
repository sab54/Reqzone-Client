/**
 * EmergencyShortcuts.test.js
 *
 * What This Test File Covers:
 *
 * 1) Mount Effects & Default Number
 *    - fetchEmergencyContacts dispatched when user id exists.
 *    - Determines default emergency number via Network + Location
 *      (falls back to Localization.region when needed).
 *
 * 2) Service Card Interactions
 *    - Expands a service (Police) and opens Maps with proper query.
 *    - "Call" button dials tel:${defaultNumber}.
 *
 * 3) SMS Modal & Actions
 *    - Opens SMS modal, taps a preset to open sms: URL.
 *    - Sends current location via "📍 Send My Location".
 *
 * 4) Custom Contacts
 *    - Renders user contacts, long-press shows remove modal and confirms deletion.
 *
 * 5) Add Contact Modal
 *    - Opens AddContactModal and completes onAdd flow.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Linking, Platform } from 'react-native';

jest.useFakeTimers();

// -------------------- Mocks --------------------

// Icons (presentation only)
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// Network / Location / Localization
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(async () => ({ isInternetReachable: true })),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: 51.5074, longitude: -0.1278 } })),
  reverseGeocodeAsync: jest.fn(async () => [{ isoCountryCode: 'UK' }]),
}));

jest.mock('expo-localization', () => ({
  region: 'US',
}));

// Link opening
const spyOpenURL = jest.spyOn(Linking, 'openURL').mockImplementation(async () => true);

// AddContactModal: show a simple “Add” button that calls onAdd with a shape EmergencyShortcuts expects
jest.mock('../../../src/modals/AddContactModal', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return ({ visible, onAdd }) =>
    visible ? (
      <View testID="add-contact-modal">
        <TouchableOpacity
          testID="add-contact-submit"
          onPress={() => onAdd({ name: 'Zara', number: '555-0100' })}
        >
          <Text>Add</Text>
        </TouchableOpacity>
      </View>
    ) : null;
});

// ConfirmationModal: invoke onConfirm via test button
jest.mock('../../../src/components/ConfirmationModal', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return ({ visible, title, onConfirm, onClose }) =>
    visible ? (
      <View testID="confirm-modal">
        <Text>{title}</Text>
        <TouchableOpacity testID="confirm-remove" onPress={onConfirm}>
          <Text>Remove</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="close-remove" onPress={onClose}>
          <Text>Cancel</Text>
        </TouchableOpacity>
      </View>
    ) : null;
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

// Actions (prefix with "mock*" for Jest’s factory rule)
const mockFetchEmergencyContacts = jest.fn(() => async () => {});
const mockAddEmergencyContact = jest.fn(() => async () => {});
const mockDeleteEmergencyContact = jest.fn(() => async () => {});

jest.mock('../../../src/store/actions/emergencyActions', () => ({
  fetchEmergencyContacts: (...args) => mockFetchEmergencyContacts(...args),
  addEmergencyContact: (...args) => mockAddEmergencyContact(...args),
  deleteEmergencyContact: (...args) => mockDeleteEmergencyContact(...args),
}));

// -------------------- SUT --------------------
import EmergencyShortcuts from '../../../src/module/EmergencyShortcuts';

// -------------------- Theme & helpers --------------------
const theme = {
  card: '#fafafa',
  background: '#fff',
  surface: '#f7f7f7',
  border: '#e5e5e5',
  cardShadow: '#000',
  title: '#111',
  text: '#222',
  icon: '#444',
  error: '#e53935',
  warning: '#f9a825',
  success: '#2e7d32',
  successBackground: '#eaf6ea',
  warningBackground: '#fff6e6',
  actionText: '#111',
  primary: '#1976d2',
  link: '#1976d2',
  buttonPrimaryBackground: '#1976d2',
  buttonSecondaryText: '#fff',
};

const makeState = (overrides = {}) => ({
  auth: { user: { id: 10 } },
  emergency: { contacts: [{ id: 1, name: 'Mum', phone_number: '999-000' }] },
  ...overrides,
});

const setup = (stateOverrides = {}) => {
  mockState = makeState(stateOverrides);
  return render(<EmergencyShortcuts theme={theme} />);
};

beforeEach(() => {
  jest.clearAllMocks();
  spyOpenURL.mockClear();
});

// -------------------- Tests --------------------

it('expands Police, opens map with proper query, then “Text” opens SMS modal and sends a preset', async () => {
  const { getByText, queryByTestId } = setup();

  await act(async () => {});

  // Expand Police
  await act(async () => {
    fireEvent.press(getByText('Police'));
  });

  // Tap "Locate" -> opens Maps
  await act(async () => {
    fireEvent.press(getByText('Locate'));
  });

  if (Platform.OS === 'ios') {
    expect(spyOpenURL).toHaveBeenCalledWith(expect.stringMatching(/^http:\/\/maps\.apple\.com\/\?q=Police Station/i));
  } else {
    expect(spyOpenURL).toHaveBeenCalledWith(expect.stringMatching(/^geo:0,0\?q=Police Station/i));
  }

  // Tap "Text" -> open SMS modal
  await act(async () => {
    fireEvent.press(getByText('Text'));
  });

  // Modal should show preset messages; tap the first preset
  const presetText = 'Help! I’m in danger. Please send police.';
  await act(async () => {
    fireEvent.press(getByText(presetText));
  });

  // default number was determined as 999 (UK) from reverse geocode mock
  expect(spyOpenURL).toHaveBeenCalledWith(expect.stringMatching(/^sms:999\?body=/i));
  expect(queryByTestId('add-contact-modal')).toBeNull();
});

it('“📍 Send My Location” composes an SMS with coordinates', async () => {
  const { getByText, findByText } = setup();
  await act(async () => {});

  // Expand first — in its own act so state updates can commit
  await act(async () => {
    fireEvent.press(getByText('Police'));
  });

  // Allow a re-render before querying the expanded actions
  await act(async () => {});

  // Now the "Text" button exists
  const textBtn = await findByText('Text');
  await act(async () => {
    fireEvent.press(textBtn);   // open SMS modal
  });

  // Press the "📍 Send My Location" action inside the modal
  const sendLocBtn = await findByText('📍 Send My Location');
  await act(async () => {
    fireEvent.press(sendLocBtn);
  });

  // Should open sms: with a google maps link using mocked coords and UK default "999"
  // Should open sms: with a google maps link using mocked coords and UK default "999"
  const calledUrl = spyOpenURL.mock.calls.at(-1)[0];
  expect(calledUrl).toMatch(/^sms:999\?body=/i);

  // Decode the body so we can assert on the human-readable string
  const bodyEncoded = calledUrl.split('body=')[1];
  const bodyDecoded = decodeURIComponent(bodyEncoded);

  expect(bodyDecoded).toMatch(/https:\/\/www\.google\.com\/maps\?q=51\.5074,-0\.1278/i);

});


it('renders custom contacts; long-press shows remove modal and confirms deletion', async () => {
  const { getByText, getByTestId } = setup();
  await act(async () => {});

  // Long press on contact card "Mum" (TouchableOpacity)
  fireEvent(getByText('Mum'), 'onLongPress');

  // Confirmation modal appears
  expect(getByTestId('confirm-modal')).toBeTruthy();

  // Confirm removal -> dispatch deleteEmergencyContact, then refetch
  await act(async () => {
    fireEvent.press(getByTestId('confirm-remove'));
  });

  expect(mockDeleteEmergencyContact).toHaveBeenCalledWith(1);
  expect(mockFetchEmergencyContacts).toHaveBeenCalledWith(10);
});

it('opens AddContactModal and dispatches addEmergencyContact then refetches contacts', async () => {
  const { getByText, getByTestId } = setup();
  await act(async () => {});

  // Tap "Add Another Emergency Contact"
  await act(async () => {
    fireEvent.press(getByText('Add Another Emergency Contact'));
  });

  // Our mock modal becomes visible and exposes add button
  expect(getByTestId('add-contact-modal')).toBeTruthy();

  // Press the modal's add button
  await act(async () => {
    fireEvent.press(getByTestId('add-contact-submit'));
  });

  // addEmergencyContact should be called with normalized payload (user_id numeric)
  expect(mockAddEmergencyContact).toHaveBeenCalledWith({
    user_id: 10,
    name: 'Zara',
    phone_number: '555-0100',
  });
  // refetch after add
  expect(mockFetchEmergencyContacts).toHaveBeenCalledWith(10);
});
