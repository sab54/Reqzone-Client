/**
 * TipBanner.js
 *
 * This component displays a simple banner with a lightbulb icon and a tip message.
 * It is used to surface helpful hints or guidance to the user inside the app.
 *
 * Key Features:
 * - **Highlight Background**: Uses a theme-provided `highlight` color (default: beige-like `#f5f5dc`) for the banner background.
 * - **Tip Text Styling**: Displays the provided `tip` text prefixed with a 💡 emoji, styled using theme-provided `title` color (default: black).
 * - **Theming Support**: Accepts a `theme` prop to override colors for customization.
 *
 * Props:
 * - `tip` *(string, required)*: The tip message to display inside the banner.
 * - `theme` *(object, optional)*: Custom theme overrides:
 *   - `highlight` (string) → background color of the banner.
 *   - `title` (string) → text color of the tip.
 *
 * Accessibility:
 * - The entire banner is accessible as text content.
 *
 * Usage:
 * ```jsx
 * <TipBanner
 *   tip="Stay hydrated and take regular breaks!"
 *   theme={{ highlight: '#e0f7fa', title: '#00695c' }}
 * />
 * ```
 *
 * Author: Sunidhi Abhange
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TipBanner = ({ tip, theme = {} }) => {
    const {
        highlight = '#f5f5dc', // default to a soft yellow-like highlight
        title = '#000', // default to black text
    } = theme;

    return (
        <View style={[styles.container, { backgroundColor: highlight }]}>
            <Text style={[styles.tipText, { color: title }]}>💡 {tip}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
    },
    tipText: {
        fontSize: 13,
        fontFamily: 'Poppins',
    },
});

export default TipBanner;
