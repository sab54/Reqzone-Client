/**
 * Client/src/utils/__tests__/apiPaths.test.js
 *
 * What this test file covers:
 * - Ensures that the exported API_URL_* constants from apiPaths.js
 *   match the expected string values.
 */

import {
  API_URL_CHAT,
  API_URL_USERS,
  API_URL_NEWS,
  API_URL_DOCUMENTS,
  API_URL_TASKS,
  API_URL_QUIZZES,
  API_URL_DASHBOARD,
  API_URL_BADGES,
  API_URL_ALERTS,
} from 'src/utils/apiPaths';

describe('utils/apiPaths', () => {
  it('should export correct API_URL_CHAT', () => {
    expect(API_URL_CHAT).toBe('/v0.0/chat');
  });

  it('should export correct API_URL_USERS', () => {
    expect(API_URL_USERS).toBe('/v0.0/users');
  });

  it('should export correct API_URL_NEWS', () => {
    expect(API_URL_NEWS).toBe('/v0.0/news');
  });

  it('should export correct API_URL_DOCUMENTS', () => {
    expect(API_URL_DOCUMENTS).toBe('/v0.0/documents');
  });

  it('should export correct API_URL_TASKS', () => {
    expect(API_URL_TASKS).toBe('/v0.0/tasks');
  });

  it('should export correct API_URL_QUIZZES', () => {
    expect(API_URL_QUIZZES).toBe('/v0.0/quizzes');
  });

  it('should export correct API_URL_DASHBOARD', () => {
    expect(API_URL_DASHBOARD).toBe('/v0.0/dashboard');
  });

  it('should export correct API_URL_BADGES', () => {
    expect(API_URL_BADGES).toBe('/v0.0/badges');
  });

  it('should export correct API_URL_ALERTS', () => {
    expect(API_URL_ALERTS).toBe('/v0.0/alerts');
  });
});
