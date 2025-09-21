/**
 * chatSelectors.test.js
 *
 * What These Tests Cover:
 * 1) Typing Users Selector
 *    - Returns typing users for a given chatId
 *    - Falls back to [] if no entry exists
 *
 * 2) Messages Selector
 *    - Returns messages for a given chatId
 *    - Falls back to [] if no entry exists
 *
 * 3) Memoization
 *    - Selectors return the same reference when input state does not change
 */

import {
  selectTypingUsersByChatId,
  selectMessagesByChatId,
} from '../../../../src/store/selectors/chatSelectors';

describe('chatSelectors', () => {
  const baseState = {
    chat: {
      typingUsersByChatId: {
        'chat1': ['alice', 'bob'],
      },
      messagesByChatId: {
        'chat1': [{ id: 1, text: 'Hello' }, { id: 2, text: 'World' }],
      },
    },
  };

  describe('selectTypingUsersByChatId', () => {
    it('returns typing users for a given chatId', () => {
      const selector = selectTypingUsersByChatId('chat1');
      expect(selector(baseState)).toEqual(['alice', 'bob']);
    });

    it('returns [] when chatId not present', () => {
      const selector = selectTypingUsersByChatId('chatX');
      expect(selector(baseState)).toEqual([]);
    });
  });

  describe('selectMessagesByChatId', () => {
    it('returns messages for a given chatId', () => {
      const selector = selectMessagesByChatId('chat1');
      expect(selector(baseState)).toEqual([
        { id: 1, text: 'Hello' },
        { id: 2, text: 'World' },
      ]);
    });

    it('returns [] when chatId not present', () => {
      const selector = selectMessagesByChatId('chatX');
      expect(selector(baseState)).toEqual([]);
    });
  });

  describe('memoization behavior', () => {
    it('returns same reference when state does not change', () => {
      const selector = selectTypingUsersByChatId('chat1');
      const first = selector(baseState);
      const second = selector(baseState);
      expect(first).toBe(second);
    });

    it('recomputes when relevant state changes', () => {
      const selector = selectMessagesByChatId('chat1');
      const first = selector(baseState);

      const newState = {
        ...baseState,
        chat: {
          ...baseState.chat,
          messagesByChatId: {
            ...baseState.chat.messagesByChatId,
            chat1: [...baseState.chat.messagesByChatId.chat1, { id: 3, text: '!' }],
          },
        },
      };

      const second = selector(newState);
      expect(second).not.toBe(first);
      expect(second).toHaveLength(3);
    });
  });
});
