/**
 * quizzesActions.test.js
 *
 * What These Tests Cover (5):
 * 1) fetchQuizzes (success)
 *    - Calls correct URL and returns `response.quizzes`.
 *
 * 2) getQuizById (success)
 *    - Calls correct URL and returns `response.quiz`.
 *
 * 3) submitQuiz (success)
 *    - Posts to `/:quizId/submit` with `{ user_id, answers }` and returns raw response.
 *
 * 4) fetchQuizHistory & fetchQuizStats (success)
 *    - GETs correct endpoints and returns mapped payloads (history array, stats object).
 *
 * 5) generateQuizAI (error)
 *    - Rejects with `error.message` (covers one rejectWithValue path).
 */

import { configureStore } from '@reduxjs/toolkit';

// ---- Mock external modules used by the thunks ----
jest.mock('../../../../src/utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
jest.mock('../../../../src/utils/apiPaths', () => ({
  API_URL_QUIZZES: 'https://api.example.com/quizzes',
}));

import { get, post } from '../../../../src/utils/api';
import {
  fetchQuizzes,
  getQuizById,
  submitQuiz,
  fetchQuizHistory,
  fetchQuizStats,
  generateQuizAI,
} from '../../../../src/store/actions/quizActions';

// Minimal store that lets us dispatch thunks
const makeStore = (preloadedState) =>
  configureStore({
    reducer: (state = preloadedState) => state,
    middleware: (gdm) => gdm({ serializableCheck: false }),
    preloadedState,
  });

beforeEach(() => {
  jest.clearAllMocks();
});

// 1) fetchQuizzes
it('fetchQuizzes returns response.quizzes', async () => {
  const data = { quizzes: [{ id: 'q1' }, { id: 'q2' }] };
  get.mockResolvedValueOnce(data);

  const store = makeStore({});
  const action = await store.dispatch(fetchQuizzes('user-1'));

  expect(get).toHaveBeenCalledWith('https://api.example.com/quizzes/user/user-1');
  expect(action.type).toMatch(/quizzes\/fetchQuizzes\/fulfilled$/);
  expect(action.payload).toEqual(data.quizzes);
});

// 2) getQuizById
it('getQuizById returns response.quiz', async () => {
  const data = { quiz: { id: 'q9', title: 'Safety Basics' } };
  get.mockResolvedValueOnce(data);

  const store = makeStore({});
  const action = await store.dispatch(getQuizById('q9'));

  expect(get).toHaveBeenCalledWith('https://api.example.com/quizzes/q9');
  expect(action.type).toMatch(/quizzes\/getQuizById\/fulfilled$/);
  expect(action.payload).toEqual(data.quiz);
});

// 3) submitQuiz
it('submitQuiz posts correct payload and returns raw response', async () => {
  const resp = { submitted: true, score: 4, total: 5 };
  post.mockResolvedValueOnce(resp);

  const store = makeStore({});
  const action = await store.dispatch(
    submitQuiz({ quizId: 'q3', userId: 'u-7', answers: [{ q: 1, a: 2 }] })
  );

  expect(post).toHaveBeenCalledWith(
    'https://api.example.com/quizzes/q3/submit',
    { user_id: 'u-7', answers: [{ q: 1, a: 2 }] }
  );
  expect(action.type).toMatch(/quizzes\/submitQuiz\/fulfilled$/);
  expect(action.payload).toEqual(resp);
});

// 4) fetchQuizHistory & fetchQuizStats
it('fetchQuizHistory and fetchQuizStats return mapped payloads', async () => {
  get
    .mockResolvedValueOnce({ history: [{ id: 'h1' }, { id: 'h2' }] }) // history
    .mockResolvedValueOnce({ stats: { attempts: 3, avgScore: 80 } });   // stats

  const store = makeStore({});

  const historyAction = await store.dispatch(fetchQuizHistory('u-2'));
  expect(get).toHaveBeenNthCalledWith(1, 'https://api.example.com/quizzes/history/u-2');
  expect(historyAction.type).toMatch(/quizzes\/fetchQuizHistory\/fulfilled$/);
  expect(historyAction.payload).toEqual([{ id: 'h1' }, { id: 'h2' }]);

  const statsAction = await store.dispatch(fetchQuizStats('q5'));
  expect(get).toHaveBeenNthCalledWith(2, 'https://api.example.com/quizzes/q5/stats');
  expect(statsAction.type).toMatch(/quizzes\/fetchQuizStats\/fulfilled$/);
  expect(statsAction.payload).toEqual({ attempts: 3, avgScore: 80 });
});

// 5) generateQuizAI (error case)
it('generateQuizAI rejects with error.message', async () => {
  post.mockRejectedValueOnce(new Error('AI busy'));

  const store = makeStore({});
  const action = await store.dispatch(
    generateQuizAI({ topic: 'Floods', difficulty: 'medium', createdBy: 'u-3', chatId: 'c-1' })
  );

  expect(post).toHaveBeenCalledWith('https://api.example.com/quizzes/ai-generate', {
    topic: 'Floods',
    difficulty: 'medium',
    createdBy: 'u-3',
    chatId: 'c-1',
  });
  expect(action.type).toMatch(/quizzes\/generateQuizAI\/rejected$/);
  expect(action.payload).toBe('AI busy');
});
