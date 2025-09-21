// __tests__/unit/context/ChatContext.test.js
import React, { useContext, useEffect } from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { ChatProvider, ChatContext } from '../../../src/context/ChatContext';

const idQueue = [
  'chat-1', 'alice-1', 'bob-1', // startNewChat
  'msg-1',                      // user message
  'bot-1',                      // bot sender
  'reply-1', 'extra-1', 'extra-2',
];
jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => idQueue.shift()),
}));

function Reader({ onReady }) {
  const value = useContext(ChatContext);
  useEffect(() => { onReady(value); });
  return null;
}

function setup(onReady = () => {}) {
  return render(
    <ChatProvider>
      <Reader onReady={onReady} />
    </ChatProvider>
  );
}
const parseState = (ctx) => ctx.chats;

describe('ChatContext', () => {
  beforeAll(() => { jest.useFakeTimers(); });
  afterAll(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('startNewChat creates a new chat with default members', async () => {
    let ctx;
    setup((v) => (ctx = v));

    act(() => { ctx.startNewChat(); });

    await waitFor(() => {
      expect(parseState(ctx)).toHaveLength(1);
    });

    const chat = parseState(ctx)[0];
    expect(chat.id).toBe('chat-1');
    expect(chat.name).toBe('Group 1');
    expect(chat.members.map((m) => m.id)).toEqual(['alice-1', 'bob-1']);
    expect(chat.messages).toEqual([]);
    expect(chat.typing).toBe(false);
  });

test('sendMessage adds user message then triggers typing & bot reply after 2s', async () => {
  let ctx;
  setup((v) => (ctx = v));

  act(() => { ctx.startNewChat(); });

  // Wait for chat creation and capture its real id
  await waitFor(() => expect(parseState(ctx)).toHaveLength(1));
  let chat = parseState(ctx)[0];
  const chatId = chat.id;

  act(() => { ctx.sendMessage(chatId, 'Hello!'); });

  // Wait for message to appear and typing=true
  await waitFor(() => {
    const c = parseState(ctx)[0];
    expect(c.messages.length).toBe(1);
    expect(c.typing).toBe(true);
  });

  // Optional shape check (no hard-coded id)
  chat = parseState(ctx)[0];
  expect(chat.messages[0]).toMatchObject({
    text: 'Hello!',
    sender: { id: 'me', name: 'You' },
    reactions: [],
    replies: [],
  });

  // After 2s the bot reply arrives
  act(() => { jest.advanceTimersByTime(2000); });

  await waitFor(() => {
    const c = parseState(ctx)[0];
    expect(c.typing).toBe(false);
    expect(c.messages.length).toBe(2);
  });

  chat = parseState(ctx)[0];
  expect(chat.messages[0]).toMatchObject({
    text: 'Got it!',
    sender: { name: 'Bot' },
  });
});


  test('sendMessage ignores blank/whitespace-only text', async () => {
    let ctx;
    setup((v) => (ctx = v));

    act(() => { ctx.startNewChat(); });
    await waitFor(() => expect(parseState(ctx)).toHaveLength(1));

    act(() => { ctx.sendMessage('chat-1', '   '); });

    // no messages added, no typing started
    await waitFor(() => {
      const chat = parseState(ctx)[0];
      expect(chat.messages).toHaveLength(0);
      expect(chat.typing).toBe(false);
    });
  });

test('addReply appends a reply to a message; ignores blank reply', async () => {
  let ctx;
  setup((v) => (ctx = v));

  act(() => { ctx.startNewChat(); });
  await waitFor(() => expect(parseState(ctx)).toHaveLength(1));
  const chatId = parseState(ctx)[0].id;

  act(() => { ctx.sendMessage(chatId, 'Hello!'); });
  await waitFor(() => expect(parseState(ctx)[0].messages.length).toBe(1));

  // Grab real messageId
  let chat = parseState(ctx)[0];
  const messageId = chat.messages[0].id;

  // Blank reply ignored
  act(() => { ctx.addReply(chatId, messageId, '   '); });
  chat = parseState(ctx)[0];
  expect(chat.messages[0].replies).toHaveLength(0);

  // Valid reply
  act(() => { ctx.addReply(chatId, messageId, 'Thanks!'); });
  await waitFor(() => expect(parseState(ctx)[0].messages[0].replies.length).toBe(1));

  chat = parseState(ctx)[0];
  expect(chat.messages[0].replies[0]).toMatchObject({ text: 'Thanks!' });
});


test('addReaction appends a reaction { emoji } to a message', async () => {
  let ctx;
  setup((v) => (ctx = v));

  act(() => { ctx.startNewChat(); });
  await waitFor(() => expect(parseState(ctx)).toHaveLength(1));
  const chatId = parseState(ctx)[0].id;

  act(() => { ctx.sendMessage(chatId, 'Hello!'); });
  await waitFor(() => expect(parseState(ctx)[0].messages.length).toBe(1));

  let chat = parseState(ctx)[0];
  const messageId = chat.messages[0].id;
  expect(chat.messages[0].reactions).toHaveLength(0);

  act(() => { ctx.addReaction(chatId, messageId, '👍'); });
  await waitFor(() => expect(parseState(ctx)[0].messages[0].reactions.length).toBe(1));

  chat = parseState(ctx)[0];
  expect(chat.messages[0].reactions[0]).toEqual({ emoji: '👍' });
});

});
