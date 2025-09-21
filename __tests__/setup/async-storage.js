/**
 * async-storage.js (Mock)
 *
 * Exports the official Jest mock provided by `@react-native-async-storage/async-storage`.
 * This mock simulates AsyncStorage functionality (getItem, setItem, removeItem, etc.)
 * in memory for tests, ensuring components relying on AsyncStorage can be tested
 * without using device storage.
 *
 * Author: Sunidhi Abhange
 */

export * from '@react-native-async-storage/async-storage/jest/async-storage-mock';
