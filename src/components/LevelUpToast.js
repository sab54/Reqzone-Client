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
