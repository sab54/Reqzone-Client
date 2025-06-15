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

// 🟡 NEW: Typing Indicator Emitters
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
