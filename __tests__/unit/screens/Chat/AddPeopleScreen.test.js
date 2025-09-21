// __tests__/unit/screens/AddPeopleScreen.test.js
/**
 * AddPeopleScreen.test.js
 *
 * What This Test File Covers:
 *
 * 1) Font Loading
 *    - Shows ActivityIndicator + "Loading..." text before fonts are loaded.
 *
 * 2) Bootstrap Actions
 *    - On mount: dispatches fetchUserSuggestions('') and clearDraftGroupUsers().
 *
 * 3) Debounced Search
 *    - Typing in SearchBar dispatches fetchUserSuggestions(query) after 300ms.
 *
 * 4) Submit Flows
 *    - One selected -> startDirectMessage(userId) and navigates with chat_id.
 *    - Multiple selected -> opens ConfirmationModal; entering name + confirm
 *      dispatches createGroupChat({ name, userIds }) and navigates with chat_id.
 *    - Add to existing group -> addUserToExistingGroup({ chatId, userIds }) and navigates back to that chat.
 *
 * 5) Loading State
 *    - When chat.loading is true, shows ActivityIndicator instead of list.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ActivityIndicator, TextInput } from 'react-native';

// ---- Mocks ----

// Debounce timers
beforeAll(() => jest.useFakeTimers());
afterAll(() => jest.useRealTimers());

// expo-font
const mockUseFonts = jest.fn(() => [true]);
jest.mock('expo-font', () => ({
  useFonts: (...args) => mockUseFonts(...args),
}));

// navigation / route (mutable)
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams = { chatId: null, mode: null };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: mockRouteParams }),
}));

// safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// SearchBar -> simple controlled input proxy
jest.mock('../../../../src/components/SearchBar', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return ({ query, onChange, placeholder }) => (
    <TextInput
      testID="search-input"
      value={query}
      onChangeText={onChange}
      placeholder={placeholder}
    />
  );
});

// ConfirmationModal -> render children when visible + expose confirm hook
jest.mock('../../../../src/components/ConfirmationModal', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return ({
    visible,
    children,
    onConfirm,
    onCancel,
    onClose,
  }) =>
    visible ? (
      <View testID="confirm-modal">
        {children}
        <TouchableOpacity testID="confirm-btn" onPress={onConfirm}>
          <Text>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="cancel-btn"
          onPress={onCancel || onClose || (() => {})}
        >
          <Text>Cancel</Text>
        </TouchableOpacity>
      </View>
    ) : null;
});

// chat actions (track calls)
export const mockFetchUserSuggestions = jest.fn((q) => ({
  type: 'FETCH_USER_SUGGESTIONS',
  q,
}));
export const mockAddUserToDraft = jest.fn((u) => ({
  type: 'ADD_USER_TO_DRAFT',
  u,
}));
export const mockRemoveUserFromDraft = jest.fn((id) => ({
  type: 'REMOVE_USER_FROM_DRAFT',
  id,
}));
export const mockClearDraft = jest.fn(() => ({ type: 'CLEAR_DRAFT' }));
export const mockCreateGroupChat = jest.fn((p) => ({
  type: 'CREATE_GROUP_CHAT',
  p,
}));
export const mockStartDirect = jest.fn((id) => ({
  type: 'START_DM',
  id,
}));
export const mockAddToExisting = jest.fn((p) => ({
  type: 'ADD_TO_EXISTING',
  p,
}));

jest.mock('../../../../src/store/actions/chatActions', () => ({
  fetchUserSuggestions: (...args) => mockFetchUserSuggestions(...args),
  addUserToDraftGroup: (...args) => mockAddUserToDraft(...args),
  removeUserFromDraftGroup: (...args) => mockRemoveUserFromDraft(...args),
  clearDraftGroupUsers: (...args) => mockClearDraft(...args),
  createGroupChat: (...args) => mockCreateGroupChat(...args),
  startDirectMessage: (...args) => mockStartDirect(...args),
  addUserToExistingGroup: (...args) => mockAddToExisting(...args),
}));

// redux hooks
const mockDispatch = jest.fn(() => ({ unwrap: () => Promise.resolve({}) }));
let mockChatSlice = {
  allUsers: [
    { id: 1, name: 'Alice Johnson' },
    { id: 2, name: 'Bob Singh' },
    { id: 3, name: 'Charlie Kim' },
  ],
  draftGroupUsers: [],
  loading: false,
};
const mockTheme = {
  themeColors: {
    background: '#fff',
    headerBackground: '#f8f8f8',
    input: '#f6f6f6',
    inputText: '#111',
    placeholder: '#999',
    surface: '#eee',
    card: '#fafafa',
    primary: '#1976d2',
    text: '#222',
    title: '#000',
    link: '#1a73e8',
    error: '#d32f2f',
    disabled: '#bbbbbb',
  },
};
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (sel) =>
      sel({
        theme: mockTheme,
        chat: mockChatSlice,
      }),
  };
});

// vector icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }) => <Text>{`icon:${name}`}</Text>,
  };
});

// Import after mocks
import AddPeopleScreen from '../../../../src/screens/Chat/AddPeopleScreen';

describe('AddPeopleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = { chatId: null, mode: null };
    mockUseFonts.mockReturnValue([true]);
    mockChatSlice = {
      allUsers: [
        { id: 1, name: 'Alice Johnson' },
        { id: 2, name: 'Bob Singh' },
        { id: 3, name: 'Charlie Kim' },
      ],
      draftGroupUsers: [],
      loading: false,
    };
    mockDispatch.mockImplementation(() => ({ unwrap: () => Promise.resolve({}) }));
  });

  it('shows loading UI until fonts are ready', () => {
    mockUseFonts.mockReturnValueOnce([false]);
    const { getByText, UNSAFE_getByType } = render(<AddPeopleScreen />);
    expect(getByText(/Loading\.\.\./i)).toBeTruthy();
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('dispatches bootstrap actions on mount', () => {
    render(<AddPeopleScreen />);
    expect(mockFetchUserSuggestions).toHaveBeenCalledWith('');
    expect(mockClearDraft).toHaveBeenCalled();
  });

  it('debounces search and dispatches fetchUserSuggestions with the query', () => {
    const { getByTestId } = render(<AddPeopleScreen />);
    const input = getByTestId('search-input');

    fireEvent.changeText(input, 'ali');
    // fast-forward debounce 300ms
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockFetchUserSuggestions).toHaveBeenCalledWith('ali');
  });

  it('submits one selected user -> startDirectMessage and navigates to ChatRoom with returned chat_id', async () => {
    // state: one selected
    mockChatSlice = {
      ...mockChatSlice,
      draftGroupUsers: [{ id: 2, name: 'Bob Singh' }],
    };

    // make dispatch unwrap resolve with a chat id
    mockDispatch.mockImplementation(() => ({
      unwrap: () => Promise.resolve({ chat_id: 'dm-42' }),
    }));

    const { getByText } = render(<AddPeopleScreen />);

    // button label for 1 selected should be "Start Chat"
    expect(getByText('Start Chat')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Start Chat'));
    });

    expect(mockStartDirect).toHaveBeenCalledWith(2);
    expect(mockNavigate).toHaveBeenCalledWith('ChatRoom', { chatId: 'dm-42' });
  });

  it('submits multiple selected users -> opens modal, confirm with name -> createGroupChat and navigate', async () => {
    mockChatSlice = {
      ...mockChatSlice,
      draftGroupUsers: [
        { id: 1, name: 'Alice Johnson' },
        { id: 2, name: 'Bob Singh' },
      ],
    };

    mockDispatch.mockImplementation(() => ({
      unwrap: () => Promise.resolve({ chat_id: 'grp-77' }),
    }));

    const { getByText, getByTestId, getByPlaceholderText } = render(
      <AddPeopleScreen />
    );

    // CTA should show "Create Group (2)"
    expect(getByText('Create Group (2)')).toBeTruthy();

    // Press CTA -> opens modal
    await act(async () => {
      fireEvent.press(getByText('Create Group (2)'));
    });
    expect(getByTestId('confirm-modal')).toBeTruthy();

    // Enter group name into modal TextInput
    const nameInput = getByPlaceholderText('Group name');
    fireEvent.changeText(nameInput, 'Friends');

    // Confirm
    await act(async () => {
      fireEvent.press(getByTestId('confirm-btn'));
    });

    expect(mockCreateGroupChat).toHaveBeenCalledWith({
      name: 'Friends',
      userIds: [1, 2],
    });
    expect(mockNavigate).toHaveBeenCalledWith('ChatRoom', {
      chatId: 'grp-77',
    });
  });

  it('add to existing group mode -> addUserToExistingGroup and navigate back to that chat', async () => {
    mockRouteParams = { chatId: 'abc123', mode: 'addToGroup' };
    mockChatSlice = {
      ...mockChatSlice,
      draftGroupUsers: [
        { id: 1, name: 'Alice Johnson' },
        { id: 3, name: 'Charlie Kim' },
      ],
    };

    const { getByText } = render(<AddPeopleScreen />);

    // button label shows Add (2)
    expect(getByText('Add (2)')).toBeTruthy();

    mockDispatch.mockImplementation(() => ({
      unwrap: () => Promise.resolve({ ok: true }),
    }));

    await act(async () => {
      fireEvent.press(getByText('Add (2)'));
    });

    expect(mockAddToExisting).toHaveBeenCalledWith({
      chatId: 'abc123',
      userIds: [1, 3],
    });
    expect(mockNavigate).toHaveBeenCalledWith('ChatRoom', { chatId: 'abc123' });
  });

  it('shows ActivityIndicator when chat.loading is true', () => {
    mockChatSlice = { ...mockChatSlice, loading: true };
    const { UNSAFE_getByType } = render(<AddPeopleScreen />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });
});
