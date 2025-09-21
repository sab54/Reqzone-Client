/**
 * TaskStatsCard.js
 *
 * A compact summary card showing the user’s task progress and profile stats.
 * Displays level, XP, badge count, and a completed/total tasks fraction.
 *
 * Key functionalities:
 * - **Static Summary UI**: Renders a title and a single row of stat items.
 * - **Theming**: Accepts a `theme` object to customize colors for the card,
 *   title, and text. Falls back to sensible defaults when not provided.
 *
 * Props:
 * - `level` (number): Current level of the user.
 * - `xp` (number): Total experience points earned.
 * - `badgeCount` (number): Number of badges unlocked.
 * - `totalTasks` (number): Total tasks available.
 * - `completedTasks` (number): Tasks completed by the user.
 * - `theme` (object, optional):
 *     - `card`  (string): Background color of the card. Default: `#fff`
 *     - `title` (string): Color for the heading text. Default: `#000`
 *     - `text`  (string): Color for items in the row. Default: `#333`
 *
 * Layout:
 * - Title "📊 Your Stats" on top.
 * - A single row (`flexDirection: 'row'`, `justifyContent: 'space-between'`, `flexWrap: 'wrap'`)
 *   containing: Level, XP, Badges, Tasks (completed/total).
 *
 * Author: Sunidhi Abhange
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TaskStatsCard = ({
    level,
    xp,
    badgeCount,
    totalTasks,
    completedTasks,
    theme = {},
}) => {
    const { card = '#fff', title = '#000', text = '#333' } = theme;

    return (
        <View style={[styles.card, { backgroundColor: card }]}>
            <Text style={[styles.heading, { color: title }]}>
                📊 Your Stats
            </Text>
            <View style={styles.row}>
                <Text style={[styles.item, { color: text }]}>
                    Level: {level}
                </Text>
                <Text style={[styles.item, { color: text }]}>XP: {xp}</Text>
                <Text style={[styles.item, { color: text }]}>
                    Badges: {badgeCount}
                </Text>
                <Text style={[styles.item, { color: text }]}>
                    Tasks: {completedTasks}/{totalTasks}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
    },
    heading: {
        fontFamily: 'PoppinsBold',
        fontSize: 16,
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    item: {
        fontFamily: 'Poppins',
        fontSize: 13,
        marginBottom: 6,
    },
});

export default TaskStatsCard;
