/**
 * documentsActions.test.js
 *
 * What These Tests Cover (5):
 * 1) fetchDocuments (success)
 *    - Calls correct URL, maps file_url with BASE_URL and converts read_at -> read flag.
 *
 * 2) fetchDocuments (no user)
 *    - Rejects with "User ID not found".
 *
 * 3) addDocument (success)
 *    - Posts enriched payload (adds user_id and uploadedAt ISO string) and returns it.
 *
 * 4) removeDocument (success)
 *    - Sends DELETE with { user_id, url } and returns the url.
 *
 * 5) markDocumentAsRead & markDocumentAsUnread (success)
 *    - Calls proper endpoints with document_id and returns the id.
 */

import { configureStore } from '@reduxjs/toolkit';

// ---- Mock external modules used by the thunks ----
jest.mock('../../../../src/utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  del: jest.fn(),
}));

jest.mock('../../../../src/utils/apiPaths', () => ({
  API_URL_DOCUMENTS: 'https://api.example.com/documents',
}));

jest.mock('../../../../src/utils/config', () => ({
  BASE_URL: 'https://cdn.example.com',
}));

import { get, post, del } from '../../../../src/utils/api';
import {
  fetchDocuments,
  addDocument,
  removeDocument,
  markDocumentAsRead,
  markDocumentAsUnread,
} from '../../../../src/store/actions/documentsActions';

// Minimal store to dispatch thunks with custom preloaded state
const makeStore = (preloadedState) =>
  configureStore({
    reducer: (state = preloadedState) => state,
    middleware: (gdm) => gdm({ serializableCheck: false }),
    preloadedState,
  });

beforeEach(() => {
  jest.clearAllMocks();
});

// 1) fetchDocuments (success mapping)
it('fetchDocuments: maps file_url with BASE_URL and converts read_at -> read', async () => {
  const initial = { auth: { user: { id: 'u-1' } } };

  get.mockResolvedValueOnce({
    data: [
      { id: 1, title: 'Doc A', file_url: '/files/a.pdf', read_at: '2025-01-01T00:00:00Z' },
      { id: 2, title: 'Doc B', file_url: '/files/b.pdf', read_at: null },
    ],
  });

  const store = makeStore(initial);
  const action = await store.dispatch(fetchDocuments());

  expect(get).toHaveBeenCalledWith('https://api.example.com/documents/u-1');
  expect(action.type).toMatch(/documents\/fetchDocuments\/fulfilled$/);
  expect(action.payload).toEqual([
    {
      id: 1,
      title: 'Doc A',
      file_url: 'https://cdn.example.com/files/a.pdf',
      read_at: '2025-01-01T00:00:00Z',
      read: true,
    },
    {
      id: 2,
      title: 'Doc B',
      file_url: 'https://cdn.example.com/files/b.pdf',
      read_at: null,
      read: false,
    },
  ]);
});

// 2) fetchDocuments (no user id)
it('fetchDocuments: rejects when user id is missing', async () => {
  const initial = { auth: { user: null } };
  const store = makeStore(initial);

  const action = await store.dispatch(fetchDocuments());

  expect(action.type).toMatch(/documents\/fetchDocuments\/rejected$/);
  expect(action.payload).toBe('User ID not found');
  expect(get).not.toHaveBeenCalled();
});

// 3) addDocument (success)
it('addDocument: posts enriched doc with user_id and uploadedAt, returns it', async () => {
  const initial = { auth: { user: { id: 'u-9' } } };
  post.mockResolvedValueOnce(undefined);

  const store = makeStore(initial);
  const input = { url: 'https://cdn.example.com/files/x.pdf', title: 'X' };

  const action = await store.dispatch(addDocument(input));

  expect(action.type).toMatch(/documents\/addDocument\/fulfilled$/);

  // Validate the actual posted body (enriched)
  const [, postedBody] = post.mock.calls[0];
  expect(post).toHaveBeenCalledWith('https://api.example.com/documents', expect.any(Object));
  expect(postedBody).toEqual(
    expect.objectContaining({
      url: 'https://cdn.example.com/files/x.pdf',
      title: 'X',
      user_id: 'u-9',
      uploadedAt: expect.any(String),
    })
  );

  // uploadedAt should be a valid ISO date string
  expect(Number.isNaN(Date.parse(postedBody.uploadedAt))).toBe(false);

  // Thunk returns the same enriched object
  expect(action.payload).toEqual(postedBody);
});

// 4) removeDocument (success)
it('removeDocument: calls del with { user_id, url } and returns the url', async () => {
  const initial = { auth: { user: { id: 'admin' } } };
  del.mockResolvedValueOnce(undefined);

  const store = makeStore(initial);
  const url = 'https://cdn.example.com/files/rm.pdf';

  const action = await store.dispatch(removeDocument({ url }));

  expect(del).toHaveBeenCalledWith('https://api.example.com/documents', {
    user_id: 'admin',
    url,
  });
  expect(action.type).toMatch(/documents\/removeDocument\/fulfilled$/);
  expect(action.payload).toBe(url);
});

// 5) markDocumentAsRead & markDocumentAsUnread (success)
it('marks document as read and unread with proper endpoints and returns id', async () => {
  const initial = { auth: { user: { id: 'u-7' } } };
  post.mockResolvedValueOnce(undefined);
  del.mockResolvedValueOnce(undefined);

  const store = makeStore(initial);

  // mark as read
  const readAction = await store.dispatch(markDocumentAsRead({ documentId: 77 }));
  expect(post).toHaveBeenCalledWith('https://api.example.com/documents/read', {
    user_id: 'u-7',
    document_id: 77,
  });
  expect(readAction.type).toMatch(/documents\/markDocumentAsRead\/fulfilled$/);
  expect(readAction.payload).toBe(77);

  // mark as unread
  const unreadAction = await store.dispatch(markDocumentAsUnread({ documentId: 77 }));
  expect(del).toHaveBeenCalledWith('https://api.example.com/documents/read', {
    user_id: 'u-7',
    document_id: 77,
  });
  expect(unreadAction.type).toMatch(/documents\/markDocumentAsUnread\/fulfilled$/);
  expect(unreadAction.payload).toBe(77);
});
