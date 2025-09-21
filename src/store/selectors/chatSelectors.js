// src/store/selectors/chatSelectors.js
/**
 * chatSelectors.js
 *
 * Memoized selectors for accessing chat-related state from Redux.
 * Built using `reselect` for performance optimization.
 *
 * Selectors:
 * - **selectTypingUsersByChatId(chatId)**:
 *   Returns an array of users currently typing in the given chat.
 *   Falls back to an empty array if the chat has no typing users.
 *
 * - **selectMessagesByChatId(chatId)**:
 *   Returns an array of messages associated with the given chat.
 *   Falls back to an empty array if no messages exist for the chat.
 *
 * Usage:
 * ```js
 * const typingUsers = useSelector(selectTypingUsersByChatId(chatId));
 * const messages = useSelector(selectMessagesByChatId(chatId));
 * ```
 *
 * Notes:
 * - Selectors are memoized, meaning they will only recompute if
 *   the relevant slice of state changes.
 * - Prevents unnecessary re-renders in React components by avoiding
 *   recalculations when state has not changed.
 *
 * Author: Sunidhi Abhange
 */
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
