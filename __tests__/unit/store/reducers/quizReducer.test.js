/**
 * quizzesReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State & Local Reducers
 *    - Returns initial state; clearQuizState and clearQuizSubmissionResult reset properly.
 *
 * 2) fetchQuizzes and getQuizById flows
 *    - pending sets loading flags, fulfilled populates, rejected sets error.
 *
 * 3) submitQuiz, fetchQuizHistory, fetchQuizStats
 *    - Validate state updates and error handling.
 *
 * 4) generateQuizAI
 *    - Prepends new quiz into quizzes list; handles errors.
 */

import reducer, {
  clearQuizState,
  clearQuizSubmissionResult,
} from '../../../../src/store/reducers/quizReducer';

import {
  fetchQuizzes,
  getQuizById,
  submitQuiz,
  fetchQuizHistory,
  fetchQuizStats,
  generateQuizAI,
} from '../../../../src/store/actions/quizActions';

const initial = {
  quizzes: [],
  quiz: null,
  submissionResult: null,
  quizHistory: [],
  quizStats: {},
  loading: false,
  isLoadingQuiz: false,
  error: null,
};

describe('quizzes reducer', () => {
  it('1) returns initial state & local reducers', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initial);

    const dirty = {
      ...initial,
      quiz: { id: 'q1' },
      submissionResult: { correct: 3 },
      error: 'oops',
    };
    const cleared = reducer(dirty, clearQuizState());
    expect(cleared.quiz).toBeNull();
    expect(cleared.submissionResult).toBeNull();
    expect(cleared.error).toBeNull();

    const withResult = { ...initial, submissionResult: { correct: 2 } };
    const clearedResult = reducer(withResult, clearQuizSubmissionResult());
    expect(clearedResult.submissionResult).toBeNull();
  });

  it('2) fetchQuizzes and getQuizById flows', () => {
    // fetchQuizzes
    let state = reducer(undefined, { type: fetchQuizzes.pending.type });
    expect(state.loading).toBe(true);

    const list = [{ id: 'q1' }, { id: 'q2' }];
    state = reducer(state, { type: fetchQuizzes.fulfilled.type, payload: list });
    expect(state.loading).toBe(false);
    expect(state.quizzes).toEqual(list);

    state = reducer(state, { type: fetchQuizzes.rejected.type, payload: 'fail' });
    expect(state.error).toBe('fail');

    // getQuizById
    state = reducer(state, { type: getQuizById.pending.type });
    expect(state.isLoadingQuiz).toBe(true);

    const quiz = { id: 'q1', title: 'Quiz 1' };
    state = reducer(state, { type: getQuizById.fulfilled.type, payload: quiz });
    expect(state.isLoadingQuiz).toBe(false);
    expect(state.quiz).toEqual(quiz);

    state = reducer(state, { type: getQuizById.rejected.type, payload: 'bad' });
    expect(state.isLoadingQuiz).toBe(false);
    expect(state.error).toBe('bad');
  });

  it('3) submitQuiz, fetchQuizHistory, fetchQuizStats', () => {
    // submitQuiz
    let state = reducer(undefined, { type: submitQuiz.pending.type });
    expect(state.loading).toBe(true);

    const submission = { correct: 5, total: 10 };
    state = reducer(state, { type: submitQuiz.fulfilled.type, payload: submission });
    expect(state.loading).toBe(false);
    expect(state.submissionResult).toEqual(submission);

    state = reducer(state, { type: submitQuiz.rejected.type, payload: 'bad-sub' });
    expect(state.error).toBe('bad-sub');

    // fetchQuizHistory
    state = reducer(state, { type: fetchQuizHistory.pending.type });
    expect(state.loading).toBe(true);

    const history = [{ id: 'h1' }, { id: 'h2' }];
    state = reducer(state, { type: fetchQuizHistory.fulfilled.type, payload: history });
    expect(state.quizHistory).toEqual(history);

    state = reducer(state, { type: fetchQuizHistory.rejected.type, payload: 'no-history' });
    expect(state.error).toBe('no-history');

    // fetchQuizStats
    state = reducer(state, { type: fetchQuizStats.pending.type });
    expect(state.loading).toBe(true);

    const stats = { total: 20, average: 15 };
    state = reducer(state, { type: fetchQuizStats.fulfilled.type, payload: stats });
    expect(state.quizStats).toEqual(stats);

    state = reducer(state, { type: fetchQuizStats.rejected.type, payload: 'no-stats' });
    expect(state.error).toBe('no-stats');
  });

  it('4) generateQuizAI prepends new quiz, handles rejected', () => {
    const start = { ...initial, quizzes: [{ id: 'old' }] };

    let state = reducer(start, { type: generateQuizAI.pending.type });
    expect(state.loading).toBe(true);

    const aiQuiz = { id: 'new', title: 'AI Generated' };
    state = reducer(state, { type: generateQuizAI.fulfilled.type, payload: aiQuiz });
    expect(state.quizzes[0]).toEqual(aiQuiz);

    state = reducer(state, { type: generateQuizAI.rejected.type, payload: 'bad-ai' });
    expect(state.error).toBe('bad-ai');
  });
});
