import { createSelector } from 'reselect';

export const selectTypingUsersByChatId = (chatId) =>
    createSelector(
        (state) => state.chat.typingUsersByChatId,
        (typingUsersByChatId) => typingUsersByChatId?.[chatId] || []
    );

export const selectMessagesByChatId = (chatId) =>
    createSelector(
        (state) => state.chat.messagesByChatId,
        (messagesByChatId) => messagesByChatId?.[chatId] || []
    );
