/**
 * expo-modules-core-web.js (Mock)
 *
 * Minimal stub for `expo-modules-core/src/web/*` used by `jest-expo`.
 * Exports a Proxy that returns a no-op function for any property access.
 *
 * Purpose:
 * - Avoids runtime errors for web-only APIs when running tests in Node.
 * - Ensures tests can run without needing actual Expo web modules.
 *
 * Author: Sunidhi Abhange
 */

const noop = () => {};
module.exports = new Proxy(
  {},
  {
    get: () => noop, // any prop access returns a function
  }
);
