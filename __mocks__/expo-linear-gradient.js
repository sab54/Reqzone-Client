/**
 * expo-linear-gradient.js (Mock)
 *
 * A Jest mock for the `expo-linear-gradient` module. Instead of rendering
 * a native gradient, this mock replaces it with a simple `View` that wraps
 * its children. This ensures stability in tests and avoids platform-specific
 * native behavior while still preserving children rendering.
 *
 * Usage:
 * - Imported automatically when `expo-linear-gradient` is required in tests.
 * - Useful for snapshot testing, where gradients would otherwise produce
 *   unstable or environment-dependent results.
 *
 * Author: Sunidhi Abhange
 */

import React from 'react';
import { View } from 'react-native';

// Replace LinearGradient with a simple View for snapshot stability
export const LinearGradient = ({ children, style }) => {
  return <View style={style}>{children}</View>;
};
