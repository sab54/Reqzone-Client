/**
 * chatActions.test.js
 *
 * What These Tests Cover (5):
 * 1) fetchActiveChats
 *    - returns current user's chats
 * 2) fetchUserSuggestions
 *    - filters out current user from suggestions
 * 3) startDirectMessage
 *    - posts correct payload and maps API response
 * 4) removeUserFromGroup
 *    - calls DELETE with params and returns numeric ids
 * 5) flushQueuedMessages
 *    - posts each queued message, dispatches appendMessage for each, then clearQueuedMessages
 */

import { configureStore } from '@reduxjs/toolkit';

// ---- Mock external modules used by the thunks ----
jest.mock('../../../../src/utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  del: jest.fn(),
}));

jest.mock('../../../../src/utils/apiPaths', () => ({
  API_URL_CHAT: 'https://api.example.com/chat',
  API_URL_USERS: 'https://api.example.com/users',
}));

// ✅ Define reducer action mocks INSIDE the factory to satisfy Jest hoisting rule
jest.mock('../../../../src/store/reducers/chatReducer', () => {
  return {
    appendMessage: jest.fn((payload) => ({ type: 'chat/appendMessage', payload })),
    clearQueuedMessages: jest.fn((chatId) => ({ type: 'chat/clearQueuedMessages', payload: chatId })),
    markChatAsRead: jest.fn((payload) => ({ type: 'chat/markChatAsRead', payload })),
  };
});

// Bring in the mocked APIs
import { get, post, del } from '../../../../src/utils/api';

// Import the mocked reducer action creators so we can assert on them
import {
  appendMessage as mockedAppendMessage,
  clearQueuedMessages as mockedClearQueuedMessages,
  markChatAsRead as mockedMarkChatAsRead,
} from '../../../../src/store/reducers/chatReducer';

// Import thunks AFTER mocks so they see mocked modules
import * as chat from '../../../../src/store/actions/chatActions';

// Minimal store that preserves provided preloaded state
const makeStore = (preloadedState) =>
  configureStore({
    reducer: (state = preloadedState) => state,
    middleware: (gdm) => gdm({ serializableCheck: false }),
    preloadedState,
  });

beforeEach(() => {
  jest.clearAllMocks();
});

// 1) fetchActiveChats
describe('fetchActiveChats', () => {
  it('returns chats for the current user', async () => {
    const initial = { auth: { user: { id: 'u-1' } } };
    get.mockResolvedValueOnce({ data: [{ id: 10 }, { id: 11 }] });

    const store = makeStore(initial);
    const action = await store.dispatch(chat.fetchActiveChats());

    expect(action.type).toMatch(/chat\/fetchActiveChats\/fulfilled$/);
    expect(get).toHaveBeenCalledWith('https://api.example.com/chat/list/u-1');
    expect(action.payload).toEqual([{ id: 10 }, { id: 11 }]);
  });
});

// 2) fetchUserSuggestions
describe('fetchUserSuggestions', () => {
  it('filters out current user from suggestions', async () => {
    const initial = { auth: { user: { id: 'me' } } };
    get.mockResolvedValueOnce({
      data: [{ id: 'me', name: 'Me' }, { id: 'u2', name: 'Them' }],
    });

    const store = makeStore(initial);
    const action = await store.dispatch(chat.fetchUserSuggestions('th'));

    expect(action.type).toMatch(/chat\/fetchUserSuggestions\/fulfilled$/);
    expect(get).toHaveBeenCalledWith(
      'https://api.example.com/users/suggestions?search=th'
    );
    // Should exclude current user "me"
    expect(action.payload).toEqual([{ id: 'u2', name: 'Them' }]);
  });
});

// 3) startDirectMessage
describe('startDirectMessage', () => {
  it('posts correct payload and maps response', async () => {
    const initial = { auth: { user: { id: 'me' } } };

    post.mockResolvedValueOnce({
      chat: {
        id: 55,
        name: 'DM: me & u2',
        members: [{ id: 'me' }, { id: 'u2' }],
      },
      extra: 'value',
    });

    const store = makeStore(initial);
    const action = await store.dispatch(chat.startDirectMessage('u2'));

    expect(post).toHaveBeenCalledWith('https://api.example.com/chat/create', {
      user_id: 'me',
      participant_ids: ['u2'],
      is_group: false,
    });

    expect(action.type).toMatch(/chat\/startDirectMessage\/fulfilled$/);
    expect(action.payload).toMatchObject({
      chat_id: 55,
      is_group: false,
      name: 'DM: me & u2',
      members: [{ id: 'me' }, { id: 'u2' }],
      chat: { id: 55 },
      extra: 'value',
    });
  });
});

// 4) removeUserFromGroup
describe('removeUserFromGroup', () => {
  it('deletes with params and returns numeric ids', async () => {
    const initial = { auth: { user: { id: 'admin' } } };
    del.mockResolvedValueOnce(undefined);

    const store = makeStore(initial);
    const action = await store.dispatch(
      chat.removeUserFromGroup({ chatId: '101', userId: '202' })
    );

    expect(del).toHaveBeenCalledWith(
      'https://api.example.com/chat/101/remove-member',
      { user_id: '202', requested_by: 'admin' }
    );
    expect(action.type).toMatch(/chat\/removeUserFromGroup\/fulfilled$/);
    // Should be numbers as per thunk return
    expect(action.payload).toEqual({ chatId: 101, userId: 202 });
  });
});

// 5) flushQueuedMessages
describe('flushQueuedMessages', () => {
  it('posts each queued message, dispatches appendMessage, then clearQueuedMessages', async () => {
    const initial = {
      auth: { user: { id: 'me' } },
      chat: {
        queuedMessagesByChatId: {
          '77': [
            { sender_id: 'me', content: 'hello', message_type: 'text' },
            { sender_id: 'me', content: 'pic', message_type: 'image' },
          ],
        },
      },
    };

    // Mock post for each queued message call
    post
      .mockResolvedValueOnce({ message_id: 'm1' })
      .mockResolvedValueOnce({ message_id: 'm2' });

    const store = makeStore(initial);
    await store.dispatch(chat.flushQueuedMessages('77'));

    // Two posts (for 2 queued messages)
    expect(post).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/chat/77/messages',
      { sender_id: 'me', message: 'hello', message_type: 'text' }
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/chat/77/messages',
      { sender_id: 'me', message: 'pic', message_type: 'image' }
    );

    // appendMessage should be dispatched twice with mapped payloads
    expect(mockedAppendMessage).toHaveBeenCalledTimes(2);
    const firstPayload = mockedAppendMessage.mock.calls[0][0];
    const secondPayload = mockedAppendMessage.mock.calls[1][0];

    expect(firstPayload).toMatchObject({
      chatId: '77',
      message: {
        id: 'm1',
        chat_id: '77',
        sender: { id: 'me' },
        content: 'hello',
        message_type: 'text',
      },
    });
    expect(secondPayload).toMatchObject({
      chatId: '77',
      message: {
        id: 'm2',
        chat_id: '77',
        sender: { id: 'me' },
        content: 'pic',
        message_type: 'image',
      },
    });

    // And finally, clearQueuedMessages for that chat
    expect(mockedClearQueuedMessages).toHaveBeenCalledTimes(1);
    expect(mockedClearQueuedMessages).toHaveBeenCalledWith('77');
  });

  it('no-ops when no queued messages exist', async () => {
    const initial = {
      auth: { user: { id: 'me' } },
      chat: { queuedMessagesByChatId: {} },
    };

    const store = makeStore(initial);
    await store.dispatch(chat.flushQueuedMessages('999'));

    expect(post).not.toHaveBeenCalled();
    expect(mockedAppendMessage).not.toHaveBeenCalled();
    expect(mockedClearQueuedMessages).not.toHaveBeenCalled();
  });
});
