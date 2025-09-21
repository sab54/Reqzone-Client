// Client/src/components/DueTag.js
/**
 * DueTag.js
 *
 * Displays a compact due-date status as text with an emoji prefix.
 *
 * Status logic (based on whole days, using Math.ceil):
 * - Overdue   : when (dueDate - now) < 0 days  -> text "📅 Overdue", color = theme.error
 * - Due Today : when (dueDate - now) == 0 days -> text "📅 Due Today", color = theme.warning
 * - Future    : when (dueDate - now) > 0 days  -> text "📅 Due in Xd", color = theme.text
 *
 * Notes on day calculation:
 * - Uses: daysLeft = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 3600 * 24))
 * - Because of Math.ceil, a due date later *today* yields 1 (not 0). Therefore
 *   "Due Today" occurs only when dueDate equals the current time down to the ms.
 *
 * Props:
 * - dueDate (string | Date): Target due timestamp.
 * - theme: { error, warning, text } colors for the statuses.
 *
 * Author: Sunidhi Abhange
 */

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
