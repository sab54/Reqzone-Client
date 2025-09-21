// __tests__/unit/modals/ThreadModal.test.js

/**
 * ThreadModal.test.js
 *
 * What This Test File Covers:
 *
 * 1) Basic Rendering
 *    - Renders original message text, existing replies list, input, send and Close controls.
 *
 * 2) Add Reply Flow
 *    - Types a reply and sends it. Verifies ChatContext.addReply gets called with (chatId, message.id, text)
 *      and that the input is cleared afterwards.
 *
 * 3) Prevent Empty Reply
 *    - Attempts to send a blank/whitespace-only reply; ensures addReply is not called.
 *
 * 4) Close Action
 *    - Pressing "Close" calls the provided onClose handler.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ThreadModal from 'src/modals/ThreadModal';
import { ChatContext } from 'src/context/ChatContext';

// Stub predictable time formatting so assertions are stable
jest.mock('src/utils/utils', () => ({
  __esModule: true,
  default: jest.fn(() => '10:00'),
}));

// Theme minimal set used by the component styles
const theme = {
  background: '#fff',
  surface: '#fafafa',
  text: '#111',
  mutedText: '#666',
  input: '#fff',
  inputText: '#111',
  divider: '#ddd',
  link: '#0a84ff',
  placeholder: '#999',
};

const baseMessage = {
  id: 'msg-1',
  text: 'Original message text',
  timestamp: Date.now(),
  replies: [
    { id: 'r1', text: 'First reply', timestamp: Date.now() - 10000 },
    { id: 'r2', text: 'Second reply', timestamp: Date.now() - 5000 },
  ],
};

const renderWithContext = (ui, { addReply = jest.fn() } = {}) => {
  return {
    addReply,
    ...render(
      <ChatContext.Provider value={{ addReply }}>
        {ui}
      </ChatContext.Provider>
    ),
  };
};

describe('ThreadModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders original message, replies list, input, and Close control', () => {
    const onClose = jest.fn();
    const { getByText, getByPlaceholderText } = renderWithContext(
      <ThreadModal
        visible
        onClose={onClose}
        message={baseMessage}
        chatId="chat-123"
        theme={theme}
      />
    );

    // Original message
    expect(getByText('Original message text')).toBeTruthy();

    // Replies
    expect(getByText('First reply')).toBeTruthy();
    expect(getByText('Second reply')).toBeTruthy();

    // Input + Close
    expect(getByPlaceholderText('Write a reply...')).toBeTruthy();
    expect(getByText('Close')).toBeTruthy();

    // Send icon from @expo/vector-icons mock renders as "feather:send"
    expect(getByText('feather:send')).toBeTruthy();
  });

  it('sends a reply via ChatContext.addReply and clears input', () => {
    const onClose = jest.fn();
    const { addReply, getByPlaceholderText, getByText, queryByDisplayValue } =
      renderWithContext(
        <ThreadModal
          visible
          onClose={onClose}
          message={baseMessage}
          chatId="chat-123"
          theme={theme}
        />
      );

    // Type a reply
    const input = getByPlaceholderText('Write a reply...');
    fireEvent.changeText(input, 'Hello there');

    // Press the send button (Touchable with Feather icon mocked as text)
    fireEvent.press(getByText('feather:send'));

    // Correct call shape
    expect(addReply).toHaveBeenCalledWith('chat-123', 'msg-1', 'Hello there');

    // Input should be cleared
    expect(queryByDisplayValue('Hello there')).toBeNull();
  });

  it('does not send when reply is blank or whitespace only', () => {
    const onClose = jest.fn();
    const { addReply, getByPlaceholderText, getByText } = renderWithContext(
      <ThreadModal
        visible
        onClose={onClose}
        message={baseMessage}
        chatId="chat-123"
        theme={theme}
      />
    );

    const input = getByPlaceholderText('Write a reply...');
    fireEvent.changeText(input, '    ');

    fireEvent.press(getByText('feather:send'));
    expect(addReply).not.toHaveBeenCalled();
  });

  it('pressing Close calls onClose', () => {
    const onClose = jest.fn();
    const { getByText } = renderWithContext(
      <ThreadModal
        visible
        onClose={onClose}
        message={baseMessage}
        chatId="chat-123"
        theme={theme}
      />
    );

    fireEvent.press(getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('returns null when message is not provided', () => {
    const onClose = jest.fn();
    const { queryByText, queryByPlaceholderText } = renderWithContext(
      <ThreadModal
        visible
        onClose={onClose}
        message={null}
        chatId="chat-123"
        theme={theme}
      />
    );

    // Nothing from the modal should be present
    expect(queryByText('Original message text')).toBeNull();
    expect(queryByPlaceholderText('Write a reply...')).toBeNull();
  });
});
