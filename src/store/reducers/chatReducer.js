// src/store/reducers/chatReducer.js
/**
 * chatReducer.js
 *
 * Centralized chat state:
 * - `allUsers`: suggestion list for starting chats
 * - `draftGroupUsers`: staging list while composing a new group
 * - `activeChats`: list of chat summaries (DMs + groups)
 * - `messagesByChatId`: map<chatId, Message[]>
 * - `lastReadByChatId`: map<chatId, lastReadMessageId>
 * - `queuedMessagesByChatId`: map<chatId, Message[]> (local "pending" echo)
 * - `typingUsersByChatId`: map<chatId, User[]>
 * - `loading` / `error`: async flags for thunked ops
 *
 * Local reducers:
 * - `updateActiveChatsFromSocket(list)` → replaces `activeChats` when socket pushes updates; non-arrays become `[]`.
 * - `appendMessage({ chatId, message })` → idempotent append (skips if id already exists).
 * - `queuePendingMessage({ chatId, senderId, message })` → pushes a temp `"pending"` echo to both `queuedMessagesByChatId[chatId]` and `messagesByChatId[chatId]`.
 * - `clearQueuedMessages(chatId)` → deletes `queuedMessagesByChatId[chatId]`.
 * - `markChatAsRead({ chatId, messageId })` → stamps `lastReadByChatId[chatId]`.
 * - `setTypingUser({ chatId, user })` / `removeTypingUser({ chatId, userId })` → maintain a de-duplicated typing list.
 *
 * Extra reducers (thunks):
 * - `fetchUserSuggestions` / `fetchActiveChats` → pending sets `loading=true, error=null`; fulfilled replaces lists; rejected sets `error`.
 * - `startDirectMessage` / `createGroupChat` → unshift new chat if not already present (dedupe by `chat_id` or `id`); `createGroupChat` also clears `draftGroupUsers`.
 * - `deleteChat` → removes chat (by `chat_id` or `id`) and deletes its messages.
 * - `fetchMessages` → replaces `messagesByChatId[chatId]`.
 * - `sendMessage` → idempotent append into `messagesByChatId[chatId]`.
 * - `markChatAsReadThunk` → stamps `lastReadByChatId[chatId]`.
 * - `addUserToDraftGroup` / `removeUserFromDraftGroup` / `clearDraftGroupUsers` → manage draft group list.
 * - `removeUserFromGroup` → removes a member from a specific chat’s `members`.
 * - `fetchChatById` → upsert chat details into `activeChats`.
 *
 * Notes:
 * - All updates are immutable via RTK's Immer.
 * - Idempotence: message appenders check `message.id` before pushing.
 * - Dedupe for chats accepts either `chat_id` or `id` on incoming payloads.
 */

import { createSlice } from '@reduxjs/toolkit';
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
} from '../actions/chatActions';

const initialState = {
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

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        updateActiveChatsFromSocket: (state, action) => {
            state.activeChats = Array.isArray(action.payload)
                ? action.payload
                : [];
        },

        appendMessage: (state, action) => {
            const { chatId, message } = action.payload;
            if (!state.messagesByChatId[chatId]) {
                state.messagesByChatId[chatId] = [];
            }

            const exists = state.messagesByChatId[chatId].some(
                (m) => m.id === message.id
            );

            if (!exists) {
                state.messagesByChatId[chatId].push(message);
            }
        },

        queuePendingMessage: (state, action) => {
            const { chatId, senderId, message } = action.payload;
            if (!state.queuedMessagesByChatId[chatId]) {
                state.queuedMessagesByChatId[chatId] = [];
            }

            const tempId = `temp-${Date.now()}`;
            const queuedMessage = {
                id: tempId,
                chat_id: chatId,
                sender: { id: senderId },
                content: message,
                message_type: 'text',
                timestamp: new Date().toISOString(),
                status: 'pending',
            };

            state.queuedMessagesByChatId[chatId].push(queuedMessage);

            if (!state.messagesByChatId[chatId]) {
                state.messagesByChatId[chatId] = [];
            }

            state.messagesByChatId[chatId].push(queuedMessage);
        },

        clearQueuedMessages: (state, action) => {
            delete state.queuedMessagesByChatId[action.payload];
        },

        markChatAsRead: (state, action) => {
            const { chatId, messageId } = action.payload;
            state.lastReadByChatId[chatId] = messageId;
        },

        setTypingUser: (state, action) => {
            const { chatId, user } = action.payload;
            if (!chatId || !user?.id) return;

            if (!Array.isArray(state.typingUsersByChatId[chatId])) {
                state.typingUsersByChatId[chatId] = [];
            }

            const existing = state.typingUsersByChatId[chatId];
            const alreadyExists = existing.some((u) => u.id === user.id);

            if (!alreadyExists) {
                state.typingUsersByChatId[chatId] = [...existing, user];
            }
        },

        removeTypingUser: (state, action) => {
            const { chatId, userId } = action.payload;
            if (!chatId || !userId) return;

            const existing = state.typingUsersByChatId[chatId] || [];
            state.typingUsersByChatId[chatId] = existing.filter(
                (u) => u.id !== userId
            );
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(fetchUserSuggestions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserSuggestions.fulfilled, (state, action) => {
                state.loading = false;
                state.allUsers = Array.isArray(action.payload)
                    ? action.payload
                    : [];
            })
            .addCase(fetchUserSuggestions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(fetchActiveChats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchActiveChats.fulfilled, (state, action) => {
                state.loading = false;
                state.activeChats = Array.isArray(action.payload)
                    ? action.payload
                    : [];
            })
            .addCase(fetchActiveChats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(startDirectMessage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(startDirectMessage.fulfilled, (state, action) => {
                state.loading = false;
                const newChat = action.payload;
                const exists = state.activeChats.some(
                    (chat) =>
                        chat.chat_id === newChat.chat_id ||
                        chat.id === newChat.chat_id
                );
                if (!exists) {
                    state.activeChats.unshift(newChat);
                }
            })
            .addCase(startDirectMessage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(createGroupChat.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createGroupChat.fulfilled, (state, action) => {
                state.loading = false;
                const newChat = action.payload;
                const exists = state.activeChats.some(
                    (chat) =>
                        chat.chat_id === newChat.chat_id ||
                        chat.id === newChat.chat_id
                );
                if (!exists) {
                    state.activeChats.unshift(newChat);
                }
                state.draftGroupUsers = [];
            })
            .addCase(createGroupChat.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(deleteChat.fulfilled, (state, action) => {
                const chatId = action.payload;
                state.activeChats = state.activeChats.filter(
                    (chat) => chat.chat_id !== chatId && chat.id !== chatId
                );
                delete state.messagesByChatId[chatId];
            })
            .addCase(deleteChat.rejected, (state, action) => {
                state.error = action.payload;
            })

            .addCase(fetchMessages.fulfilled, (state, action) => {
                const { chatId, messages } = action.payload;
                state.messagesByChatId[chatId] = messages;
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.error = action.payload;
            })

            .addCase(sendMessage.fulfilled, (state, action) => {
                const { chatId, message } = action.payload;
                if (!state.messagesByChatId[chatId]) {
                    state.messagesByChatId[chatId] = [];
                }

                const exists = state.messagesByChatId[chatId].some(
                    (m) => m.id === message.id
                );

                if (!exists) {
                    state.messagesByChatId[chatId].push(message);
                }
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.error = action.payload;
            })

            .addCase(markChatAsReadThunk.fulfilled, (state, action) => {
                const { chatId, messageId } = action.payload;
                state.lastReadByChatId[chatId] = messageId;
            })

            .addCase(addUserToDraftGroup.fulfilled, (state, action) => {
                const user = action.payload;
                if (!state.draftGroupUsers.find((u) => u.id === user.id)) {
                    state.draftGroupUsers.push(user);
                }
            })
            .addCase(removeUserFromDraftGroup.fulfilled, (state, action) => {
                state.draftGroupUsers = state.draftGroupUsers.filter(
                    (user) => user.id !== action.payload
                );
            })
            .addCase(clearDraftGroupUsers.fulfilled, (state) => {
                state.draftGroupUsers = [];
            })

            .addCase(removeUserFromGroup.fulfilled, (state, action) => {
                const { chatId, userId } = action.payload;
                const chat = state.activeChats.find(
                    (c) => c.chat_id === chatId || c.id === chatId
                );
                if (chat && Array.isArray(chat.members)) {
                    chat.members = chat.members.filter((m) => m.id !== userId);
                }
            })

            .addCase(fetchChatById.fulfilled, (state, action) => {
                const updatedChat = action.payload;
                if (!updatedChat?.id) return;

                const index = state.activeChats.findIndex(
                    (c) =>
                        c.id === updatedChat.id || c.chat_id === updatedChat.id
                );

                if (index !== -1) {
                    state.activeChats[index] = updatedChat;
                } else {
                    state.activeChats.unshift(updatedChat);
                }
            });
    },
});

export const {
    updateActiveChatsFromSocket,
    appendMessage,
    queuePendingMessage,
    clearQueuedMessages,
    markChatAsRead,
    setTypingUser,
    removeTypingUser,
} = chatSlice.actions;

export default chatSlice.reducer;
