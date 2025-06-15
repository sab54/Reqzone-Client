import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DueTag from './DueTag';

const TaskCard = ({ item, isCompleted, onPress, theme = {} }) => {
    const {
        success = '#27ae60',
        border = '#ccc',
        highlight = '#f0f8ff',
        card = '#fff',
        text = '#333',
        shadow = '#000',
        accent = '#f39c12',
        primary = '#3498db',
    } = theme;

    const opacity = isCompleted ? 0.5 : 1;
    const iconName = isCompleted ? 'checkmark-circle' : 'ellipse-outline';
    const iconColor = isCompleted ? success : border;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                styles.card,
                {
                    backgroundColor: isCompleted ? highlight : card,
                    opacity,
                    shadowColor: shadow,
                },
            ]}
            accessibilityLabel={`${item.label} task`}
            accessibilityHint={`Press to ${
                isCompleted ? 'unmark' : 'complete'
            } this task`}
        >
            <Ionicons name={iconName} size={22} color={iconColor} />
            <View style={styles.textWrapper}>
                <Text style={[styles.label, { color: text }]} numberOfLines={2}>
                    {item.label}
                </Text>

                <View style={styles.meta}>
                    <DueTag dueDate={item.dueDate} theme={theme} />
                    {item?.tags?.length > 0 && (
                        <View
                            style={[
                                styles.tagDot,
                                {
                                    backgroundColor: accent || primary,
                                },
                            ]}
                        />
                    )}
                </View>
            </View>

            {isCompleted && item.xp && (
                <Text style={[styles.xp, { color: success }]}>
                    +{item.xp} XP
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    textWrapper: {
        flex: 1,
        marginLeft: 12,
    },
    label: {
        fontSize: 15,
        fontFamily: 'Poppins',
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    tagDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 6,
    },
    xp: {
        fontSize: 12,
        fontFamily: 'PoppinsBold',
    },
});

export default TaskCard;
