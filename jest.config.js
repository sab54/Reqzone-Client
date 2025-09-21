/**
 * jest.config.js
 *
 * Jest configuration file for the Expo + React Native project.
 *
 * Features:
 * - Preset: `jest-expo` for Expo compatibility.
 * - Environment: Node.
 * - Matches tests in both colocated (`__tests__`) and top-level `*.test.js`.
 * - Global setup via `__tests__/setup/jest.setup.js`.
 * - Module aliasing for stubs and project paths:
 *   - `expo-modules-core` → mocks
 *   - `react-native-swiper` → custom mock
 *   - `@/` and `src/` → source code path aliases
 * - Ignores transforms for most node_modules except React Native / Expo related ones.
 * - Supports multiple projects (android / iOS) for platform-specific testing.
 *
 * Author: Sunidhi Abhange
 */

const baseConfig = {
  preset: 'jest-expo',
  testEnvironment: 'node',

  // match both colocated and top-level tests
  testMatch: ['<rootDir>/**/__tests__/**/*.test.js', '<rootDir>/**/*.test.js'],

  // your global setup (this file must exist)
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.js'],

  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    // map jest-expo internal imports to our stubs
    '^expo-modules-core/src/Refs$': '<rootDir>/__mocks__/expo-modules-core-refs.js',
    '^expo-modules-core/src/web/(.*)$': '<rootDir>/__mocks__/expo-modules-core-web.js',

    // your aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',

    // make sure the folder name matches: __mocks__ (not __mock__)
    '^react-native-swiper$': '<rootDir>/__mocks__/react-native-swiper.js',

    // keep broad mapping for remaining expo-modules-core imports
    '^expo-modules-core/src/(.*)$': 'expo-modules-core/build/$1',
  },

  transformIgnorePatterns: [
    'node_modules/(?!(react-native'
      + '|@react-native'
      + '|@react-native-community'
      + '|react-native-reanimated'
      + '|@react-navigation'
      + '|expo(nent)?'
      + '|@expo(nent)?/.*'
      + '|expo-.*'
      + '|expo-modules-core'
      + '|react-native-gesture-handler'
      + '|react-native-safe-area-context'
      + '|react-native-worklets'
      + ')/)',
  ],

  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

module.exports = {
  rootDir: __dirname,
  projects: [
    {
      displayName: 'android',
      ...baseConfig,
    },
    {
      displayName: 'ios',
      ...baseConfig,
    },
        {
      displayName: 'node',
      ...baseConfig,
    },
  ],
};
