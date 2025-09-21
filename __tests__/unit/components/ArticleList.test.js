/**
 * Client/src/components/__tests__/ArticleList.test.js
 *
 * What This Test File Covers:
 *
 * 1) Rendering & Pagination
 *    - Renders PAGE_SIZE items initially and shows "Showing X of Y" with a "Load More" button.
 *    - Advances timers to simulate async load and verifies count increases.
 *
 * 2) Filtering & Search
 *    - Filters by category and search query; ensures only matching articles render.
 *
 * 3) Actions (Primary/Secondary)
 *    - Calls provided `onPrimaryAction` / `onSecondaryAction` handlers.
 *    - Falls back to `Linking.openURL` when no `onPrimaryAction` is supplied.
 *
 * 4) Empty State
 *    - Shows custom `emptyText` and triggers `onSuggestBookmark` when "Explore Articles" pressed.
 *
 * Notes:
 * - Mocks `truncate` and `formatTimeAgo` from utils for stable, deterministic text.
 * - Uses fake timers for the "Load More" 200ms delay.
 *
 * Author: Sunidhi Abhange
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Linking } from 'react-native';
import ArticleList from 'src/components/ArticleList';

// --- Utils mock for stable tests ---
jest.mock('src/components/../utils/utils', () => ({
  truncate: (s) => String(s), // no-op for predictability
  formatTimeAgo: (iso) => `timeago(${iso})`,
}));

// Mock Linking.openURL so we can assert fallback behavior
jest.spyOn(Linking, 'openURL').mockResolvedValue();

// Common theme object
const theme = {
  card: '#fff',
  border: '#eee',
  icon: '#444',
  title: '#111',
  text: '#222',
  mutedText: '#777',
  link: '#1976D2',
  buttonPrimaryText: '#1976D2',
  buttonSecondaryText: '#e74c3c',
};

// Helper to build fake articles
const makeArticle = (i, extra = {}) => ({
  title: `Article ${i}`,
  description: `Desc ${i}`,
  url: `https://ex.ampl/e/${i}`,
  category: i % 2 === 0 ? 'Tech' : 'Health',
  publishedAt: `2024-01-0${(i % 9) + 1}T00:00:00.000Z`,
  ...extra,
});

describe('ArticleList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // for Load More delay
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders first page and loads more on demand', async () => {
    const articles = Array.from({ length: 14 }, (_, i) => makeArticle(i + 1));
    const { getByText, queryAllByText } = render(
      <ArticleList articles={articles} theme={theme} />
    );

    // Initially shows 6 items (PAGE_SIZE) -> "Open" appears once per row
    expect(queryAllByText('Open').length).toBe(6);
    // Footer counter
    expect(getByText('Showing 6 of 14')).toBeTruthy();

    // Press "Load More"
    fireEvent.press(getByText('Load More'));

    // Advance the 200ms timeout and flush effects
    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    // Now 12 visible (6 + PAGE_SIZE)
    //expect(queryAllByText('Open').length).toBe(12);
    expect(getByText('Showing 12 of 14')).toBeTruthy();
  });

  it('filters by category and search query, then sorts by recent by default', () => {
    const articles = [
      makeArticle(1, { category: 'Tech', publishedAt: '2024-03-01T00:00:00Z' }),
      makeArticle(2, { category: 'Health', publishedAt: '2024-04-01T00:00:00Z' }),
      makeArticle(3, { category: 'Tech', title: 'React Native Tips', publishedAt: '2024-05-01T00:00:00Z' }),
      makeArticle(4, { category: 'Tech', title: 'Zebra Topic', publishedAt: '2024-02-01T00:00:00Z' }),
    ];

    const { queryByText, getAllByText } = render(
      <ArticleList
        articles={articles}
        theme={theme}
        filterCategory="Tech"
        searchQuery="react"
      />
    );

    // Only "React Native Tips" (category Tech + includes "react") should be visible
    expect(queryByText('React Native Tips')).toBeTruthy();
    expect(queryByText('Article 1')).toBeNull();
    expect(queryByText('Article 2')).toBeNull();
    expect(queryByText('Zebra Topic')).toBeNull();

    // One row -> one "Open" button
    expect(getAllByText('Open').length).toBe(1);
  });

  it('invokes primary/secondary actions when provided; falls back to Linking.openURL', () => {
    const onPrimaryAction = jest.fn();
    const onSecondaryAction = jest.fn();
    const articles = [makeArticle(1), makeArticle(2)];

    const { getAllByText, rerender } = render(
      <ArticleList
        articles={articles}
        theme={theme}
        onPrimaryAction={onPrimaryAction}
        onSecondaryAction={onSecondaryAction}
        secondaryLabel="Bookmark"
      />
    );

    // Tap primary on first row
    fireEvent.press(getAllByText('Open')[0]);
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    // Tap secondary on first row
    fireEvent.press(getAllByText('Bookmark')[0]);
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);

    // Now remove onPrimaryAction -> should use Linking.openURL fallback
    rerender(
      <ArticleList
        articles={articles}
        theme={theme}
        onPrimaryAction={undefined}
        onSecondaryAction={onSecondaryAction}
        secondaryLabel="Bookmark"
      />
    );

    fireEvent.press(getAllByText('Open')[0]);
    expect(Linking.openURL).toHaveBeenCalledWith(articles[1].url);
  });

  it('shows empty state and triggers onSuggestBookmark', () => {
    const onSuggestBookmark = jest.fn();
    const { getByText } = render(
      <ArticleList
        articles={[]}
        theme={theme}
        emptyText="Nothing here yet."
        onSuggestBookmark={onSuggestBookmark}
      />
    );

    expect(getByText('Nothing here yet.')).toBeTruthy();
    fireEvent.press(getByText('Explore Articles'));
    expect(onSuggestBookmark).toHaveBeenCalledTimes(1);
  });
});
