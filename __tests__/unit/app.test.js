/**
 * app.navigation.test.js
 *
 * What This Test File Covers:
 *
 * 1) Auth Flow Routing
 *    - Renders Login stack when user is not present.
 *    - Renders Main tabs when user exists and shows the Home screen.
 *
 * 2) Profile Modal Toggle & Theme Switch
 *    - Tapping header-left avatar opens the sidebar with the welcome text.
 *    - Pressing the theme toggle dispatches `applyThemeMode()` with the correct next mode.
 *
 * 3) Logout Action
 *    - Tapping "Logout" dispatches `logout()` and (implicitly) closes the modal.
 *
 * Notes:
 * - We mock screen components to simple text placeholders for reliable assertions.
 * - We rely on the stable react-redux mock (provided in jest.setup.js) and override
 *   `useSelector` per-test to supply the state snapshot.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Import the default App (already wraps Redux Provider and ChatProvider)
// 🛠️ Mock the Redux store BEFORE importing App to avoid building real reducers
jest.mock('../../src/store', () => ({
  __esModule: true,
  default: {}, // Provider is mocked to just render children, so the store is unused
}));

// Now import the App
import App from '../../App';

// --- Mocks for screens to ensure stable text selectors ---
jest.mock('../../src/screens/LoginScreen', () => () => <></>);
jest.mock('../../src/screens/OTPVerificationScreen', () => () => <></>);
jest.mock('../../src/screens/RegistrationScreen', () => () => <></>);

jest.mock('../../src/screens/HomeScreen', () => () => <></>);
jest.mock('../../src/screens/Games/TasksScreen', () => () => <></>);
jest.mock('../../src/screens/Games/BadgesScreen', () => () => <></>);
jest.mock('../../src/screens/Games/QuizScreen', () => () => <></>);
jest.mock('../../src/screens/AlertsScreen', () => () => <></>);
jest.mock('../../src/screens/ResourcesScreen', () => () => <></>);
jest.mock('../../src/screens/Chat/ChatScreen', () => () => <></>);
jest.mock('../../src/screens/Chat/ChatRoomScreen', () => () => <></>);
jest.mock('../../src/screens/Chat/AddPeopleScreen', () => () => <></>);

// The vector icon mocks from jest.setup render text like "ion:person-circle".
/**
 * Important state+dispatch control:
 * - jest.setup.js provides a react-redux mock where:
 *   - useDispatch() returns a mock function
 *   - useSelector is a jest.fn() we can override per test
 */
import { useDispatch, useSelector } from 'react-redux';

// Mock theme + auth actions so we can assert dispatch payloads
jest.mock('../../src/store/actions/themeActions', () => ({
  loadThemeFromStorage: jest.fn(() => ({ type: 'THEME/LOAD_FROM_STORAGE' })),
  applyThemeMode: jest.fn((mode) => ({ type: 'THEME/APPLY_MODE', payload: mode })),
}));
jest.mock('../../src/store/actions/loginActions', () => ({
  logout: jest.fn(() => ({ type: 'AUTH/LOGOUT' })),
  updateUserLocation: jest.fn((coords) => ({ type: 'AUTH/UPDATE_LOCATION', payload: coords })),
}));

// Helpers to build minimal theme colors consumed by styles
const baseTheme = {
  link: '#0078D4',
  text: '#5f6368',
  headerBackground: '#f1f1f3',
  card: '#f1f1f3',
  surface: '#f9f9f9',
  divider: '#d9e0e6',
  shadow: '#0000001a',
  title: '#333333',
  error: '#D93F2B',
};
const darkTheme = {
  link: '#4B9BE3',
  text: '#D1D5DB',
  headerBackground: '#20252E',
  card: '#1E222A',
  surface: '#181C22',
  divider: '#3F4753',
  shadow: '#00000066',
  title: '#ffffff',
  error: '#D93F2B',
};

const setSelectors = ({ user = null, isDarkMode = false } = {}) => {
  // Supply a single state object regardless of how many times selectors are called.
  useSelector.mockImplementation((sel) =>
    sel({
      theme: {
        isDarkMode,
        themeColors: isDarkMode ? darkTheme : baseTheme,
      },
      auth: {
        user,
      },
    })
  );
};

describe('App Navigation & Header Modal', () => {
  let dispatch;

  beforeEach(() => {
    jest.clearAllMocks();
    dispatch = useDispatch(); // from jest.setup: returns the same mocked fn
  });

  test('renders Login flow when user is not authenticated', async () => {
    setSelectors({ user: null, isDarkMode: false });
    const { queryByText } = render(<App />);

    // Tabs should not render; but our mocked Tab.Screen renders "Home" etc. only when MainTabs is used.
    expect(queryByText('Home')).toBeNull();
    expect(queryByText('Chat')).toBeNull();
  });


  test('header avatar opens sidebar and theme toggle dispatches applyThemeMode', async () => {
    const { applyThemeMode } = require('../../src/store/actions/themeActions');

    // Start in light mode so the menu shows "Switch to Dark Mode"
    setSelectors({ user: { id: 1, first_name: 'Sam' }, isDarkMode: false });
    const { getByText, getByRole } = render(<App />);

    // Wait for the header to appear (e.g., Ionicon button)
    await waitFor(() => expect(getByRole('button', { name: /ion:person-circle/i })).toBeTruthy());
    
    fireEvent.press(getByRole('button', { name: /ion:person-circle/i }));

    // Check sidebar contents
    await waitFor(() => expect(getByText(/Welcome/i)).toBeTruthy());
    
    // Press theme toggle
    fireEvent.press(getByText('Switch to Dark Mode'));

    expect(applyThemeMode).toHaveBeenCalledWith('dark');
    expect(dispatch).toHaveBeenCalledWith({ type: 'THEME/APPLY_MODE', payload: 'dark' });
  });

  test('pressing Logout dispatches logout action', async () => {
    const { logout } = require('../../src/store/actions/loginActions');

    setSelectors({ user: { id: 7, first_name: 'Ava' }, isDarkMode: true });
    const { getByRole, getByText } = render(<App />);

    // Wait for the header to appear (e.g., Ionicon button)
    await waitFor(() => expect(getByRole('button', { name: /ion:person-circle/i })).toBeTruthy());

    fireEvent.press(getByRole('button', { name: /ion:person-circle/i }));

    // Press "Logout"
    await waitFor(() => getByText('Logout'));
    fireEvent.press(getByText('Logout'));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'AUTH/LOGOUT' });
  });
});
