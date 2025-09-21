/**
 * chatReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State, socket update, typing users & markRead basics
 * 2) Queue pending messages → visible in both queues & timeline; clear queued
 * 3) Async flows: suggestions/activeChats loading, start DM / create group (dedupe + draft clear)
 * 4) Messages & chat maintenance: append/send (idempotent), fetchMessages (replace),
 *    deleteChat cleans state, markChatAsReadThunk, draft group ops, removeUserFromGroup, fetchChatById upsert
 */

import reducer, {
  updateActiveChatsFromSocket,
  appendMessage,
  queuePendingMessage,
  clearQueuedMessages,
  markChatAsRead,
  setTypingUser,
  removeTypingUser,
} from '../../../../src/store/reducers/chatReducer';

import {
  fetchUserSuggestions,
  fetchActiveChats,
  startDirectMessage,
  createGroupChat,
  fetchMessages,
  sendMessage,
  deleteChat,
  addUserToDraftGroup,
  removeUserFromDraftGroup,
  clearDraftGroupUsers,
  markChatAsReadThunk,
  removeUserFromGroup,
  fetchChatById,
} from '../../../../src/store/actions/chatActions';

const initial = {
  allUsers: [],
  draftGroupUsers: [],
  activeChats: [],
  messagesByChatId: {},
  lastReadByChatId: {},
  queuedMessagesByChatId: {},
  typingUsersByChatId: {},
  loading: false,
  error: null,
};

describe('chat reducer', () => {
  test('1) initial state, socket update array guard, typing users & mark read', () => {
    const s0 = reducer(undefined, { type: '@@INIT' });
    expect(s0).toEqual(initial);

    // socket update: array → set; non-array → []
    let s1 = reducer(s0, updateActiveChatsFromSocket([{ id: 1 }, { id: 2 }]));
    expect(s1.activeChats.map(c => c.id)).toEqual([1, 2]);

    s1 = reducer(s1, updateActiveChatsFromSocket(null));
    expect(s1.activeChats).toEqual([]);

    // typing users: add unique, prevent duplicate, remove
    const chatId = 'c1';
    s1 = reducer(s1, setTypingUser({ chatId, user: { id: 'u1', name: 'Ana' } }));
    s1 = reducer(s1, setTypingUser({ chatId, user: { id: 'u1', name: 'Ana' } })); // duplicate
    s1 = reducer(s1, setTypingUser({ chatId, user: { id: 'u2', name: 'Ben' } }));
    expect(s1.typingUsersByChatId[chatId].map(u => u.id)).toEqual(['u1', 'u2']);

    s1 = reducer(s1, removeTypingUser({ chatId, userId: 'u1' }));
    expect(s1.typingUsersByChatId[chatId].map(u => u.id)).toEqual(['u2']);

    // mark read (local reducer)
    s1 = reducer(s1, markChatAsRead({ chatId, messageId: 'm9' }));
    expect(s1.lastReadByChatId[chatId]).toBe('m9');
  });

  test('2) queue pending messages appear in both queued + timeline, then clear', () => {
    const chatId = 'inbox';
    let s = reducer(undefined, { type: '@@INIT' });

    // queue one
    s = reducer(s, queuePendingMessage({ chatId, senderId: 'me', message: 'hello' }));
    expect(Array.isArray(s.queuedMessagesByChatId[chatId])).toBe(true);
    expect(s.queuedMessagesByChatId[chatId]).toHaveLength(1);
    expect(s.messagesByChatId[chatId]).toHaveLength(1);

    const queued = s.queuedMessagesByChatId[chatId][0];
    expect(queued.status).toBe('pending');
    expect(queued.id.startsWith('temp-')).toBe(true);
    expect(queued.chat_id).toBe(chatId);
    expect(queued.sender.id).toBe('me');

    // queue another
    s = reducer(s, queuePendingMessage({ chatId, senderId: 'me', message: 'second' }));
    expect(s.queuedMessagesByChatId[chatId]).toHaveLength(2);
    expect(s.messagesByChatId[chatId]).toHaveLength(2);

    // clear queued (should remove only queue, not timeline)
    s = reducer(s, clearQueuedMessages(chatId));
    expect(s.queuedMessagesByChatId[chatId]).toBeUndefined();
    expect(s.messagesByChatId[chatId]).toHaveLength(2); // timeline remains
  });

  test('3) async flows: suggestions/activeChats loading, start DM & create group (dedupe + draft clear)', () => {
    let s = reducer(undefined, { type: fetchUserSuggestions.pending.type });
    expect(s.loading).toBe(true);
    expect(s.error).toBeNull();

    s = reducer(s, { type: fetchUserSuggestions.fulfilled.type, payload: [{ id: 'u1' }, { id: 'u2' }] });
    expect(s.loading).toBe(false);
    expect(s.allUsers).toEqual([{ id: 'u1' }, { id: 'u2' }]);

    s = reducer(s, { type: fetchUserSuggestions.rejected.type, payload: 'oops' });
    expect(s.loading).toBe(false);
    expect(s.error).toBe('oops');

    // active chats
    s = reducer(s, { type: fetchActiveChats.pending.type });
    s = reducer(s, { type: fetchActiveChats.fulfilled.type, payload: [{ id: 'c1' }] });
    expect(s.activeChats.map(c => c.id)).toEqual(['c1']);

    // start DM → unshift if absent, dedupe if present (checks id/chat_id)
    const dm = { chat_id: 'c2', title: 'DM Bob' };
    s = reducer(s, { type: startDirectMessage.fulfilled.type, payload: dm });
    expect(s.activeChats.map(c => c.chat_id || c.id)).toEqual(['c2', 'c1']);

    // try to add same again → no duplicate
    s = reducer(s, { type: startDirectMessage.fulfilled.type, payload: { chat_id: 'c2' } });
    expect(s.activeChats.map(c => c.chat_id || c.id)).toEqual(['c2', 'c1']);

    // create group → same dedupe + clears draftGroupUsers
    s = reducer(
      { ...s, draftGroupUsers: [{ id: 'u1' }, { id: 'u3' }] },
      { type: createGroupChat.fulfilled.type, payload: { chat_id: 'g1', title: 'Group' } }
    );
    expect(s.activeChats.map(c => c.chat_id || c.id)).toEqual(['g1', 'c2', 'c1']);
    expect(s.draftGroupUsers).toEqual([]);
  });

  test('4) messages + maintenance: append/send idempotent, fetchMessages replace, deleteChat cleanup, lastRead thunk, draft ops, removeUserFromGroup, fetchChatById upsert', () => {
    let s = reducer(undefined, { type: '@@INIT' });

    // appendMessage (local) is idempotent
    const chatId = 'c9';
    const m1 = { id: 'm1', content: 'hi' };
    s = reducer(s, appendMessage({ chatId, message: m1 }));
    s = reducer(s, appendMessage({ chatId, message: m1 })); // duplicate
    expect(s.messagesByChatId[chatId]).toHaveLength(1);

    // sendMessage.fulfilled: idempotent too
    const m2 = { id: 'm2', content: 'there' };
    s = reducer(s, { type: sendMessage.fulfilled.type, payload: { chatId, message: m2 } });
    s = reducer(s, { type: sendMessage.fulfilled.type, payload: { chatId, message: m2 } });
    expect(s.messagesByChatId[chatId].map(x => x.id)).toEqual(['m1', 'm2']);

    // fetchMessages replaces array
    s = reducer(s, { type: fetchMessages.fulfilled.type, payload: { chatId, messages: [{ id: 'mX' }] } });
    expect(s.messagesByChatId[chatId].map(x => x.id)).toEqual(['mX']);

    // markChatAsReadThunk (extra reducer)
    s = reducer(s, { type: markChatAsReadThunk.fulfilled.type, payload: { chatId, messageId: 'mX' } });
    expect(s.lastReadByChatId[chatId]).toBe('mX');

    // draft group user add/remove/clear
    s = reducer(s, { type: addUserToDraftGroup.fulfilled.type, payload: { id: 'u1' } });
    s = reducer(s, { type: addUserToDraftGroup.fulfilled.type, payload: { id: 'u1' } }); // dedupe
    s = reducer(s, { type: addUserToDraftGroup.fulfilled.type, payload: { id: 'u2' } });
    expect(s.draftGroupUsers.map(u => u.id)).toEqual(['u1', 'u2']);

    s = reducer(s, { type: removeUserFromDraftGroup.fulfilled.type, payload: 'u1' });
    expect(s.draftGroupUsers.map(u => u.id)).toEqual(['u2']);

    s = reducer(s, { type: clearDraftGroupUsers.fulfilled.type });
    expect(s.draftGroupUsers).toEqual([]);

    // seed active chat with members, then removeUserFromGroup
    s = reducer(s, updateActiveChatsFromSocket([{ chat_id: 'room', members: [{ id: 'u2' }, { id: 'u3' }] }]));
    s = reducer(s, { type: removeUserFromGroup.fulfilled.type, payload: { chatId: 'room', userId: 'u3' } });
    expect(s.activeChats[0].members.map(m => m.id)).toEqual(['u2']);

    // fetchChatById: upsert (replace existing if same id, else unshift)
    s = reducer(s, { type: fetchChatById.fulfilled.type, payload: { id: 'room', title: 'New Title' } });
    expect(s.activeChats[0].id).toBe('room');
    expect(s.activeChats[0].title).toBe('New Title');

    s = reducer(s, { type: fetchChatById.fulfilled.type, payload: { id: 'brandNew', title: 'Fresh' } });
    expect(s.activeChats.map(c => c.id || c.chat_id)).toEqual(['brandNew', 'room']);

    // deleteChat: removes from active list and its messages
    s = reducer(s, { type: fetchMessages.fulfilled.type, payload: { chatId: 'brandNew', messages: [{ id: 'm1' }] } });
    s = reducer(s, { type: deleteChat.fulfilled.type, payload: 'brandNew' });
    expect(s.activeChats.map(c => c.id || c.chat_id)).toEqual(['room']);
    expect(s.messagesByChatId.brandNew).toBeUndefined();
  });
});
