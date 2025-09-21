/**
 * socket.js
 *
 * Utility wrapper around `socket.io-client` that manages real-time
 * communication between the client app and the backend via WebSockets.
 *
 * Key Functionalities:
 *
 * - **initSocket**:
 *   Initializes a new socket connection with authentication and query params.
 *   - Establishes a connection using WebSocket transport.
 *   - Emits a `join_user_room` event once connected (using `userId`).
 *   - Handles connection lifecycle events: `connect`, `disconnect`, and `connect_error`.
 *
 * - **getSocket**:
 *   Returns the current socket instance (if initialized).
 *
 * - **disconnectSocket**:
 *   Gracefully disconnects the socket, resets internal state, and clears `userId`.
 *
 * - **emitEvent**:
 *   Emits a custom event with data, only if the socket is connected.
 *
 * - **onEvent**:
 *   Subscribes to a socket event and registers a callback listener.
 *
 * - **offEvent**:
 *   Removes a socket event listener by event name.
 *
 * - **joinChat / leaveChat**:
 *   Emits events to join or leave specific chat rooms.
 *   - Example: `join_chat` or `leave_chat` with `chatId`.
 *
 * - **Typing Indicator Events**:
 *   - `sendTypingStart(chatId, userId)`: Broadcasts that the user started typing.
 *   - `sendTypingStop(chatId, userId)`: Broadcasts that the user stopped typing.
 *
 * Connection Flow:
 * 1. Call `initSocket({ userId, token, query })` → establishes connection.
 * 2. On success, the client auto-joins `user_${userId}` private room.
 * 3. Use `emitEvent`, `onEvent`, or `offEvent` for real-time messaging.
 * 4. Use `joinChat` / `leaveChat` to manage chat room participation.
 * 5. Call `disconnectSocket()` on logout/app close to cleanly terminate.
 *
 * Notes:
 * - Relies on `BASE_URL` from config.js as the Socket.IO server endpoint.
 * - Uses `forceNew: true` to avoid sharing connections across users.
 * - Maintains `isConnected` flag for safer event emission.
 * - Console logs help trace socket lifecycle in development.
 *
 * Author: Sunidhi Abhange
 */

import { io } from 'socket.io-client';
import { BASE_URL } from './config';

let socket = null;
let isConnected = false;
let currentUserId = null;

/**
 * Initialize Socket.IO connection
 */
export const initSocket = ({ userId, token, query = {} } = {}) => {
    if (socket) return socket;

    currentUserId = userId;

    socket = io(BASE_URL, {
        transports: ['websocket'],
        forceNew: true,
        query: {
            userId,
            token,
            ...query,
        },
    });

    socket.on('connect', () => {
        isConnected = true;
        console.log('🟢 Socket connected:', socket.id);

        if (currentUserId) {
            socket.emit('join_user_room', currentUserId);
            console.log(`👤 Joined user room: user_${currentUserId}`);
        }
    });

    socket.on('disconnect', (reason) => {
        isConnected = false;
        console.log('🔴 Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
        console.error('❌ Connection error:', err.message);
    });

    return socket;
};

/**
 * Get socket instance
 */
export const getSocket = () => socket;

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        isConnected = false;
        currentUserId = null;
        console.log('🛑 Socket disconnected');
    }
};

/**
 * Emit socket event
 */
export const emitEvent = (event, data) => {
    if (socket && isConnected) {
        socket.emit(event, data);
    }
};

/**
 * Listen for socket event
 */
export const onEvent = (event, callback) => {
    if (socket) {
        socket.on(event, callback);
    }
};

/**
 * Remove socket event listener
 */
export const offEvent = (event) => {
    if (socket) {
        socket.off(event);
    }
};

/**
 * Join chat room
 */
export const joinChat = (chatId) => {
    if (socket && chatId) {
        socket.emit('join_chat', chatId);
        console.log(`📥 Joined chat_${chatId}`);
    }
};

/**
 * Leave chat room
 */
export const leaveChat = (chatId) => {
    if (socket && chatId) {
        socket.emit('leave_chat', chatId);
        console.log(`📤 Left chat_${chatId}`);
    }
};

// NEW: Typing Indicator Emitters
export const sendTypingStart = (chatId, userId) => {
    if (socket && isConnected && chatId && userId) {
        socket.emit('chat:typing_start', { chatId, userId });
    }
};

export const sendTypingStop = (chatId, userId) => {
    if (socket && isConnected && chatId && userId) {
        socket.emit('chat:typing_stop', { chatId, userId });
    }
};
