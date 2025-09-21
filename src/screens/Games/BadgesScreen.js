// src/screens/Gamification/BadgesScreen.js
/**
 * BadgesScreen
 *
 * Displays a user's badge collection with lock/unlock state derived from Redux.
 *
 * Key functionalities:
 * - **Static Badge Catalog**: Renders a fixed list of achievement badges (Prepared, Quiz Master, Level Up)
 *   with a title, description, and Ionicons icon name.
 * - **Unlock State from Redux**: Reads `state.gamification.badges` (array of badge keys) via `useSelector`
 *   and marks corresponding cards as unlocked (full opacity, success color, "Unlocked 🎉" label).
 * - **Locked Presentation**: Badges not in the unlocked array render with reduced opacity,
 *   border/neutral color, and the "Locked 🔒" label.
 * - **Theming**: All colors and surface/background values come from the provided `theme` prop
 *   (e.g., `theme.surface`, `theme.textPrimary`, `theme.success`).
 *
 * Render flow:
 * 1. Compute styles from `getStyles(theme)`.
 * 2. Render a screen title and a FlatList of `badgeList`.
 * 3. For each badge, compute `isUnlocked` by checking presence in the Redux `badges` array.
 * 4. Set icon color, text color, and card opacity based on unlock state.
 *
 * Notes:
 * - This screen assumes `state.gamification.badges` exists and is an array of keys such as "prepared".
 * - The `theme` prop must supply the keys used in `getStyles` (e.g., background, surface, textPrimary, success, border, iconActive, iconInactive).
 *
 * Author: Sunidhi Abhange
 */

import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

const badgeList = [
    {
        key: 'prepared',
        title: 'Prepared',
        description: 'Completed all checklist tasks',
        icon: 'shield-checkmark',
    },
    {
        key: 'quizmaster',
        title: 'Quiz Master',
        description: 'Completed all quizzes',
        icon: 'school',
    },
    {
        key: 'levelup',
        title: 'Level Up',
        description: 'Reached Level 2 or higher',
        icon: 'rocket',
    },
];

const BadgesScreen = ({ theme }) => {
    const unlocked = useSelector((state) => state.gamification.badges);

    const styles = getStyles(theme);

    const renderBadge = ({ item }) => {
        const isUnlocked = unlocked.includes(item.key);

        return (
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: theme.surface,
                        shadowColor: theme.shadow,
                        opacity: isUnlocked ? 1 : 0.5,
                    },
                ]}
            >
                <Ionicons
                    name={item.icon}
                    size={60}
                    color={isUnlocked ? theme.iconActive : theme.iconInactive}
                    style={styles.icon}
                />
                <Text style={[styles.title, { color: theme.textPrimary }]}>
                    {item.title}
                </Text>
                <Text style={[styles.desc, { color: theme.textSecondary }]}>
                    {item.description}
                </Text>
                <Text
                    style={[
                        styles.status,
                        { color: isUnlocked ? theme.success : theme.border },
                    ]}
                >
                    {isUnlocked ? 'Unlocked 🎉' : 'Locked 🔒'}
                </Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
                🎖️ Badge Collection
            </Text>
            <FlatList
                data={badgeList}
                renderItem={renderBadge}
                keyExtractor={(item) => item.key}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
};

const getStyles = (theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
        },
        screenTitle: {
            fontSize: 22,
            fontFamily: 'PoppinsBold',
            marginBottom: 20,
        },
        card: {
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 16,
            elevation: 3,
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
        },
        icon: {
            marginBottom: 12,
        },
        title: {
            fontSize: 16,
            fontFamily: 'PoppinsBold',
        },
        desc: {
            fontSize: 14,
            fontFamily: 'Poppins',
            textAlign: 'center',
            marginVertical: 4,
        },
        status: {
            fontSize: 13,
            fontFamily: 'PoppinsBold',
            marginTop: 6,
        },
    });

export default BadgesScreen;
