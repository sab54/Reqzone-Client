/**
 * bookmarksActions.test.js
 *
 * What These Tests Cover:
 * 1) loadBookmarks
 *    - succeeds for an authed user
 *    - rejects when user id is missing
 *
 * 2) addBookmark
 *    - enriches payload (user_id, bookmarkedAt) and posts it
 *
 * 3) removeBookmark
 *    - deletes by { user_id, url } and returns url
 *
 * 4) clearBookmarksAndPersist
 *    - deletes all and returns true
 */

import { configureStore } from '@reduxjs/toolkit';

// --- Mocks for modules used inside the thunks file ---
jest.mock('../../../../src/utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  del: jest.fn(),
}));
jest.mock('../../../../src/utils/apiPaths', () => ({
  API_URL_NEWS: 'https://api.example.com/news',
}));

import { get, post, del } from '../../../../src/utils/api';
// Import thunks AFTER mocks
import * as bookmarks from '../../../../src/store/actions/bookmarksActions';

// Minimal store that preserves a provided preloaded state
const makeStore = (preloadedState) =>
  configureStore({
    reducer: (state = preloadedState) => state,
    middleware: (gdm) => gdm({ serializableCheck: false }),
    preloadedState,
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('loadBookmarks', () => {
  it('loads bookmarks for the current user', async () => {
    const initial = { auth: { user: { id: 'u-1' } } };
    const apiResponse = [{ url: 'https://x.test/a', title: 'A' }];
    get.mockResolvedValueOnce(apiResponse);

    const store = makeStore(initial);
    const action = await store.dispatch(bookmarks.loadBookmarks());

    expect(action.type).toMatch(/bookmarks\/loadBookmarks\/fulfilled$/);
    expect(get).toHaveBeenCalledWith('https://api.example.com/news/bookmarks', { user_id: 'u-1' });
    expect(action.payload).toEqual(apiResponse);
  });

  it('rejects when user id is missing', async () => {
    const initial = { auth: {} };
    const store = makeStore(initial);

    const action = await store.dispatch(bookmarks.loadBookmarks());

    expect(action.type).toMatch(/bookmarks\/loadBookmarks\/rejected$/);
    expect(action.payload).toBe('User ID not found');
    expect(get).not.toHaveBeenCalled();
  });
});

describe('addBookmark', () => {
  it('enriches article with user_id and bookmarkedAt, posts it, and returns enriched article', async () => {
    const initial = { auth: { user: { id: 'u-42' } } };
    const store = makeStore(initial);

    // We only care that post resolves; body is asserted via toHaveBeenCalledWith
    post.mockResolvedValueOnce({ ok: true });

    const inputArticle = { url: 'https://y.test/b', title: 'B' };
    const action = await store.dispatch(bookmarks.addBookmark(inputArticle));

    expect(action.type).toMatch(/bookmarks\/addBookmark\/fulfilled$/);
    // Payload contains enriched fields
    expect(action.payload).toMatchObject({
      url: 'https://y.test/b',
      title: 'B',
      user_id: 'u-42',
    });
    // timestamp present as ISO-like string
    expect(typeof action.payload.bookmarkedAt).toBe('string');
    // post called with enriched article
    expect(post).toHaveBeenCalledWith(
      'https://api.example.com/news/bookmarks',
      expect.objectContaining({
        url: 'https://y.test/b',
        title: 'B',
        user_id: 'u-42',
        bookmarkedAt: expect.any(String),
      })
    );
  });
});

describe('removeBookmark', () => {
  it('deletes by { user_id, url } and returns the url', async () => {
    const initial = { auth: { user: { id: 'user-x' } } };
    const store = makeStore(initial);

    del.mockResolvedValueOnce(undefined);

    const article = { url: 'https://z.test/c' };
    const action = await store.dispatch(bookmarks.removeBookmark(article));

    expect(action.type).toMatch(/bookmarks\/removeBookmark\/fulfilled$/);
    expect(del).toHaveBeenCalledWith(
      'https://api.example.com/news/bookmarks',
      { user_id: 'user-x', url: 'https://z.test/c' }
    );
    expect(action.payload).toBe('https://z.test/c');
  });
});

describe('clearBookmarksAndPersist', () => {
  it('clears user bookmarks and returns true', async () => {
    const initial = { auth: { user: { id: 'u-99' } } };
    const store = makeStore(initial);

    del.mockResolvedValueOnce(undefined);

    const action = await store.dispatch(bookmarks.clearBookmarksAndPersist());

    expect(action.type).toMatch(/bookmarks\/clearAllBookmarks\/fulfilled$/);
    expect(del).toHaveBeenCalledWith(
      'https://api.example.com/news/bookmarks/all',
      { user_id: 'u-99' }
    );
    expect(action.payload).toBe(true);
  });
});
