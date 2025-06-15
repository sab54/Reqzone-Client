import React from 'react';
import { TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SwipeActions = ({
    dragX,
    article,
    index,
    isBookmarked,
    onAction,
    theme = {},
}) => {
    const translateX = dragX.interpolate({
        inputRange: [-180, 0],
        outputRange: [0, 180],
        extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
        inputRange: [-180, -90, 0],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp',
    });

    return (
        <Animated.View
            style={[
                styles.sideBySideContainer,
                { transform: [{ translateX }], opacity },
            ]}
        >
            <TouchableOpacity
                onPress={() => onAction('open', article, index)}
                style={[
                    styles.swipeContent,
                    { backgroundColor: theme.primary || '#3498db' },
                ]}
            >
                <Ionicons
                    name='open-outline'
                    size={22}
                    color={theme.buttonPrimaryText || '#fff'}
                />
                <Text
                    style={[
                        styles.swipeText,
                        { color: theme.buttonPrimaryText || '#fff' },
                    ]}
                >
                    Open{'\n'}Article
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => onAction('bookmark', article, index)}
                style={[
                    styles.swipeContent,
                    {
                        backgroundColor: isBookmarked
                            ? theme.error || '#e74c3c'
                            : theme.success || '#27ae60',
                    },
                ]}
            >
                <Ionicons
                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={22}
                    color={theme.buttonPrimaryText || '#fff'}
                />
                <Text
                    style={[
                        styles.swipeText,
                        { color: theme.buttonPrimaryText || '#fff' },
                    ]}
                >
                    {isBookmarked ? 'Remove\nBookmark' : 'Add\nBookmark'}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    sideBySideContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: '100%',
        paddingRight: 10,
    },
    swipeContent: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 90,
        height: '100%',
        borderRadius: 6,
        marginLeft: 10,
    },
    swipeText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
        fontFamily: 'Poppins',
    },
});

export default SwipeActions;
