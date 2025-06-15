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
