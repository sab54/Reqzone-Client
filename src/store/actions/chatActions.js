// src/store/actions/chatActions.js
/**
 * chatActions.js
 *
 * Redux Toolkit async thunks for chat features:
 * - Fetch active chats, user suggestions, and specific chat/message data
 * - Create direct/group chats, add/remove members, join local groups, delete chats
 * - Send messages and flush queued messages on reconnect
 * - Mark chats as read
 * - Local-only draft group helpers (add/remove/clear)
 *
 * Key Thunks:
 * - **fetchActiveChats()**: Gets current user's chat list (`GET /chat/list/:userId`).
 * - **fetchUserSuggestions(search)**: Suggests users excluding the current user (`GET /users/suggestions?search=...`).
 * - **startDirectMessage(otherUserId)**: Creates/returns a DM (`POST /chat/create`).
 * - **createGroupChat({ name, userIds })**: Creates a group (`POST /chat/create`).
 * - **addUserToExistingGroup({ chatId, userIds })**: Adds members (`POST /chat/:id/add-members`).
 * - **removeUserFromGroup({ chatId, userId })**: Removes a member (`DELETE /chat/:id/remove-member`).
 * - **joinLocalGroup({ latitude, longitude, address, hasAddress })**: Joins/creates a local group (`POST /chat/local-groups/join`) and refreshes active chats.
 * - **deleteChat(chatId)**: Deletes a chat (`DELETE /chat/:id`).
 * - **fetchChatById(chatId)**: Gets a single chat (`GET /chat/:id`).
 * - **fetchMessages(chatId)**: Loads messages (`GET /chat/:id/messages`).
 * - **sendMessage({ chatId, senderId, message, message_type })**: Sends a message (`POST /chat/:id/messages`).
 * - **flushQueuedMessages(chatId)**: Retries queued messages (dispatches `appendMessage` for each, then `clearQueuedMessages`).
 * - **markChatAsReadThunk({ chatId, messageId })**: Marks as read (`POST /chat/read`).
 * - **addUserToDraftGroup(user)** / **removeUserFromDraftGroup(userId)** / **clearDraftGroupUsers()**: Local-only helpers.
 *
 * Error Handling:
 * - All thunks surface failures via `rejectWithValue(error.message || '<fallback>')`.
 * - Parameter validation errors (e.g., missing IDs) are thrown and caught into `rejectWithValue`.
 *
 * Integration Points:
 * - API helpers: `get`, `post`, `del` (utils/api)
 * - URL constants: `API_URL_CHAT`, `API_URL_USERS` (utils/apiPaths)
 * - Local actions (from reducers/chatReducer): `appendMessage`, `clearQueuedMessages`
 *
 * Author: Sunidhi Abhange
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL_CHAT, API_URL_USERS } from '../../utils/apiPaths.js';
import { get, post, del } from '../../utils/api';
import {
    appendMessage,
    clearQueuedMessages,
    markChatAsRead,
} from '../reducers/chatReducer';

/**
 * Fetch all chats for current user
 */
export const fetchActiveChats = createAsyncThunk(
    'chat/fetchActiveChats',
    async (_, { getState, rejectWithValue }) => {
        try {
            const currentUserId = getState().auth?.user?.id;
            if (!currentUserId) throw new Error('User not authenticated');
            const response = await get(`${API_URL_CHAT}/list/${currentUserId}`);
            return Array.isArray(response?.data) ? response.data : [];
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch chats');
        }
    }
);

/**
 * Fetch user suggestions
 */
export const fetchUserSuggestions = createAsyncThunk(
    'chat/fetchUserSuggestions',
    async (search = '', { getState, rejectWithValue }) => {
        try {
            const currentUserId = getState().auth?.user?.id;

            const response = await get(
                `${API_URL_USERS}/suggestions?search=${encodeURIComponent(
                    search
                )}`
            );

            const filtered = Array.isArray(response?.data)
                ? response.data.filter((user) => user.id !== currentUserId)
                : [];

            return filtered;
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to fetch suggestions'
            );
        }
    }
);

/**
 * Start or reuse a direct chat
 */
export const startDirectMessage = createAsyncThunk(
    'chat/startDirectMessage',
    async (otherUserId, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const currentUserId = state.auth?.user?.id;

            if (!currentUserId || !otherUserId) {
                throw new Error('User IDs are required');
            }

            const payload = {
                user_id: currentUserId,
                participant_ids: [otherUserId],
                is_group: false,
            };

            const response = await post(`${API_URL_CHAT}/create`, payload);

            return {
                chat_id: response?.chat?.id,
                is_group: false,
                name: response?.chat?.name || 'Direct Chat',
                members: response?.chat?.members || [],
                chat: response?.chat,
                ...response,
            };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to start DM');
        }
    }
);

/**
 * Create a group chat
 */
export const createGroupChat = createAsyncThunk(
    'chat/createGroupChat',
    async ({ name, userIds }, { getState, rejectWithValue }) => {
        try {
            const currentUserId = getState().auth?.user?.id;
            if (!currentUserId || !name || !Array.isArray(userIds)) {
                throw new Error('Group name and participants required');
            }

            const payload = {
                user_id: currentUserId,
                participant_ids: userIds,
                is_group: true,
                group_name: name,
            };

            const response = await post(`${API_URL_CHAT}/create`, payload);

            return {
                chat_id: response?.chat?.id,
                is_group: true,
                name: response?.chat?.name || name,
                members: response?.chat?.members || [],
                chat: response?.chat,
                ...response,
            };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to create group');
        }
    }
);

/**
 * Add users to an existing group chat
 */
export const addUserToExistingGroup = createAsyncThunk(
    'chat/addUserToExistingGroup',
    async ({ chatId, userIds }, { getState, rejectWithValue }) => {
        try {
            const currentUserId = getState().auth?.user?.id;
            if (!currentUserId || !chatId || !Array.isArray(userIds)) {
                throw new Error('Missing parameters');
            }

            const payload = {
                user_id: currentUserId,
                user_ids: userIds,
            };

            const response = await post(
                `${API_URL_CHAT}/${chatId}/add-members`,
                payload
            );

            return { chatId, addedUserIds: userIds, ...response };
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to add users to group'
            );
        }
    }
);

/**
 * Remove user from group chat
 */
export const removeUserFromGroup = createAsyncThunk(
    'chat/removeUserFromGroup',
    async ({ chatId, userId }, { getState, rejectWithValue }) => {
        try {
            const requestedBy = getState().auth?.user?.id;
            if (!requestedBy || !chatId || !userId) {
                throw new Error('chatId, userId, and requestedBy are required');
            }

            // These are sent as encrypted query params
            const params = {
                user_id: userId,
                requested_by: requestedBy,
            };

            await del(`${API_URL_CHAT}/${chatId}/remove-member`, params);

            return { chatId: Number(chatId), userId: Number(userId) };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to remove user');
        }
    }
);

/**
 * Join or create a local group chat
 */
export const joinLocalGroup = createAsyncThunk(
    'chat/joinLocalGroup',
    async (
        { latitude, longitude, address, hasAddress },
        { getState, dispatch, rejectWithValue }
    ) => {
        try {
            const userId = getState().auth?.user?.id;
            if (!userId) throw new Error('User not authenticated');

            const payload = {
                userId,
                latitude,
                longitude,
                address,
                hasAddress,
            };
            const response = await post(
                `${API_URL_CHAT}/local-groups/join`,
                payload
            );

            if (!response?.chat_id) {
                throw new Error('No chat ID returned from server');
            }

            // Re-fetch active chats after joining
            await dispatch(fetchActiveChats());

            return response;
        } catch (error) {
            return rejectWithValue(
                error.message || 'Failed to join local group'
            );
        }
    }
);

/**
 * Delete a chat
 */
export const deleteChat = createAsyncThunk(
    'chat/deleteChat',
    async (chatId, { rejectWithValue }) => {
        try {
            await del(`${API_URL_CHAT}/${chatId}`);
            return chatId;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to delete chat');
        }
    }
);

/**
 * Fetch single chat by ID (e.g., after adding/removing members)
 */
export const fetchChatById = createAsyncThunk(
    'chat/fetchChatById',
    async (chatId, { rejectWithValue }) => {
        try {
            const response = await get(`${API_URL_CHAT}/${chatId}`);

            console.log('fetchChatById response: ', response);

            return response?.chat;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch chat');
        }
    }
);

/**
 * Fetch chat messages
 */
export const fetchMessages = createAsyncThunk(
    'chat/fetchMessages',
    async (chatId, { rejectWithValue }) => {
        try {
            const response = await get(`${API_URL_CHAT}/${chatId}/messages`);
            return { chatId, messages: response?.data || [] };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to load messages');
        }
    }
);

/**
 * Send a message
 */
export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async (
        { chatId, senderId, message, message_type = 'text' },
        { rejectWithValue }
    ) => {
        try {
            const payload = { sender_id: senderId, message, message_type };
            const response = await post(
                `${API_URL_CHAT}/${chatId}/messages`,
                payload
            );

            return {
                chatId,
                message: {
                    id: response.message_id,
                    chat_id: chatId,
                    sender: { id: senderId },
                    content: message,
                    message_type,
                    timestamp: new Date().toISOString(),
                },
            };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to send message');
        }
    }
);

/**
 * Retry queued messages (on reconnect)
 */
export const flushQueuedMessages = createAsyncThunk(
    'chat/flushQueuedMessages',
    async (chatId, { getState, dispatch }) => {
        const state = getState();
        const queued = state.chat.queuedMessagesByChatId[chatId];
        if (!queued || !queued.length) return;

        for (const msg of queued) {
            try {
                const payload = {
                    sender_id: msg.sender_id,
                    message: msg.content,
                    message_type: msg.message_type || 'text',
                };
                const response = await post(
                    `${API_URL_CHAT}/${chatId}/messages`,
                    payload
                );

                dispatch(
                    appendMessage({
                        chatId,
                        message: {
                            id: response.message_id,
                            chat_id: chatId,
                            sender: { id: msg.sender_id },
                            content: msg.content,
                            message_type: msg.message_type || 'text',
                            timestamp: new Date().toISOString(),
                        },
                    })
                );
            } catch (err) {
                console.error('Failed to flush queued message:', err);
            }
        }

        dispatch(clearQueuedMessages(chatId));
    }
);

/**
 * Mark chat as read
 */
export const markChatAsReadThunk = createAsyncThunk(
    'chat/markChatAsRead',
    async ({ chatId, messageId }, { getState, rejectWithValue }) => {
        try {
            const userId = getState().auth?.user?.id;
            if (!userId) throw new Error('User not authenticated');

            await post(`${API_URL_CHAT}/read`, {
                user_id: userId,
                message_id: messageId,
            });

            return { chatId, messageId };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to mark as read');
        }
    }
);

/**
 * Local Draft Management
 */
export const addUserToDraftGroup = createAsyncThunk(
    'chat/addUserToDraftGroup',
    async (user, { rejectWithValue }) => {
        if (!user?.id) return rejectWithValue('Invalid user');
        return user;
    }
);

/**
 * Local-only: remove user from draft group
 */
export const removeUserFromDraftGroup = createAsyncThunk(
    'chat/removeUserFromDraftGroup',
    async (userId, { rejectWithValue }) => {
        if (!userId) return rejectWithValue('User ID required');
        return userId;
    }
);

/**
 * Local-only: clear all users from draft group
 */
export const clearDraftGroupUsers = createAsyncThunk(
    'chat/clearDraftGroupUsers',
    async () => true
);
