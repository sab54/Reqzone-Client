// index.js
/**
 * index.js (Application Entry Point)
 *
 * This file serves as the main entry point for the Expo application.
 * It registers the root `App` component with Expo, ensuring the app
 * is correctly bootstrapped whether it is run inside **Expo Go**
 * or as part of a native build.
 *
 * Key Responsibilities:
 * - **Import App Component**: Loads the main `App` component that defines
 *   the application’s root navigation and providers.
 * - **Register Root**: Uses `registerRootComponent` to register the `App`
 *   with React Native’s `AppRegistry` under the default name (`main`).
 * - **Environment Setup**: Ensures the correct runtime environment is
 *   initialized for Expo Go and standalone builds.
 *
 * Notes:
 * - This file should remain minimal; all app logic and navigation live in `App.js`.
 * - The `registerRootComponent` helper abstracts away the platform-specific
 *   `AppRegistry.registerComponent` boilerplate.
 *
 * Author: Sunidhi Abhange
 */


import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
