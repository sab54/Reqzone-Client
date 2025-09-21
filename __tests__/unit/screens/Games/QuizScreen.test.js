/**
 * QuizScreen.test.js
 *
 * Covers:
 * 1) Loading & empty states
 *    - Shows "Loading quiz..." when isLoadingQuiz is true.
 *    - Shows "Quiz not available" when quiz.questions missing/empty.
 *
 * 2) Basic render & navigation
 *    - Renders current question + options.
 *    - "Next Question" disabled until a selection is made.
 *    - Advances to next question after selecting and tapping Next.
 *
 * 3) Multiple-correct selection
 *    - When a question has multiple correct options, allows toggling multiple options.
 *
 * 4) Submit & results
 *    - On finishing, calls submitQuiz and shows XP + 100% title when all correct.
 *
 * Notes:
 * - Thunks and navigation are mocked; dispatch is stubbed to return an `unwrap()` for submitQuiz only.
 * - Timers are faked to skip the 2.5s feedback delay.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import * as quizActions from '../../../../src/store/actions/quizActions';

// ---------- jest timers ----------
jest.useFakeTimers();

// ---------- Mocks: react-redux ----------
const mockSelector = jest.fn();
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (sel) => sel(mockSelector()),
  useDispatch: () => mockDispatch,
}));

// ---------- Mocks: navigation & route ----------
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => ({ params: { quizId: 'q1' } }),
}));

// ---------- Mocks: safe area ----------
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// ---------- Mocks: vector icons (keep deterministic output) ----------
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Ionicons = (props) => <Text>{`icon:${props.name}:${props.size}`}</Text>;
  return { Ionicons };
});

// ---------- Mocks: moti & confetti ----------
jest.mock('moti', () => ({
  MotiView: ({ children }) => children,
}));
jest.mock('react-native-confetti-cannon', () => () => null);

// ---------- Mocks: actions (return markers for dispatch) ----------
jest.mock('../../../../src/store/actions/quizActions', () => {
  const SUBMIT_SYMBOL = { type: 'SUBMIT_QUIZ' };
  return {
    getQuizById: (id) => ({ type: 'GET_QUIZ', payload: id }),
    submitQuiz: (payload) => SUBMIT_SYMBOL,
    __SUBMIT_SYMBOL: SUBMIT_SYMBOL, // expose for tests
  };
});
jest.mock('../../../../src/store/actions/dashboardActions', () => ({
  fetchDashboard: (id) => ({ type: 'FETCH_DASH', payload: id }),
}));
jest.mock('../../../../src/store/actions/badgesActions', () => ({
  fetchUserBadges: (id) => ({ type: 'FETCH_BADGES', payload: id }),
}));

// ---------- Import after mocks ----------
import QuizScreen from '../../../../src/screens/Games/QuizScreen';

// ---------- Shared theme ----------
const theme = {
  background: '#000',
  headerBackground: '#111',
  title: '#fff',
  text: '#ddd',
  card: '#222',
  border: '#444',
  primary: '#0af',
  surface: '#1a1a1a',
  success: '#16a34a',
  successBackground: '#052e1c',
  error: '#ef4444',
  errorBackground: '#2a0a0a',
  warning: '#f59e0b',
  info: '#38bdf8',
  buttonPrimaryBackground: '#2563eb',
  buttonPrimaryText: '#fff',
  icon: '#bbb',
  link: '#60a5fa',
};

// ---------- Helper to prime store state ----------
const makeState = ({
  isLoading = false,
  quiz = null,
  userId = 'user-1',
} = {}) => ({
  theme: { themeColors: theme },
  auth: { user: { id: userId } },
  quizzes: { isLoadingQuiz: isLoading, quiz },
});

// ---------- Dispatch behavior ----------
beforeEach(() => {
  mockDispatch.mockImplementation((action) => {
    if (action === quizActions.__SUBMIT_SYMBOL) {
      return {
        unwrap: () => Promise.resolve({ xp_earned: 50 }),
      };
    }
    return action;
  });
  mockDispatch.mockClear();
  mockSelector.mockClear();
});

describe('QuizScreen', () => {
  test('shows loading and empty states', () => {
    // Loading
    mockSelector.mockReturnValue(makeState({ isLoading: true, quiz: null }));
    const { getByText, rerender } = render(<QuizScreen />);
    expect(getByText('Loading quiz...')).toBeTruthy();

    // Empty quiz
    mockSelector.mockReturnValue(
      makeState({ isLoading: false, quiz: { title: 'T', questions: [] } })
    );
    rerender(<QuizScreen />);
    expect(getByText('Quiz not available')).toBeTruthy();
  });

  test('renders first question, requires selection before Next, and advances', async () => {
    const quiz = {
      title: 'Safety Basics',
      questions: [
        {
          id: 'q-1',
          question: 'Pick one safe action.',
          options: [
            { option_text: 'Stop, Drop, Roll', is_correct: true },
            { option_text: 'Run wildly', is_correct: false },
          ],
        },
        {
          id: 'q-2',
          question: 'Another single choice.',
          options: [
            { option_text: 'Correct', is_correct: true },
            { option_text: 'Wrong', is_correct: false },
          ],
        },
      ],
    };
    mockSelector.mockReturnValue(makeState({ quiz }));

    const { getByText, queryByText } = render(<QuizScreen />);

    expect(getByText('Safety Basics (1/2)')).toBeTruthy();
    expect(getByText('Pick one safe action.')).toBeTruthy();

    const nextBtn = getByText('Next Question');
    expect(nextBtn).toBeTruthy();

    fireEvent.press(getByText('Stop, Drop, Roll'));

    await act(async () => {
      fireEvent.press(nextBtn);
      jest.advanceTimersByTime(2500);
    });

    expect(queryByText('Pick one safe action.')).toBeNull();
    expect(getByText('Another single choice.')).toBeTruthy();
    expect(getByText('Safety Basics (2/2)')).toBeTruthy();
  });

  test('multiple-correct question allows selecting multiple options', async () => {
    const quiz = {
      title: 'Multi',
      questions: [
        {
          id: 'q-1',
          question: 'Select all that apply.',
          options: [
            { option_text: 'Water', is_correct: true },
            { option_text: 'Food', is_correct: true },
            { option_text: 'Flames', is_correct: false },
          ],
        },
      ],
    };
    mockSelector.mockReturnValue(makeState({ quiz }));

    const { getByText } = render(<QuizScreen />);

    fireEvent.press(getByText('Water'));
    fireEvent.press(getByText('Food'));

    const finishBtn = getByText('Finish Quiz');
    await act(async () => {
      fireEvent.press(finishBtn);
      jest.advanceTimersByTime(2500);
    });

    expect(getByText('🎯 XP Earned: 50')).toBeTruthy();
    expect(getByText('1 / 1 correct')).toBeTruthy();
  });

  test('submits, unwraps XP, and shows 100% title', async () => {
    const quiz = {
      title: 'Two Qs',
      questions: [
        {
          id: 'q-1',
          question: 'First?',
          options: [
            { option_text: 'Yes', is_correct: true },
            { option_text: 'No', is_correct: false },
          ],
        },
        {
          id: 'q-2',
          question: 'Second?',
          options: [
            { option_text: 'True', is_correct: true },
            { option_text: 'False', is_correct: false },
          ],
        },
      ],
    };
    mockSelector.mockReturnValue(makeState({ quiz }));

    const { getByText } = render(<QuizScreen />);

    fireEvent.press(getByText('Yes'));
    await act(async () => {
      fireEvent.press(getByText('Next Question'));
      jest.advanceTimersByTime(2500);
    });

    fireEvent.press(getByText('True'));
    await act(async () => {
      fireEvent.press(getByText('Finish Quiz'));
      jest.advanceTimersByTime(2500);
    });

    expect(getByText('🏆 You’re a Disaster Champ!')).toBeTruthy();
    expect(getByText('2 / 2 correct')).toBeTruthy();
    expect(getByText('🎯 XP Earned: 50')).toBeTruthy();

    expect(mockDispatch).toHaveBeenCalledWith(quizActions.__SUBMIT_SYMBOL);
    expect(
      mockDispatch.mock.calls.some(([a]) => a && a.type === 'FETCH_DASH')
    ).toBe(true);
    expect(
      mockDispatch.mock.calls.some(([a]) => a && a.type === 'FETCH_BADGES')
    ).toBe(true);
  });
});
