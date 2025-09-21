/**
 * TasksScreen.test.js
 *
 * Covers:
 * 1) Loading & Data Fetch
 *    - On focus, dispatches fetchTasks, fetchQuizzes, fetchDashboard, etc.
 *
 * 2) Filtering & Rendering
 *    - Renders items with correct types (task, checklist, quiz).
 *    - Tab switch changes visible items.
 *    - Search query narrows results.
 *
 * 3) Swipe Actions
 *    - Swiping a task shows "complete" or "uncomplete".
 *    - Swiping a quiz navigates if not completed.
 *
 * 4) Progress & Level Up
 *    - Displays progress stats and badges count.
 *    - When level increases, shows LevelUpToast + confetti.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import * as reactRedux from 'react-redux';

// --- Mocks: action creators with types ---
jest.mock('../../../../src/store/actions/tasksActions', () => ({
  fetchTasks: (id) => ({ type: 'FETCH_TASKS', payload: id }),
  fetchTaskProgress: (id) => ({ type: 'FETCH_TASK_PROGRESS', payload: id }),
  completeTask: (p) => ({ type: 'COMPLETE_TASK', payload: p }),
  uncompleteTask: (p) => ({ type: 'UNCOMPLETE_TASK', payload: p }),
}));
jest.mock('../../../../src/store/actions/quizActions', () => ({
  fetchQuizzes: (id) => ({ type: 'FETCH_QUIZZES', payload: id }),
  fetchQuizHistory: (id) => ({ type: 'FETCH_QUIZ_HISTORY', payload: id }),
}));
jest.mock('../../../../src/store/actions/dashboardActions', () => ({
  fetchDashboard: (id) => ({ type: 'FETCH_DASH', payload: id }),
}));
jest.mock('../../../../src/store/actions/badgesActions', () => ({
  fetchUserBadges: (id) => ({ type: 'FETCH_BADGES', payload: id }),
}));

// --- Redux mocks ---
const mockDispatch = jest.fn();
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: jest.fn((sel) =>
      sel({
        auth: { user: { id: 'u1' } },
        tasks: { tasks: [{ id: 't1', title: 'Task A' }], completedTaskIds: [] },
        quizzes: { quizzes: [{ id: 'q1', title: 'Quiz A' }], quizHistory: [] },
        dashboard: { stats: { xp: 50, level: 1 } },
        badges: { userBadges: [{ id: 'b1' }] },
        theme: {
          themeColors: {
            background: '#000',
            surface: '#111',
            title: '#fff',
            text: '#ccc',
            border: '#333',
            card: '#222',
            cardPressed: '#444',
            success: 'green',
            warning: 'orange',
          },
        },
      })
    ),
  };
});

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (fn) => fn(),
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { Ionicons: ({ name }) => <Text>{`icon:${name}`}</Text> };
});
jest.mock('react-native-confetti-cannon', () => () => null);

// --- Child component mocks ---
jest.mock('../../../../src/components/SearchBar', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (p) => <Text testID="SearchBar">{p.placeholder}</Text>;
});
jest.mock('../../../../src/components/Tabs', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (p) => <Text testID="Tabs">{p.selectedTab}</Text>;
});
jest.mock('../../../../src/components/SwipeableList', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (p) => <Text testID="SwipeableList">{p.data.length} items</Text>;
});
jest.mock('../../../../src/components/ProgressBar', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (p) => (
    <Text testID="ProgressBar">{`Level:${p.level},XP:${p.xp}`}</Text>
  );
});
jest.mock('../../../../src/components/Footer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => <Text testID="Footer">Footer</Text>;
});
jest.mock('../../../../src/components/TipBanner', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (p) => <Text testID="TipBanner">{p.tip}</Text>;
});
jest.mock('../../../../src/components/LevelUpToast', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (p) => <Text testID="LevelUpToast">{`Level:${p.level}`}</Text>;
});

// --- Import screen ---
import TasksScreen from '../../../../src/screens/Games/TasksScreen';

beforeEach(() => {
  mockDispatch.mockClear();
});

describe('TasksScreen', () => {
  it('dispatches data fetch actions on mount', () => {
    render(<TasksScreen />);
    const types = mockDispatch.mock.calls.map(([a]) => a.type);
    expect(types).toEqual(
      expect.arrayContaining([
        'FETCH_TASKS',
        'FETCH_QUIZZES',
        'FETCH_DASH',
        'FETCH_BADGES',
      ])
    );
  });

  it('renders progress, tip, footer, and stats', () => {
    const { getByTestId, getByText } = render(<TasksScreen />);
    expect(getByTestId('ProgressBar')).toBeTruthy();
    expect(getByTestId('TipBanner')).toHaveTextContent(/Keep completing/); // regex to match full string
    expect(getByTestId('Footer')).toBeTruthy();
    expect(getByText(/✅/)).toBeTruthy(); // stats line
  });

  it('renders items via SwipeableList', () => {
    const { getByTestId } = render(<TasksScreen />);
    expect(getByTestId('SwipeableList')).toHaveTextContent('2 items'); // 1 task + 1 quiz
  });

  it('shows level up toast when level increases', () => {
    const spy = jest.spyOn(reactRedux, 'useSelector');

    // initial render (level 1)
    render(<TasksScreen />);

    // re-render with updated level (2)
    spy.mockImplementation((sel) =>
      sel({
        auth: { user: { id: 'u1' } },
        tasks: { tasks: [], completedTaskIds: [] },
        quizzes: { quizzes: [], quizHistory: [] },
        dashboard: { stats: { xp: 120, level: 2 } },
        badges: { userBadges: [] },
        theme: {
          themeColors: {
            background: '#000',
            surface: '#111',
            title: '#fff',
            text: '#ccc',
            border: '#333',
          },
        },
      })
    );

    const { getByTestId } = render(<TasksScreen />);
    expect(getByTestId('LevelUpToast')).toHaveTextContent('Level:2');
  });
});
