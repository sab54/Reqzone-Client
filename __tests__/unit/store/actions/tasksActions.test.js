/**
 * tasksActions.test.js
 *
 * What These Tests Cover (5):
 *
 * 1) fetchTasks (success)
 *    - Calls correct URL and returns `response.tasks`.
 *
 * 2) fetchTasks (error)
 *    - Rejects with error.message.
 *
 * 3) fetchTaskProgress (success)
 *    - Calls progress endpoint and returns `response.completedTasks`.
 *
 * 4) completeTask (success)
 *    - Posts `{ user_id, task_id }` to /complete and returns `{ taskId, ...response }`.
 *
 * 5) uncompleteTask (success)
 *    - Posts `{ user_id, task_id }` to /uncomplete and returns `{ taskId, ...response }`.
 */

import { configureStore } from '@reduxjs/toolkit';

// ---- Mocks ----
jest.mock('../../../../src/utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
jest.mock('../../../../src/utils/apiPaths', () => ({
  API_URL_TASKS: 'https://api.example.com/tasks',
}));

import { get, post } from '../../../../src/utils/api';
import {
  fetchTasks,
  fetchTaskProgress,
  completeTask,
  uncompleteTask,
} from '../../../../src/store/actions/tasksActions';

// Minimal store for dispatching thunks
const makeStore = (preloadedState) =>
  configureStore({
    reducer: (s = preloadedState) => s,
    middleware: (gdm) => gdm({ serializableCheck: false }),
    preloadedState,
  });

beforeEach(() => {
  jest.clearAllMocks();
});

// 1) fetchTasks (success)
it('fetchTasks returns response.tasks', async () => {
  const data = { tasks: [{ id: 1, title: 'Pack kit' }] };
  get.mockResolvedValueOnce(data);

  const store = makeStore({});
  const action = await store.dispatch(fetchTasks('u-1'));

  expect(get).toHaveBeenCalledWith('https://api.example.com/tasks/u-1');
  expect(action.type).toMatch(/tasks\/fetchTasks\/fulfilled$/);
  expect(action.payload).toEqual(data.tasks);
});

// 2) fetchTasks (error branch)
it('fetchTasks rejects with error.message', async () => {
  get.mockRejectedValueOnce(new Error('Network down'));

  const store = makeStore({});
  const action = await store.dispatch(fetchTasks('u-2'));

  expect(action.type).toMatch(/tasks\/fetchTasks\/rejected$/);
  expect(action.payload).toBe('Network down');
});

// 3) fetchTaskProgress (success)
it('fetchTaskProgress returns completedTasks array', async () => {
  const resp = { completedTasks: [10, 11, 12] };
  get.mockResolvedValueOnce(resp);

  const store = makeStore({});
  const action = await store.dispatch(fetchTaskProgress('u-3'));

  expect(get).toHaveBeenCalledWith('https://api.example.com/tasks/progress/u-3');
  expect(action.type).toMatch(/tasks\/fetchTaskProgress\/fulfilled$/);
  expect(action.payload).toEqual([10, 11, 12]);
});

// 4) completeTask (success)
it('completeTask posts payload and returns { taskId, ...response }', async () => {
  post.mockResolvedValueOnce({ success: true });

  const store = makeStore({});
  const action = await store.dispatch(completeTask({ userId: 'u-4', taskId: 99 }));

  expect(post).toHaveBeenCalledWith('https://api.example.com/tasks/complete', {
    user_id: 'u-4',
    task_id: 99,
  });
  expect(action.type).toMatch(/tasks\/completeTask\/fulfilled$/);
  expect(action.payload).toEqual({ taskId: 99, success: true });
});

// 5) uncompleteTask (success)
it('uncompleteTask posts payload and returns { taskId, ...response }', async () => {
  post.mockResolvedValueOnce({ success: true });

  const store = makeStore({});
  const action = await store.dispatch(uncompleteTask({ userId: 'u-5', taskId: 77 }));

  expect(post).toHaveBeenCalledWith('https://api.example.com/tasks/uncomplete', {
    user_id: 'u-5',
    task_id: 77,
  });
  expect(action.type).toMatch(/tasks\/uncompleteTask\/fulfilled$/);
  expect(action.payload).toEqual({ taskId: 77, success: true });
});
