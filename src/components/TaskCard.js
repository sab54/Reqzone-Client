/**
 * TaskCard.js
 *
 * A compact, tappable card that displays a task with its label, due date,
 * optional tags indicator, and an earned XP badge when the task is completed.
 * Visual state and iconography adapt based on `isCompleted`.
 *
 * Key functionalities:
 * - **Completion State UI**:
 *   - Icon toggles between "ellipse-outline" (incomplete) and "checkmark-circle" (completed).
 *   - Card style updates when completed: background uses `theme.highlight`, card opacity reduced.
 *   - Icon color uses `theme.success` when completed; otherwise `theme.border`.
 *
 * - **Task Metadata**:
 *   - Renders the task label (2 lines max).
 *   - Shows a `DueTag` component for the `item.dueDate`.
 *   - Shows a small colored dot when `item.tags` is non-empty, using `theme.accent` (fallback `theme.primary`).
 *
 * - **XP Badge**:
 *   - When `isCompleted` and `item.xp` is provided, displays "+{xp} XP" with `theme.success` color.
 *
 * - **Interaction**:
 *   - Tapping the card calls the provided `onPress`.
 *   - Accessibility: `accessibilityLabel` is "`{item.label} task`", and
 *     `accessibilityHint` instructs to "Press to complete/unmark this task" depending on state.
 *
 * Theming (defaults shown below):
 * - `success = '#27ae60'`  : success/positive color (completed icon & XP)
 * - `border  = '#ccc'`     : neutral border (incomplete icon)
 * - `highlight = '#f0f8ff'`: completed card background
 * - `card = '#fff'`        : default card background
 * - `text = '#333'`        : label color
 * - `shadow = '#000'`      : shadow color
 * - `accent = '#f39c12'`   : tag-dot color (primary fallback)
 * - `primary = '#3498db'`  : fallback for accent/tag-dot
 *
 * Props:
 * - `item: { label: string, dueDate?: string|Date, tags?: any[], xp?: number }`
 * - `isCompleted: boolean`
 * - `onPress: () => void`
 * - `theme?: Partial<{
 *     success, border, highlight, card, text, shadow, accent, primary
 *   }>`
 *
 * Author: Sunidhi Abhange
 */

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
