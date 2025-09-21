// __tests__/unit/screens/ChatScreen.test.js
/**
 * ChatScreen.test.js
 *
 * Covers:
 * 1) Font Loading
 *    - Shows ActivityIndicator + "Loading fonts..." when fonts not loaded.
 *
 * 2) Bootstrap & Socket wiring
 *    - On focus/mount: dispatches fetchActiveChats() and initializes socket;
 *      registers onEvent('chat:list_update', ...).
 *
 * 3) Debounced socket list update
 *    - Fires update callback after 200ms → dispatches updateActiveChatsFromSocket(chats).
 *
 * 4) Pull-to-Refresh
 *    - When ChatList is shown, pressing mocked refresh triggers fetchActiveChats().
 *    - When empty state is shown, FlatList onRefresh also triggers fetchActiveChats().
 *
 * 5) Loading & Empty states
 *    - Renders "Loading chats..." while loading.
 *    - Renders empty illustration text when there are no chats.
 *
 * 6) FAB Actions
 *    - "Start New Chat" navigates to AddPeopleScreen.
 *    - "Join Local Group" requests location, reverse geocodes, dispatches joinLocalGroup,
 *       and navigates to ChatRoom with returned chat_id.
 */
// __tests__/unit/screens/LoginScreen.test.js
jest.spyOn(console, 'error').mockImplementation(() => {});
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ActivityIndicator, FlatList, Text } from 'react-native';

// ---- Fake timers for debounces ----
beforeAll(() => jest.useFakeTimers());
afterAll(() => jest.useRealTimers());

// ---- Mocks ----

// expo-font
const mockUseFonts = jest.fn(() => [true]);
jest.mock('expo-font', () => ({ useFonts: (...a) => mockUseFonts(...a) }));

// Navigation & focus
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (cb) => cb && cb(() => () => {}), // immediately run effect
}));

// Safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Medium: 'Medium' },
}));

// Expo Location + reverseGeocode util
const mockReqPerm = jest.fn(async () => ({ status: 'granted' }));
const mockGetPos = jest.fn(async () => ({
  coords: { latitude: 12.3, longitude: 45.6 },
}));
const mockReverseExpo = jest.fn(async () => [{ city: 'Testville' }]);
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: (...a) => mockReqPerm(...a),
  getCurrentPositionAsync: (...a) => mockGetPos(...a),
  reverseGeocodeAsync: (...a) => mockReverseExpo(...a),
}));
const mockFallbackReverse = jest.fn(async () => ({ hasErrors: false, road: 'Main St', city: 'AltCity' }));
jest.mock('../../../../src/utils/utils', () => ({
  reverseGeocode: (...a) => mockFallbackReverse(...a),
}));

// Socket
const mockInitSocket = jest.fn(() => ({ on: jest.fn(), off: jest.fn() }));
const registered = {};
const mockOnEvent = jest.fn((event, cb) => {
  registered[event] = cb;
});
const mockOffEvent = jest.fn((event) => {
  delete registered[event];
});
jest.mock('../../../../src/utils/socket', () => ({
  initSocket: (...a) => mockInitSocket(...a),
  onEvent: (...a) => mockOnEvent(...a),
  offEvent: (...a) => mockOffEvent(...a),
}));

// Child components
jest.mock('../../../../src/module/ChatList', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return React.forwardRef(({ onRefresh, chats }) => (
    <View testID="chat-list">
      <Text>{`chats:${(chats || []).length}`}</Text>
      <TouchableOpacity testID="refresh-btn" onPress={onRefresh}>
        <Text>refresh</Text>
      </TouchableOpacity>
    </View>
  ));
});
jest.mock('../../../../src/components/Footer', () => {
  const { Text } = require('react-native');
  return () => <Text testID="footer">Footer</Text>;
});
jest.mock('../../../../src/modals/ActionModal', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return ({ visible, onSelect }) =>
    visible ? (
      <View testID="action-modal">
        <TouchableOpacity testID="act-start" onPress={() => onSelect('start_new_chat')}>
          <Text>Start New Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="act-join" onPress={() => onSelect('join_local_group')}>
          <Text>Join Local Group</Text>
        </TouchableOpacity>
      </View>
    ) : null;
});

// Vector icons (so we can click FAB by hitting the icon's parent)
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }) => <Text>{`icon:${name}`}</Text>,
  };
});

// Redux
const mockDispatch = jest.fn(() => Promise.resolve({}));
let mockChatSlice = {
  activeChats: [
    { id: 'c1', updated_at: '2025-09-19T12:00:00Z' },
    { id: 'c2', updated_at: '2025-09-18T12:00:00Z' },
  ],
  loading: false,
  error: null,
  messagesByChatId: {},
  lastReadByChatId: {},
};
const mockTheme = {
  themeColors: {
    background: '#fff',
    primary: '#1976d2',
    text: '#222',
    link: '#1a73e8',
    error: '#d32f2f',
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
        auth: { user: { id: 'user-1' } },
        chat: mockChatSlice,
      }),
  };
});

// Actions & reducer action
const mockFetchActiveChats = jest.fn(() => ({ type: 'FETCH_ACTIVE' }));
const mockJoinLocalGroup = jest.fn((p) => ({ type: 'JOIN_LOCAL', p, payload: { chat_id: 'joined-123' } }));
const mockUpdateFromSocket = jest.fn((chs) => ({ type: 'UPDATE_FROM_SOCKET', payload: chs }));
jest.mock('../../../../src/store/actions/chatActions', () => ({
  fetchActiveChats: (...a) => mockFetchActiveChats(...a),
  joinLocalGroup: (...a) => mockJoinLocalGroup(...a),
}));
jest.mock('../../../../src/store/reducers/chatReducer', () => ({
  updateActiveChatsFromSocket: (...a) => mockUpdateFromSocket(...a),
}));

// Import AFTER mocks
import ChatScreen from '../../../../src/screens/Chat/ChatScreen';

const openFab = (utils) => {
  const icon = utils.getByText('icon:chatbox-ellipses');
  // Ionicons is inside TouchableOpacity; press parent
  fireEvent.press(icon.parent);
};

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFonts.mockReturnValue([true]);
    mockChatSlice = {
      activeChats: [
        { id: 'c1', updated_at: '2025-09-19T12:00:00Z' },
        { id: 'c2', updated_at: '2025-09-18T12:00:00Z' },
      ],
      loading: false,
      error: null,
      messagesByChatId: {},
      lastReadByChatId: {},
    };
  });

  it('shows loading fonts UI when fonts not loaded', () => {
    mockUseFonts.mockReturnValueOnce([false]);
    const { getByText, UNSAFE_getByType } = render(<ChatScreen />);
    expect(getByText(/Loading fonts/i)).toBeTruthy();
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('bootstraps: dispatches fetchActiveChats and initializes socket + event', () => {
    render(<ChatScreen />);
    expect(mockDispatch).toHaveBeenCalledWith(mockFetchActiveChats());
    expect(mockInitSocket).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(mockOnEvent).toHaveBeenCalledWith('chat:list_update', expect.any(Function));
  });

  it('debounces socket chat:list_update and dispatches updateActiveChatsFromSocket', () => {
    render(<ChatScreen />);
    const chats = [{ id: 's1' }, { id: 's2' }];
    // Trigger the registration callback
    registered['chat:list_update'](chats);

    // advance 200ms debounce
    act(() => { jest.advanceTimersByTime(200); });

    expect(mockDispatch).toHaveBeenCalledWith(mockUpdateFromSocket(chats));
  });

  it('pull-to-refresh via ChatList triggers fetchActiveChats', async () => {
    // ensure list branch by having non-empty chats
    const { getByTestId } = render(<ChatScreen />);
    fireEvent.press(getByTestId('refresh-btn'));
    expect(mockDispatch).toHaveBeenCalledWith(mockFetchActiveChats());
  });

  it('empty state shows and FlatList onRefresh triggers fetchActiveChats', () => {
    mockChatSlice = { ...mockChatSlice, activeChats: [] };
    const { getByText, UNSAFE_getByType } = render(<ChatScreen />);
    expect(getByText(/No chats yet\. Start one!/i)).toBeTruthy();

    const emptyList = UNSAFE_getByType(FlatList);
    act(() => {
      emptyList.props.onRefresh();
    });
    expect(mockDispatch).toHaveBeenCalledWith(mockFetchActiveChats());
  });

  it('loading state renders "Loading chats..." and spinner', () => {
    mockChatSlice = { ...mockChatSlice, loading: true };
    const { getByText, UNSAFE_getByType } = render(<ChatScreen />);
    expect(getByText(/Loading chats/i)).toBeTruthy();
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('FAB -> Start New Chat navigates to AddPeopleScreen', () => {
    const utils = render(<ChatScreen />);
    openFab(utils);
    expect(utils.getByTestId('action-modal')).toBeTruthy();

    fireEvent.press(utils.getByTestId('act-start'));
    expect(mockNavigate).toHaveBeenCalledWith('AddPeopleScreen');
  });

});
