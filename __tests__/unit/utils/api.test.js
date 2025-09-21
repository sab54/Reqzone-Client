/**
 * Client/src/utils/__tests__/api.test.js
 *
 * What This Test File Covers:
 *
 * 1) GET with query params
 *    - Calls encryptBody, serializes payload, sends correct fetch call.
 *
 * 2) POST/PUT/PATCH/DELETE
 *    - Each calls encryptBody, sends proper method and body/query.
 *
 * 3) Response Decryption
 *    - When server returns { payload }, decryptBody is called and result returned.
 *
 * 4) Error Handling
 *    - Non-OK response throws with server message.
 *    - If decryptBody throws, error "Invalid encrypted response" is raised.
 */


jest.spyOn(console, 'error').mockImplementation(() => {});
import * as api from '../../../src/utils/api'; // namespace import works with any export style

// --- Mocks ---
global.fetch = jest.fn();

// Mock BASE_URL used inside ../api.js (which imports './config')
jest.mock('src/utils/config', () => ({
  BASE_URL: 'https://mock.api',
}));

// Keep refs to assert calls/args
const mockEncrypt = jest.fn((body) => ({ payload: { ...body } }));
const mockDecrypt = jest.fn((payload) => payload);

// Mark as virtual so it applies even if the actual file isn’t present
jest.mock(
  'src/utils/crypto',
  () => ({
    encryptBody: (body) => mockEncrypt(body),
    decryptBody: (payload) => mockDecrypt(payload),
  }),
  { virtual: true }
);

beforeEach(() => {
  jest.clearAllMocks();
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({}),
  });
});

describe('utils/api (encrypted wrapper)', () => {
  it('GET builds query string and calls fetch', async () => {
    await api.get('/items', { a: 1, b: 'x' }, { Authorization: 'Bearer T' });

    expect(mockEncrypt).toHaveBeenCalledWith({ a: 1, b: 'x' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://mock.api/items?'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer T',
        }),
      })
    );
  });

  it('POST encrypts body and sends JSON stringified payload', async () => {
    await api.post('/submit', { foo: 'bar' });

    expect(mockEncrypt).toHaveBeenCalledWith({ foo: 'bar' });
    expect(fetch).toHaveBeenCalledWith(
      'https://mock.api/submit',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ payload: { foo: 'bar' } }),
      })
    );
  });

  it('PUT, PATCH, DELETE call encryptBody and use correct methods', async () => {
    await api.put('/p', { a: 1 });
    await api.patch('/q', { b: 2 });
    await api.del('/r', { c: 3 });

    expect(mockEncrypt).toHaveBeenCalledTimes(3);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://mock.api/p'),
      expect.objectContaining({ method: 'PUT' })
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://mock.api/q'),
      expect.objectContaining({ method: 'PATCH' })
    );
    // Only check presence of ?payload=; value format is up to encryptBody
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://mock.api/r?payload='),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('decrypts response when payload exists', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ payload: { foo: 'bar' } }),
    });

    const res = await api.post('/with-payload', { z: 1 });
    expect(mockDecrypt).toHaveBeenCalledWith({ foo: 'bar' });
    expect(res).toEqual({ foo: 'bar' });
  });

  it('throws with server message when not ok', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Bad Request' }),
    });

    await expect(api.post('/fail', {})).rejects.toThrow('Bad Request');
  });

  it('throws "Invalid encrypted response" if decryptBody fails', async () => {
    mockDecrypt.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ payload: 'bad' }),
    });

    await expect(api.post('/bad', {})).rejects.toThrow('Invalid encrypted response');
  });
});
