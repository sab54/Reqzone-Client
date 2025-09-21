/**
 * babel.config.js
 *
 * This is the Babel configuration file used by the project. It defines the presets and plugins that Babel uses to 
 * transpile JavaScript and React Native code. The configuration ensures compatibility with Expo and supports the 
 * use of reanimated animations in the application.
 *
 * Features:
 * - `babel-preset-expo`: A preset specifically designed for Expo apps, providing the necessary configurations 
 *   for compiling React Native code.
 * - `react-native-reanimated/plugin`: A plugin that supports the use of the `react-native-reanimated` library for 
 *   enhanced animations and gestures in React Native apps.
 *
 * This file uses the following libraries:
 * - `babel-preset-expo`: Expo's preset for Babel configuration.
 * - `react-native-reanimated/plugin`: A Babel plugin for enabling the `react-native-reanimated` library.
 *
 * Dependencies:
 * - babel-preset-expo
 * - react-native-reanimated
 *
 * Author: Sunidhi Abhange
 */

module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: ['react-native-worklets/plugin'],
    };
};
