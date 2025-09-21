/**
 * Footer.js
 *
 * This component renders a footer section for the application.
 *
 * Key functionalities:
 * - **Dynamic Theming**: Background and text colors are applied from the provided `theme` object.
 * - **Branding Text**: Displays the static message `"Designed with ❤️ by Su"`.
 *
 * Component Structure:
 * 1. **Container View**: Positioned with padding and centered alignment.
 * 2. **Text Element**: Styled with small font size, Poppins font family, and reduced opacity.
 *
 * Props:
 * - `theme`: An object containing color values.
 *    - `footerBackground`: Background color for the footer.
 *    - `text`: Color for the footer text.
 *
 * Notes:
 * - The `Poppins` font must be loaded in the app (e.g., via `expo-font`).
 * - This component is purely presentational and does not manage state.
 *
 * Author: Sunidhi Abhange
 */

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

const Footer = ({ theme }) => {
    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.footerBackground },
            ]}
        >
            <Text style={[styles.text, { color: theme.text }]}>
                Designed with ❤️ by Su
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    text: {
        fontSize: 13,
        fontFamily: 'Poppins',
        opacity: 0.6,
    },
});

export default Footer;
