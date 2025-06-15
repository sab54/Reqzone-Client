import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ProgressBar = ({
    progress = 0,
    level = 1,
    xp = 0,
    nextLevelXP = 100,
    height = 12,
    theme,
    barStyle = {},
}) => {
    const animatedProgress = useRef(new Animated.Value(0)).current;
    const animatedXP = useRef(new Animated.Value(xp)).current;

    useEffect(() => {
        Animated.timing(animatedProgress, {
            toValue: Math.min(progress, 1),
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    useEffect(() => {
        Animated.timing(animatedXP, {
            toValue: xp,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [xp]);

    const progressWidth = animatedProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const xpRemaining = Math.max(nextLevelXP - xp, 0);

    return (
        <View style={styles.wrapper}>
            <View style={styles.header}>
                <Text style={[styles.level, { color: theme.text }]}>
                    Level {level}
                </Text>
                <Animated.Text
                    style={[styles.xp, { color: theme.muted || theme.text }]}
                >
                    {Math.floor(xp)} XP • {xpRemaining} to next
                </Animated.Text>
            </View>

            <View
                style={[
                    styles.barBackground,
                    {
                        backgroundColor: theme.barBackground || theme.border,
                        height,
                        ...barStyle,
                    },
                ]}
            >
                <Animated.View style={{ width: progressWidth, height }}>
                    <LinearGradient
                        colors={[
                            theme.primary,
                            theme.primaryLight || '#4facfe',
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.gradientFill, { height }]}
                    />
                </Animated.View>
            </View>

            <Text style={[styles.progressLabel, { color: theme.text }]}>
                {Math.round(progress * 100)}%
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    level: {
        fontFamily: 'PoppinsBold',
        fontSize: 14,
    },
    xp: {
        fontFamily: 'Poppins',
        fontSize: 13,
    },
    barBackground: {
        borderRadius: 6,
        overflow: 'hidden',
    },
    gradientFill: {
        width: '100%',
        borderRadius: 6,
    },
    progressLabel: {
        fontFamily: 'Poppins',
        fontSize: 12,
        textAlign: 'right',
        marginTop: 4,
    },
});

export default ProgressBar;
