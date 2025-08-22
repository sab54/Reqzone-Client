import React from 'react';
import { TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SwipeActions = ({
    dragX,
    article,
    index,
    isBookmarked,
    onAction,
    actions = [
        {
            type: 'open',
            label: 'Open\n',
            icon: 'open-outline',
            color: '#3498db',
        },
        {
            type: 'bookmark',
            label: 'Add\nBookmark',
            icon: 'bookmark-outline',
            color: '#27ae60',
        },
    ],
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

    const getActionStyle = (action) => {
        if (action.type === 'bookmark') {
            return {
                backgroundColor: isBookmarked
                    ? theme.error || '#e74c3c'
                    : action.color || theme.success || '#27ae60',
                icon: isBookmarked ? 'bookmark' : 'bookmark-outline',
                label: isBookmarked
                    ? 'Remove\nBookmark'
                    : action.label || 'Add\nBookmark',
            };
        }

        return {
            backgroundColor: action.color || theme.primary || '#3498db',
            icon: action.icon || 'help-outline',
            label: action.label || 'Action',
        };
    };

    return (
        <Animated.View
            style={[
                styles.sideBySideContainer,
                { transform: [{ translateX }], opacity },
            ]}
        >
            {actions.map((action) => {
                const { backgroundColor, icon, label } = getActionStyle(action);
                return (
                    <TouchableOpacity
                        key={action.type}
                        onPress={() => onAction(action.type, article, index)}
                        style={[
                            styles.swipeContent,
                            { backgroundColor: backgroundColor },
                        ]}
                    >
                        <Ionicons
                            name={icon}
                            size={22}
                            color={theme.buttonPrimaryText || '#fff'}
                        />
                        <Text
                            style={[
                                styles.swipeText,
                                { color: theme.buttonPrimaryText || '#fff' },
                            ]}
                        >
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
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
