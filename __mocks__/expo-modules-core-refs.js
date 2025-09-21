/**
 * expo-modules-core-refs.js (Mock)
 *
 * Minimal stub for `expo-modules-core/src/Refs`, which is required by
 * `jest-expo`. Provides a `createRef` function similar to React’s `createRef`,
 * returning an object with a `current` property.
 *
 * Purpose:
 * - Prevents runtime errors in tests when components or modules depend
 *   on `expo-modules-core/src/Refs`.
 *
 * Author: Sunidhi Abhange
 */


function createRef(initial = null) {
  return { current: initial };
}

module.exports = {
  createRef,
};
