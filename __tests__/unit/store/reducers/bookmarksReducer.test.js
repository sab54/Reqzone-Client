/**
 * bookmarksReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State & Unknown Action
 *    - Returns initial shape and ignores unknown actions.
 *
 * 2) loadBookmarks flow (+ non-array payload)
 *    - pending sets loading; fulfilled replaces list; rejected sets error; non-array → [].
 *
 * 3) addBookmark order & rejection
 *    - Unshifts items (newest first); rejected sets error only.
 *
 * 4) removeBookmark & clearBookmarksAndPersist
 *    - Removes by url; clear empties list; rejections set error.
 */

import reducer from '../../../../src/store/reducers/bookmarksReducer';
import {
  loadBookmarks,
  addBookmark,
  removeBookmark,
  clearBookmarksAndPersist,
} from '../../../../src/store/actions/bookmarksActions';

const initial = {
  bookmarks: [],
  loading: false,
  error: null,
};

describe('bookmarks reducer', () => {
  it('1) returns initial state and ignores unknown actions', () => {
    const s0 = reducer(undefined, { type: '@@INIT' });
    expect(s0).toEqual(initial);

    const frozen = Object.freeze({ ...s0 });
    const s1 = reducer(frozen, { type: 'bookmarks/NOT_A_REAL_ACTION', payload: 123 });
    expect(s1).toEqual(frozen);
  });

  it('2) loadBookmarks pending → fulfilled → rejected; non-array payload becomes []', () => {
    // pending
    let state = reducer(undefined, { type: loadBookmarks.pending.type });
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();

    // fulfilled with array
    const payload = [{ url: 'https://a', title: 'A' }, { url: 'https://b', title: 'B' }];
    state = reducer(state, { type: loadBookmarks.fulfilled.type, payload });
    expect(state.loading).toBe(false);
    expect(state.bookmarks).toEqual(payload);

    // fulfilled with non-array → []
    state = reducer(state, { type: loadBookmarks.fulfilled.type, payload: { not: 'array' } });
    expect(state.bookmarks).toEqual([]);

    // rejected
    state = reducer(state, { type: loadBookmarks.rejected.type, payload: 'boom' });
    expect(state.loading).toBe(false);
    expect(state.error).toBe('boom');
  });

  it('3) addBookmark unshifts newest first; rejected sets error', () => {
    let state = reducer(undefined, { type: '@@INIT' });
    expect(state.loading).toBe(false);

    state = reducer(state, { type: addBookmark.fulfilled.type, payload: { url: 'https://1', title: 'One' } });
    state = reducer(state, { type: addBookmark.fulfilled.type, payload: { url: 'https://2', title: 'Two' } });

    // Newest first due to unshift
    expect(state.bookmarks.map(b => b.url)).toEqual(['https://2', 'https://1']);

    // rejected should only set error; not change loading
    state = reducer(state, { type: addBookmark.rejected.type, payload: 'nope' });
    expect(state.error).toBe('nope');
    expect(state.loading).toBe(false);
    expect(state.bookmarks.map(b => b.url)).toEqual(['https://2', 'https://1']);
  });

  it('4) removeBookmark by url and clear all; handle rejections', () => {
    // start with three
    let state = {
      ...initial,
      bookmarks: [
        { url: 'https://keep', title: 'Keep' },
        { url: 'https://drop', title: 'Drop' },
        { url: 'https://also-keep', title: 'Also Keep' },
      ],
    };

    // remove by url (fulfilled)
    state = reducer(state, { type: removeBookmark.fulfilled.type, payload: 'https://drop' });
    expect(state.bookmarks.map(b => b.url)).toEqual(['https://keep', 'https://also-keep']);

    // remove rejected sets error
    state = reducer(state, { type: removeBookmark.rejected.type, payload: 'err-remove' });
    expect(state.error).toBe('err-remove');

    // clear all (fulfilled)
    state = reducer(state, { type: clearBookmarksAndPersist.fulfilled.type });
    expect(state.bookmarks).toEqual([]);

    // clear rejected sets error
    state = reducer(state, { type: clearBookmarksAndPersist.rejected.type, payload: 'err-clear' });
    expect(state.error).toBe('err-clear');
  });
});
