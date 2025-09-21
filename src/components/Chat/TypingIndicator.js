/**
 * TypingIndicator.js
 *
 * A lightweight animated indicator that shows when one or more users are typing.
 *
 * Key functionalities:
 * - **Animated Dots**: Three dots animate in sequence using React Native's Animated API.
 * - **Status Text**: Message adapts based on the number of `usernames` provided:
 *    - 0 -> "Typing..."
 *    - 1 -> "<name> is typing..."
 *    - 2 -> "<name1> and <name2> are typing..."
 *    - 3+ -> "Multiple people are typing..."
 * - **Theming**: Colors are taken from the provided `theme`:
 *    - `theme.surface` for the wrapper background
 *    - `theme.text` for the label
 *    - `theme.link` for the dot color
 *
 * Component Flow:
 * 1. On mount, start a looped staggered opacity animation for the three dots.
 * 2. Render the dynamic text + the animated dot row.
 *
 * Notes:
 * - Animation is set with `useNativeDriver: true` in source code; test setup may override.
 * - Does not manage visibility; render conditionally from parent if needed.
 *
 * Author: Sunidhi Abhange
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';

const TypingIndicator = ({ theme, usernames = [] }) => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (dot, delay) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0.3,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        animate(dot1, 0);
        animate(dot2, 150);
        animate(dot3, 300);
    }, [dot1, dot2, dot3]);

    const styles = createStyles(theme);

    const renderTypingText = () => {
        if (usernames.length === 0) return 'Typing...';
        if (usernames.length === 1) return `${usernames[0]} is typing...`;
        if (usernames.length === 2)
            return `${usernames[0]} and ${usernames[1]} are typing...`;
        return 'Multiple people are typing...';
    };

    return (
        <View style={styles.wrapper}>
            <Text style={styles.text}>{renderTypingText()}</Text>
            <View style={styles.dotContainer}>
                <Animated.View
                    style={[
                        styles.dot,
                        { opacity: dot1, backgroundColor: theme.link },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.dot,
                        { opacity: dot2, backgroundColor: theme.link },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.dot,
                        { opacity: dot3, backgroundColor: theme.link },
                    ]}
                />
            </View>
        </View>
    );
};

const createStyles = (theme) =>
    StyleSheet.create({
        wrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: theme.surface,
        },
        text: {
            fontFamily: 'Poppins',
            fontSize: 13,
            color: theme.text,
            marginRight: 8,
        },
        dotContainer: {
            flexDirection: 'row',
        },
        dot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginHorizontal: 3,
        },
    });

export default TypingIndicator;
