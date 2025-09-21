/**
 * LevelUpToast.js
 *
 * This component displays a transient “level up” toast that fades in/out using an external Animated.Value.
 *
 * What This Component Does:
 * - **Animated Visibility**: Uses the provided `animatedValue` (0–1) to drive the toast’s `opacity`.
 * - **Theming**: Pulls `backgroundColor` from `theme.card`, text color from `theme.primary`,
 *   and shadow color from `theme.shadow` (fallback `#000`).
 * - **Status Message**: Shows a celebratory message with the new `level`.
 *
 * Component Structure:
 * 1. **Animated.View**: Positioned absolutely near the bottom-center with rounded corners and shadow/elevation.
 * 2. **Text**: Bold-ish Poppins font with primary-colored text describing the level-up.
 *
 * Props:
 * - `animatedValue: Animated.AnimatedInterpolation | Animated.Value`
 *    - Controls the opacity of the toast. Expected range: 0 (hidden) to 1 (fully visible).
 * - `level: number | string`
 *    - The target level to display in the message.
 * - `theme: { card: string, primary: string, shadow?: string }`
 *    - `card`: Background color of the toast container.
 *    - `primary`: Color for the text.
 *    - `shadow` (optional): Shadow color for iOS; defaults to `#000`.
 *
 * Behavior:
 * - Visual only: no timers or gesture handling here. Parent component is responsible for animating `animatedValue`
 *   (e.g., via `Animated.timing`) and for mounting/unmounting lifecycle.
 * - Layout is absolute with fixed insets to sit above other UI near the bottom.
 *
 * Notes:
 * - Requires `PoppinsBold` (or alias) to be loaded in the app for correct font rendering.
 * - Shadow props (iOS) and `elevation` (Android) are applied for subtle depth.
 * - Keep performance in mind: drive the opacity with `useNativeDriver: true` in parent animations where possible.
 *
 * Author: Sunidhi Abhange
 */

import React from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

const LevelUpToast = ({ animatedValue, level, theme }) => (
    <Animated.View
        style={[
            styles.toast,
            {
                opacity: animatedValue,
                backgroundColor: theme.card,
                shadowColor: theme.shadow || '#000',
            },
        ]}
    >
        <Text style={[styles.text, { color: theme.primary }]}>
            🎉 Level Up! You're now Level {level}!
        </Text>
    </Animated.View>
);

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 6,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    text: {
        fontSize: 15,
        fontFamily: 'PoppinsBold',
    },
});

export default LevelUpToast;
