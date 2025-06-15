import React from 'react';
import { Text, StyleSheet } from 'react-native';

const DueTag = ({ dueDate, theme }) => {
    const daysLeft = Math.ceil(
        (new Date(dueDate) - new Date()) / (1000 * 3600 * 24)
    );

    const status =
        daysLeft < 0
            ? 'Overdue'
            : daysLeft === 0
            ? 'Due Today'
            : `Due in ${daysLeft}d`;

    const color =
        daysLeft < 0
            ? theme.error
            : daysLeft === 0
            ? theme.warning
            : theme.text;

    return <Text style={[styles.text, { color }]}>{`📅 ${status}`}</Text>;
};

const styles = StyleSheet.create({
    text: {
        fontSize: 12,
        fontFamily: 'Poppins',
        opacity: 0.85,
    },
});

export default DueTag;
