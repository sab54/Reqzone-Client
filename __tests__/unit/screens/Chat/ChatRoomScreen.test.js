// __tests__/unit/screens/ChatRoomScreen.test.js
/**
 * ChatRoomScreen.test.js
 *
 * What This Test File Covers:
 *
 * 1) Missing Chat
 *    - Renders "Chat not found." when active chat for route chatId is absent.
 *
 * 2) Bootstrap Fetch & Socket Join
 *    - On mount, with empty messages: dispatches fetchMessages(chatId) and fetchChatById(chatId),
 *      and calls joinChat(chatId).
 *
 * 3) Typing Emission
 *    - Typing starts emits 'chat:typing_start' and after 1500ms emits 'chat:typing_stop'.
 *
 * 4) Send Message (Online vs Offline)
 *    - Online: dispatches sendMessage with trimmed payload.
 *    - Offline: dispatches queuePendingMessage instead.
 *
 * 5) Read Receipt
 *    - When at bottom and messages exist, dispatches markChatAsReadThunk(chatId, latestId).
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Text, TextInput, ActivityIndicator } from 'react-native';

// ---- Fake timers for typing debounce ----
beforeAll(() => jest.useFakeTimers());
afterAll(() => jest.useRealTimers());

// ---- Mocks ----

// Route / Navigation
let mockChatId = 'chat-1';
const mockReset = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { chatId: mockChatId } }),
  useNavigation: () => ({ reset: mockReset }),
}));

// Safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Medium: 'Medium' },
  NotificationFeedbackType: { Success: 'Success' },
}));

// NetInfo: let tests control connectivity
let mockIsConnected = true;
const mockAddEvt = jest.fn((cb) => {
  // Immediately provide current connectivity to subscriber
  cb({ isConnected: mockIsConnected });
  return () => {};
});
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: (...args) => mockAddEvt(...args),
}));

// Socket utils
const mockJoin = jest.fn();
const mockLeave = jest.fn();
const mockEmit = jest.fn();
const mockOnEvent = jest.fn();
const mockOffEvent = jest.fn();
const mockSocket = { connected: true, on: jest.fn(), off: jest.fn() };
jest.mock('../../../../src/utils/socket', () => ({
  getSocket: () => mockSocket,
  joinChat: (...a) => mockJoin(...a),
  leaveChat: (...a) => mockLeave(...a),
  emitEvent: (...a) => mockEmit(...a),
  onEvent: (...a) => mockOnEvent(...a),
  offEvent: (...a) => mockOffEvent(...a),
}));

// Geo util (only used when action modal opens; not needed in baseline tests)
jest.mock('../../../../src/utils/utils', () => ({
  getUserLocation: async () => ({ lat: 1, lng: 2 }),
}));

// Components / Modals (shallow stubs)
jest.mock('../../../../src/components/Chat/MessageBubble', () => {
  const { Text } = require('react-native');
  return ({ message }) => <Text>{`msg:${message?.id}`}</Text>;
});
jest.mock('../../../../src/components/Chat/TypingIndicator', () => {
  const { Text } = require('react-native');
  return ({ usernames }) => <Text>{`typing:${(usernames||[]).length}`}</Text>;
});
jest.mock('../../../../src/modals/ThreadModal', () => {
  const { View } = require('react-native');
  return () => <View testID="thread-modal" />;
});
jest.mock('../../../../src/modals/GroupInfoModal', () => {
  const { View } = require('react-native');
  return () => <View testID="group-info-modal" />;
});
jest.mock('../../../../src/modals/ActionModal', () => {
  const { View } = require('react-native');
  return (props) => (props.visible ? <View testID="action-modal" /> : null);
});
jest.mock('../../../../src/modals/QuizPromptModal', () => {
  const { View } = require('react-native');
  return (props) => (props.visible ? <View testID="quiz-modal" /> : null);
});

// Selectors
let mockMessages = [];
let mockTypingUsers = [];
jest.mock('../../../../src/store/selectors/chatSelectors', () => ({
  selectMessagesByChatId:
    (id) =>
    () =>
      mockMessages,
  selectTypingUsersByChatId:
    (id) =>
    () =>
      mockTypingUsers,
}));

// Redux and actions
const mockDispatch = jest.fn(() => ({ unwrap: () => Promise.resolve({}) }));

const mockFetchMessages = jest.fn((id) => ({ type: 'FETCH_MESSAGES', id }));
const mockMarkRead = jest.fn((id, mid) => ({ type: 'MARK_READ', id, mid }));
const mockSendMessage = jest.fn((p) => ({ type: 'SEND', p }));
const mockQueueMsg = jest.fn((p) => ({ type: 'QUEUE', p }));
const mockFlushQueue = jest.fn((id) => ({ type: 'FLUSH', id }));
const mockFetchChatById = jest.fn((id) => ({ type: 'FETCH_CHAT', id }));

// reducer helpers (not directly dispatched in these tests)
jest.mock('../../../../src/store/reducers/chatReducer', () => ({
  appendMessage: jest.fn(),
  setTypingUser: jest.fn(),
  removeTypingUser: jest.fn(),
}));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (sel) =>
      sel({
        theme: { themeColors: {
          background: '#fff', headerBackground: '#f8f8f8', surface: '#f6f6f6', divider: '#eee',
          input: '#fff', inputText: '#111', placeholder: '#999',
          primary: '#1976d2', link: '#1a73e8', error: '#d32f2f',
          title: '#000', text: '#222', accent: '#9c27b0',
        }},
        auth: { user: { id: 101 } },
        chat: {
          activeChats: [{ id: 'chat-1', is_group: false, members: [{ id: 101, name: 'Me' }, { id: 202, name: 'Alice' }] }],
          lastReadByChatId: { 'chat-1': null },
          loading: false,
        },
      }),
  };
});

jest.mock('../../../../src/store/actions/chatActions', () => ({
  sendMessage: (...a) => mockSendMessage(...a),
  fetchMessages: (...a) => mockFetchMessages(...a),
  markChatAsReadThunk: (...a) => mockMarkRead(...a),
  queuePendingMessage: (...a) => mockQueueMsg(...a),
  flushQueuedMessages: (...a) => mockFlushQueue(...a),
  fetchChatById: (...a) => mockFetchChatById(...a),
}));

// Quiz action (not exercised in baseline tests)
jest.mock('../../../../src/store/actions/quizActions', () => ({
  generateQuizAI: jest.fn(() => ({ type: 'GEN_QZ' })),
}));

// Feather / Ionicons (so we can press the send-button parent reliably)
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Feather: ({ name }) => <Text>{`icon:${name}`}</Text>,
    Ionicons: ({ name }) => <Text>{`icon:${name}`}</Text>,
  };
});

// Import after mocks
import ChatRoomScreen from '../../../../src/screens/Chat/ChatRoomScreen';

const getComposerInput = (utils) => utils.UNSAFE_getByType(TextInput);

describe('ChatRoomScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatId = 'chat-1';
    mockIsConnected = true;
    mockMessages = [];
    mockTypingUsers = [];
    mockDispatch.mockImplementation(() => ({ unwrap: () => Promise.resolve({}) }));
  });

  it('renders "Chat not found." if active chat missing', () => {
    // Change route to an unknown chat
    mockChatId = 'missing';
    const { getByText } = render(<ChatRoomScreen />);
    expect(getByText('Chat not found.')).toBeTruthy();
  });

  it('bootstraps: fetches messages & chat, and joins socket room', () => {
    render(<ChatRoomScreen />);
    expect(mockFetchMessages).toHaveBeenCalledWith('chat-1');
    expect(mockFetchChatById).toHaveBeenCalledWith('chat-1');
    expect(mockJoin).toHaveBeenCalledWith('chat-1');
  });

  it('emits typing start, then typing stop after 1500ms', () => {
    const utils = render(<ChatRoomScreen />);
    const input = getComposerInput(utils);

    fireEvent.changeText(input, 'H');
    expect(mockEmit).toHaveBeenCalledWith('chat:typing_start', {
      chatId: 'chat-1',
      userId: 101,
    });

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(mockEmit).toHaveBeenCalledWith('chat:typing_stop', {
      chatId: 'chat-1',
      userId: 101,
    });
  });

  it('sends message online via sendMessage', async () => {
    const utils = render(<ChatRoomScreen />);
    const input = getComposerInput(utils);

    // Type and press the send button by pressing the Feather text's parent
    fireEvent.changeText(input, '  hello world  ');
    const sendIcon = utils.getByText('icon:send');
    await act(async () => {
      fireEvent.press(sendIcon.parent);
    });

    expect(mockSendMessage).toHaveBeenCalledWith({
      chatId: 'chat-1',
      senderId: 101,
      message: 'hello world',
    });
    expect(mockQueueMsg).not.toHaveBeenCalled();
  });

  it('queues message when offline', async () => {
    mockIsConnected = false; // NetInfo provides offline on subscription
    const utils = render(<ChatRoomScreen />);
    const input = getComposerInput(utils);

    fireEvent.changeText(input, 'offline msg');
    const sendIcon = utils.getByText('icon:send');
    await act(async () => {
      fireEvent.press(sendIcon.parent);
    });

    expect(mockQueueMsg).toHaveBeenCalledWith({
      chatId: 'chat-1',
      senderId: 101,
      message: 'offline msg',
    });
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('marks chat as read when at bottom and messages exist', () => {
    // Provide messages; the component reads latest at index 0 of reversed array,
    // but uses messages[0].id in effect when isAtBottom is true.
    mockMessages = [{ id: 111, message: 'first' }, { id: 222, message: 'second' }];

    render(<ChatRoomScreen />);

    // Expect mark as read with latest id (messages[0].id from selector)
    expect(mockMarkRead).toHaveBeenCalledWith('chat-1', 111);
  });

  it('shows spinner when loading messages in state', () => {
    // Override useSelector once to flip loading
    const rr = require('react-redux');
    const origUseSelector = rr.useSelector;
    jest.spyOn(rr, 'useSelector').mockImplementation((sel) =>
      sel({
        theme: { themeColors: { background: '#fff', headerBackground: '#f8f8f8', surface: '#f6f6f6', divider: '#eee',
          input: '#fff', inputText: '#111', placeholder: '#999', primary: '#1976d2', link: '#1a73e8',
          error: '#d32f2f', title: '#000', text: '#222', accent: '#9c27b0' } },
        auth: { user: { id: 101 } },
        chat: { activeChats: [{ id: 'chat-1', is_group: false, members: [{ id: 101 }, { id: 202 }] }],
                lastReadByChatId: { 'chat-1': null }, loading: true },
      })
    );

    const { UNSAFE_getByType } = render(<ChatRoomScreen />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    rr.useSelector.mockImplementation(origUseSelector);
  });
});
