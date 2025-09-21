/**
 * tasksReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State & clearTaskStatus
 *    - Returns initial state; clearTaskStatus resets lastCompleted + error only.
 *
 * 2) fetchTasks & fetchTaskProgress
 *    - pending sets loading; fulfilled populates tasks or completedTaskIds; rejected sets error.
 *
 * 3) completeTask flow
 *    - Adds unique taskId to completedTaskIds; sets lastCompleted; ignores duplicates.
 *
 * 4) uncompleteTask flow
 *    - Removes taskId from completedTaskIds; rejected sets error.
 */

import reducer, { clearTaskStatus } from '../../../../src/store/reducers/tasksReducer';
import {
  fetchTasks,
  fetchTaskProgress,
  completeTask,
  uncompleteTask,
} from '../../../../src/store/actions/tasksActions';

const initial = {
  tasks: [],
  completedTaskIds: [],
  loading: false,
  error: null,
  lastCompleted: null,
};

describe('tasks reducer', () => {
  it('1) returns initial state and clearTaskStatus works', () => {
    const s0 = reducer(undefined, { type: '@@INIT' });
    expect(s0).toEqual(initial);

    const dirty = {
      ...initial,
      error: 'oops',
      lastCompleted: { taskId: 't1' },
    };
    const cleared = reducer(dirty, clearTaskStatus());
    expect(cleared.error).toBeNull();
    expect(cleared.lastCompleted).toBeNull();
  });

  it('2) fetchTasks and fetchTaskProgress flows', () => {
    // fetchTasks
    let state = reducer(undefined, { type: fetchTasks.pending.type });
    expect(state.loading).toBe(true);

    const tasks = [{ id: 'a' }, { id: 'b' }];
    state = reducer(state, { type: fetchTasks.fulfilled.type, payload: tasks });
    expect(state.loading).toBe(false);
    expect(state.tasks).toEqual(tasks);

    state = reducer(state, { type: fetchTasks.rejected.type, payload: 'bad' });
    expect(state.error).toBe('bad');

    // fetchTaskProgress
    state = reducer(state, { type: fetchTaskProgress.pending.type });
    expect(state.loading).toBe(true);

    const progress = [{ task_id: 'a' }, { task_id: 'c' }];
    state = reducer(state, { type: fetchTaskProgress.fulfilled.type, payload: progress });
    expect(state.loading).toBe(false);
    expect(state.completedTaskIds).toEqual(['a', 'c']);

    state = reducer(state, { type: fetchTaskProgress.rejected.type, payload: 'fail' });
    expect(state.error).toBe('fail');
  });

  it('3) completeTask adds unique IDs and sets lastCompleted', () => {
    let state = { ...initial, completedTaskIds: ['a'] };

    // pending
    state = reducer(state, { type: completeTask.pending.type });
    expect(state.loading).toBe(true);

    // fulfilled with new task
    const payload = { taskId: 'b' };
    state = reducer(state, { type: completeTask.fulfilled.type, payload });
    expect(state.loading).toBe(false);
    expect(state.completedTaskIds).toContain('b');
    expect(state.lastCompleted).toEqual(payload);

    // fulfilled with duplicate
    const dupPayload = { taskId: 'b' };
    const stateBefore = { ...state };
    state = reducer(state, { type: completeTask.fulfilled.type, payload: dupPayload });
    expect(state.completedTaskIds).toEqual(stateBefore.completedTaskIds); // unchanged
    expect(state.lastCompleted).toEqual(dupPayload);

    // rejected
    state = reducer(state, { type: completeTask.rejected.type, payload: 'nope' });
    expect(state.error).toBe('nope');
  });

  it('4) uncompleteTask removes ID; rejected sets error', () => {
    let state = { ...initial, completedTaskIds: ['x', 'y'] };

    // pending
    state = reducer(state, { type: uncompleteTask.pending.type });
    expect(state.loading).toBe(true);

    // fulfilled removes
    state = reducer(state, { type: uncompleteTask.fulfilled.type, payload: { taskId: 'x' } });
    expect(state.loading).toBe(false);
    expect(state.completedTaskIds).toEqual(['y']);

    // rejected
    state = reducer(state, { type: uncompleteTask.rejected.type, payload: 'err' });
    expect(state.error).toBe('err');
  });
});
