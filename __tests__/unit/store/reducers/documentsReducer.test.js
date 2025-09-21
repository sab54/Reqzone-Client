/**
 * documentsReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State & Unknown Action
 *    - Returns initial shape and ignores unknown actions.
 *
 * 2) fetchDocuments flow (+ non-array payload)
 *    - pending sets loading; fulfilled replaces list; rejected sets error; non-array → [].
 *
 * 3) add/remove/clear flows
 *    - addDocument unshifts; removeDocument filters by url; clearAllDocuments empties; rejections set error.
 *
 * 4) mark read/unread flows
 *    - Toggles `read` flag for a given id; rejections set error without breaking other fields.
 */

import reducer from '../../../../src/store/reducers/documentsReducer';
import {
  fetchDocuments,
  addDocument,
  removeDocument,
  clearAllDocuments,
  markDocumentAsRead,
  markDocumentAsUnread,
} from '../../../../src/store/actions/documentsActions';

const initial = {
  documents: [],
  loading: false,
  error: null,
};

describe('documents reducer', () => {
  it('1) returns initial state and ignores unknown actions', () => {
    const s0 = reducer(undefined, { type: '@@INIT' });
    expect(s0).toEqual(initial);

    const frozen = Object.freeze({ ...s0 });
    const s1 = reducer(frozen, { type: 'documents/NOT_A_REAL_ACTION', payload: 123 });
    expect(s1).toEqual(frozen);
  });

  it('2) fetchDocuments pending → fulfilled → rejected; non-array payload becomes []', () => {
    // pending
    let state = reducer(undefined, { type: fetchDocuments.pending.type });
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();

    // fulfilled with array payload
    const docs = [
      { id: 'a', url: 'https://a', title: 'A', read: false },
      { id: 'b', url: 'https://b', title: 'B', read: true },
    ];
    state = reducer(state, { type: fetchDocuments.fulfilled.type, payload: docs });
    expect(state.loading).toBe(false);
    expect(state.documents).toEqual(docs);

    // fulfilled with non-array → []
    state = reducer(state, { type: fetchDocuments.fulfilled.type, payload: { nope: true } });
    expect(state.documents).toEqual([]);

    // rejected
    state = reducer(state, { type: fetchDocuments.rejected.type, payload: 'boom' });
    expect(state.loading).toBe(false);
    expect(state.error).toBe('boom');
  });

  it('3) addDocument unshifts; remove by url; clear all; handle rejections', () => {
    let state = reducer(undefined, { type: '@@INIT' });

    // add two (newest first due to unshift)
    state = reducer(state, { type: addDocument.fulfilled.type, payload: { id: '1', url: 'https://1', title: 'One' } });
    state = reducer(state, { type: addDocument.fulfilled.type, payload: { id: '2', url: 'https://2', title: 'Two' } });
    expect(state.documents.map(d => d.id)).toEqual(['2', '1']);

    // add rejected sets error, does not touch loading or list
    state = reducer(state, { type: addDocument.rejected.type, payload: 'add-fail' });
    expect(state.error).toBe('add-fail');
    expect(state.loading).toBe(false);
    expect(state.documents.map(d => d.id)).toEqual(['2', '1']);

    // remove by url
    state = reducer(state, { type: removeDocument.fulfilled.type, payload: 'https://1' });
    expect(state.documents.map(d => d.url)).toEqual(['https://2']);

    // remove rejected
    state = reducer(state, { type: removeDocument.rejected.type, payload: 'rm-fail' });
    expect(state.error).toBe('rm-fail');

    // clear all
    state = reducer(state, { type: clearAllDocuments.fulfilled.type });
    expect(state.documents).toEqual([]);

    // clear rejected
    state = reducer(state, { type: clearAllDocuments.rejected.type, payload: 'clear-fail' });
    expect(state.error).toBe('clear-fail');
  });

  it('4) markDocumentAsRead / markDocumentAsUnread flip flags; rejections set error', () => {
    let state = {
      ...initial,
      documents: [
        { id: 'x', url: 'https://x', title: 'X', read: false },
        { id: 'y', url: 'https://y', title: 'Y', read: true },
      ],
    };

    // mark read on x
    state = reducer(state, { type: markDocumentAsRead.fulfilled.type, payload: 'x' });
    expect(state.documents.find(d => d.id === 'x')?.read).toBe(true);

    // mark unread on y
    state = reducer(state, { type: markDocumentAsUnread.fulfilled.type, payload: 'y' });
    expect(state.documents.find(d => d.id === 'y')?.read).toBe(false);

    // rejections set error only
    state = reducer(state, { type: markDocumentAsRead.rejected.type, payload: 'read-fail' });
    expect(state.error).toBe('read-fail');

    state = reducer(state, { type: markDocumentAsUnread.rejected.type, payload: 'unread-fail' });
    expect(state.error).toBe('unread-fail');
  });
});
