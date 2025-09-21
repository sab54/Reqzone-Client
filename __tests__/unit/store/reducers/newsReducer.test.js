/**
 * newsReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State & Unknown Action
 *    - Returns initial shape and ignores unknown actions.
 *
 * 2) setNewsArticles
 *    - Replaces list, resets page to 1, sets hasMore from payload length.
 *
 * 3) appendNewsArticles (dedupe + pagination)
 *    - Appends only new urls, increments page, updates hasMore.
 *
 * 4) setNewsLoading & setNewsTotal
 *    - Toggles loading and sets totalCount with falsy guard.
 */

import reducer, {
  setNewsArticles,
  appendNewsArticles,
  setNewsLoading,
  setNewsTotal,
} from '../../../../src/store/reducers/newsReducer';

const initial = {
  articles: [],
  loading: false,
  page: 1,
  hasMore: true,
  totalCount: 0,
};

describe('news reducer', () => {
  it('1) returns initial state and ignores unknown actions', () => {
    const s0 = reducer(undefined, { type: '@@INIT' });
    expect(s0).toEqual(initial);

    const frozen = Object.freeze({ ...s0, articles: [{ url: 'a' }] });
    const s1 = reducer(frozen, { type: 'news/NOT_A_REAL_ACTION' });
    expect(s1).toEqual(frozen);
  });

  it('2) setNewsArticles replaces list, resets page to 1, sets hasMore', () => {
    const payload = [{ url: 'https://a' }, { url: 'https://b' }];
    const s1 = reducer(undefined, setNewsArticles(payload));
    expect(s1.articles).toEqual(payload);
    expect(s1.page).toBe(1);
    expect(s1.hasMore).toBe(true);

    const s2 = reducer(s1, setNewsArticles([]));
    expect(s2.articles).toEqual([]);
    expect(s2.page).toBe(1);      // reset again
    expect(s2.hasMore).toBe(false);

    const s3 = reducer(s2, setNewsArticles(null)); // falsy guard
    expect(s3.articles).toEqual([]);
    expect(s3.hasMore).toBe(false);
  });

  it('3) appendNewsArticles dedupes by url, increments page, updates hasMore', () => {
    // start with two existing
    let state = reducer(undefined, setNewsArticles([{ url: 'https://a' }, { url: 'https://b' }]));
    // append with one duplicate and one new
    state = reducer(
      state,
      appendNewsArticles([{ url: 'https://b' }, { url: 'https://c' }])
    );
    expect(state.articles.map(a => a.url)).toEqual(['https://a', 'https://b', 'https://c']);
    expect(state.page).toBe(2); // incremented once
    expect(state.hasMore).toBe(true);

    // append empty → page still increments, hasMore false
    const afterEmpty = reducer(state, appendNewsArticles([]));
    expect(afterEmpty.page).toBe(3);
    expect(afterEmpty.hasMore).toBe(false);

    // append null/undefined guarded as []
    const afterNull = reducer(afterEmpty, appendNewsArticles(null));
    expect(afterNull.page).toBe(4);
    expect(afterNull.hasMore).toBe(false);
  });

  it('4) setNewsLoading toggles loading; setNewsTotal sets total with falsy guard', () => {
    let state = reducer(undefined, setNewsLoading(true));
    expect(state.loading).toBe(true);

    state = reducer(state, setNewsLoading(false));
    expect(state.loading).toBe(false);

    state = reducer(state, setNewsTotal(123));
    expect(state.totalCount).toBe(123);

    state = reducer(state, setNewsTotal(null)); // guard → 0
    expect(state.totalCount).toBe(0);
  });
});
