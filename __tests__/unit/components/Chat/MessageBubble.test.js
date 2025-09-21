/**
 * MessageBubble.test.js
 *
 * What This Test File Covers:
 *
 * 1) Sender Awareness & Styling
 * 2) Long-Press Actions (Copy/React/Delete visibility)
 * 3) Location Message (opens geo: URL on Android)
 * 4) Quiz Message (navigates with numeric quizId)
 * 5) Poll Message & Reactions
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

// Component under test
import MessageBubble from '../../../../src/components/Chat/MessageBubble';

// Stable time formatting
jest.mock('src/utils/utils', () => jest.fn(() => '10:00'));

// Mock useNavigation to capture navigation calls
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

// Spy Alert & Linking
const spyAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
const spyOpenURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

// IMPORTANT: do NOT mock the whole 'react-native' module.
// Just spy on Clipboard.setString so we don't trigger TurboModule issues.
let clipboardSpy;
beforeEach(() => {
  const { Clipboard } = require('react-native');
  // Some RN versions expose Clipboard as a plain object; guard if missing
  if (Clipboard && typeof Clipboard.setString === 'function') {
    clipboardSpy = jest.spyOn(Clipboard, 'setString').mockImplementation(() => {});
  } else {
    // Fallback shim to avoid crashes if Clipboard is undefined
    require('react-native').Clipboard = { setString: jest.fn() };
    clipboardSpy = require('react-native').Clipboard.setString;
  }
});

afterEach(() => {
  jest.clearAllMocks();
  mockNavigate.mockClear();
});

const theme = {
  primary: '#3498db',
  surface: '#f5f5f5',
  text: '#111111',
  mutedText: '#aaaaaa',
  accent: '#f39c12',
  link: '#6c5ce7',
};

const findViewWithBg = (node, color) => {
  if (!node || typeof node !== 'object') return null;
  const { type, props, children } = node;
  const flatten = (style) => (Array.isArray(style) ? Object.assign({}, ...style) : style);
  if (type === 'View' && props && props.style) {
    const s = flatten(props.style);
    if (s && s.backgroundColor === color) return node;
  }
  if (Array.isArray(children)) {
    for (const c of children) {
      const found = findViewWithBg(c, color);
      if (found) return found;
    }
  }
  return null;
};

describe('MessageBubble', () => {
  test('sender awareness: shows/hides name and applies bubble color by isMe', () => {
    const myId = 'me';

    const { queryByText, toJSON, rerender } = render(
      <MessageBubble
        senderId={myId}
        theme={theme}
        message={{
          sender: { id: myId, name: 'Me' },
          content: 'Hello from me',
          timestamp: Date.now(),
        }}
      />
    );

    expect(queryByText('Me')).toBeNull();
    let tree = toJSON();
    expect(findViewWithBg(tree, theme.primary)).toBeTruthy();

    rerender(
      <MessageBubble
        senderId={myId}
        theme={theme}
        message={{
          sender: { id: 'other', name: 'Alice' },
          content: 'Hi from Alice',
          timestamp: Date.now(),
        }}
      />
    );
    expect(queryByText('Alice')).toBeTruthy();
    tree = toJSON();
    expect(findViewWithBg(tree, theme.surface)).toBeTruthy();
  });

  test('long-press opens modal; Copy/React work; Delete visible only for own messages', () => {
    const { getByText, queryByText, rerender } = render(
      <MessageBubble
        senderId="me"
        theme={theme}
        message={{
          sender: { id: 'me', name: 'Me' },
          content: 'Long press me',
          timestamp: Date.now(),
        }}
      />
    );

    fireEvent(getByText('Long press me'), 'longPress');
    fireEvent.press(getByText('Copy'));
    expect(clipboardSpy).toHaveBeenCalledWith('Long press me');

    fireEvent(getByText('Long press me'), 'longPress');
    fireEvent.press(getByText('React'));
    expect(spyAlert).toHaveBeenCalledWith('React', '❤️ reaction added (UI only)');

    fireEvent(getByText('Long press me'), 'longPress');
    expect(getByText('Delete')).toBeTruthy();

    rerender(
      <MessageBubble
        senderId="me"
        theme={theme}
        message={{
          sender: { id: 'other', name: 'Bob' },
          content: 'Other message',
          timestamp: Date.now(),
        }}
      />
    );
    fireEvent(getByText('Other message'), 'longPress');
    expect(queryByText('Delete')).toBeNull();
  });

  test('location message opens maps URL (platform-specific)', () => {
    const { Platform } = require('react-native');
    const lat = 12.34;
    const lng = 56.78;
    const content = `{latitude:${lat},longitude:${lng}}`;

    const expectedUrl = Platform.select({
      ios: `http://maps.apple.com/?ll=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}`,
    });

    const { getByText } = render(
      <MessageBubble
        senderId="me"
        theme={theme}
        message={{
          sender: { id: 'me', name: 'Me' },
          message_type: 'location',
          content,
          timestamp: Date.now(),
        }}
      />
    );

    fireEvent.press(getByText('Tap to view on Map'));
    expect(spyOpenURL).toHaveBeenCalledWith(expectedUrl);
  });


  test('quiz message shows "Take Quiz" and navigates with numeric quizId', () => {
    const { getByText } = render(
      <MessageBubble
        senderId="me"
        theme={theme}
        message={{
          sender: { id: 'me', name: 'Me' },
          message_type: 'quiz',
          content: 'Try this quick quiz [quizId:42]',
          timestamp: Date.now(),
        }}
      />
    );

    fireEvent.press(getByText('Take Quiz'));
    expect(mockNavigate).toHaveBeenCalledWith('Quiz', { quizId: 42 });
  });

  test('poll message renders options and triggers alert on vote; reactions show', () => {
    const { getByText } = render(
      <MessageBubble
        senderId="me"
        theme={theme}
        message={{
          sender: { id: 'other', name: 'Sam' },
          type: 'poll',
          poll: { question: 'Your pick?', options: ['A', 'B'] },
          reactions: [{ emoji: '🔥' }, { emoji: '🎉' }],
          timestamp: Date.now(),
        }}
      />
    );

    fireEvent.press(getByText('A'));
    expect(spyAlert).toHaveBeenCalledWith('Poll Vote', 'You voted for: A');
    expect(getByText('🔥')).toBeTruthy();
    expect(getByText('🎉')).toBeTruthy();
  });
});
