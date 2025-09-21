/**
 * newsActions.js
 *
 * Thunk: fetchNewsData(category = 'All', page = 1, pageSize = 6)
 *
 * Responsibilities:
 * - Dispatches loading state: setNewsLoading(true/false).
 * - Reads & writes page-scoped cache in AsyncStorage:
 *   key = `newsArticles_${category}_page_${page}`.
 *   If cached exists: hydrate UI immediately (set/append) before any network call.
 * - DEV mode:
 *   - Uses mockArticles; optional category filter against title+description.
 *   - Paginates: page*pageSize for cumulative pages; on page 1 -> setNewsArticles,
 *     otherwise -> appendNewsArticles with current page slice.
 *   - Sets total via setNewsTotal.
 *   - Skips network.
 * - Production mode:
 *   - Category "Local": GET top-headlines by `Localization.region` (fallback 'us').
 *   - Other categories:
 *       * "All" -> query "emergency OR disaster"
 *       * custom category -> used as query.
 *   - Calls NewsAPI (`/v2/top-headlines` or `/v2/everything`) with NEWS_API_KEY.
 *   - On success: set/append articles, set total, and cache the articles by page.
 *   - Non-array response warns via console.warn.
 *
 * Params:
 * - category (string | any): coerced to string; defaults to 'All'.
 * - page (number): 1-based paging; defaults to 1.
 * - pageSize (number): defaults to 6.
 *
 * Notes:
 * - Uses AsyncStorage, expo-localization, and config (DEV_MODE, NEWS_API_KEY).
 * - Always clears loading in finally.
 *
 * Author: Sunidhi Abhange
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    setNewsArticles,
    appendNewsArticles,
    setNewsLoading,
    setNewsTotal,
} from '../reducers/newsReducer';
import { DEV_MODE, NEWS_API_KEY } from '../../utils/config';
import { mockArticles } from '../../data/mockData';
import * as Localization from 'expo-localization';

export const fetchNewsData =
    (_category = 'All', page = 1, pageSize = 6) =>
    async (dispatch) => {
        const category = typeof _category === 'string' ? _category : 'All';

        try {
            dispatch(setNewsLoading(true));

            const cacheKey = `newsArticles_${category}_page_${page}`;
            let combinedArticles = [];

            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                combinedArticles = [...parsed];
                if (page === 1) dispatch(setNewsArticles(parsed));
                else dispatch(appendNewsArticles(parsed));
            }

            // DEV MODE logic
            if (DEV_MODE) {
                const filteredMock =
                    category === 'All'
                        ? mockArticles.articles
                        : mockArticles.articles.filter((a) =>
                              `${a.title} ${a.description || ''}`
                                  .toLowerCase()
                                  .includes(category.toLowerCase())
                          );

                const paginated = filteredMock.slice(0, page * pageSize);

                dispatch(setNewsTotal(filteredMock.length));
                dispatch(
                    page === 1
                        ? setNewsArticles(paginated)
                        : appendNewsArticles(
                              paginated.slice((page - 1) * pageSize)
                          )
                );
                return;
            }

            const isLocal = category === 'Local';
            const countryCode = Localization.region || 'us';
            const query =
                category === 'All' ? 'emergency OR disaster' : category;

            const url = isLocal
                ? `https://newsapi.org/v2/top-headlines?country=${countryCode}&pageSize=${pageSize}&page=${page}&apiKey=${NEWS_API_KEY}`
                : `https://newsapi.org/v2/everything?q=${encodeURIComponent(
                      query
                  )}&language=en&pageSize=${pageSize}&page=${page}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;

            const response = await fetch(url);
            const data = await response.json();

            if (Array.isArray(data.articles)) {
                dispatch(
                    page === 1
                        ? setNewsArticles(data.articles)
                        : appendNewsArticles(data.articles)
                );

                dispatch(setNewsTotal(data.totalResults || 0));

                await AsyncStorage.setItem(
                    cacheKey,
                    JSON.stringify(data.articles)
                );
            } else {
                console.warn('No articles array in response:', data);
            }
        } catch (error) {
            console.error('News fetch error:', error);
        } finally {
            dispatch(setNewsLoading(false));
        }
    };
