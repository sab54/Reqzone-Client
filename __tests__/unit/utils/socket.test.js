/**
 * __tests__/unit/utils/socket.test.js
 *
 * What this test file covers:
 *
 * 1. initSocket
 *    - Creates socket with expected params and, on connect, emits join_user_room.
 *
 * 2. emitEvent, joinChat, leaveChat, typing indicators
 *    - Do nothing before connection; emit when connected.
 *
 * 3. disconnectSocket
 *    - Calls disconnect() and clears internal socket reference.
 *
 * 4. onEvent/offEvent
 *    - Delegates to socket.on / socket.off.
 */

jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

// Mock BASE_URL consumed by the module
jest.mock('src/utils/config', () => ({
  BASE_URL: 'http://test.local',
}));

import { io } from 'socket.io-client';
import {
  initSocket,
  getSocket,
  disconnectSocket,
  emitEvent,
  onEvent,
  offEvent,
  joinChat,
  leaveChat,
  sendTypingStart,
  sendTypingStop,
} from 'src/utils/socket';

describe('utils/socket', () => {
  let mockSocket;

  const makeMockSocket = () => ({
    on: jest.fn(function (event, cb) {
      this._listeners[event] = cb;
    }),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    _listeners: {},
    id: 'sock-123',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = makeMockSocket();
    io.mockReturnValue(mockSocket);

    // Ensure module internal state is clean between tests
    try {
      disconnectSocket();
    } catch {}
  });

  afterEach(() => {
    // Safety cleanup to avoid cross-test leakage of module-level socket
    try {
      disconnectSocket();
    } catch {}
  });

  it('initSocket creates a socket and handles connect event', () => {
    const socket = initSocket({ userId: 'u1', token: 't0k' });

    expect(io).toHaveBeenCalledWith(
      'http://test.local',
      expect.objectContaining({
        transports: ['websocket'],
        forceNew: true,
        query: expect.objectContaining({ userId: 'u1', token: 't0k' }),
      })
    );

    // Simulate connect
    expect(typeof mockSocket._listeners.connect).toBe('function');
    mockSocket._listeners.connect();

    expect(mockSocket.emit).toHaveBeenCalledWith('join_user_room', 'u1');
    expect(getSocket()).toBe(socket);
  });

  it('emitEvent, joinChat, leaveChat, typing events emit only when connected', () => {
    initSocket({ userId: 'u2', token: 'tok' });

    // Before connect → no emit for generic event
    emitEvent('custom_event', { x: 1 });
    expect(mockSocket.emit).not.toHaveBeenCalledWith('custom_event', { x: 1 });

    // Simulate connect
    mockSocket._listeners.connect();

    emitEvent('custom_event', { x: 1 });
    expect(mockSocket.emit).toHaveBeenCalledWith('custom_event', { x: 1 });

    joinChat('chat123');
    expect(mockSocket.emit).toHaveBeenCalledWith('join_chat', 'chat123');

    leaveChat('chat123');
    expect(mockSocket.emit).toHaveBeenCalledWith('leave_chat', 'chat123');

    sendTypingStart('chat123', 'u2');
    expect(mockSocket.emit).toHaveBeenCalledWith('chat:typing_start', {
      chatId: 'chat123',
      userId: 'u2',
    });

    sendTypingStop('chat123', 'u2');
    expect(mockSocket.emit).toHaveBeenCalledWith('chat:typing_stop', {
      chatId: 'chat123',
      userId: 'u2',
    });
  });

  it('disconnectSocket calls disconnect and clears state', () => {
    initSocket({ userId: 'u3', token: 'tok' });

    // Ensure connect handler exists (not strictly required to call it)
    expect(typeof mockSocket._listeners.connect).toBe('function');

    disconnectSocket();

    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(getSocket()).toBe(null);
  });

  it('onEvent and offEvent delegate to socket', () => {
    initSocket({ userId: 'u4', token: 'tok' });
    const handler = jest.fn();

    onEvent('new_msg', handler);
    expect(mockSocket.on).toHaveBeenCalledWith('new_msg', handler);

    offEvent('new_msg');
    expect(mockSocket.off).toHaveBeenCalledWith('new_msg');
  });
});
