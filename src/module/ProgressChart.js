/**
 * ProgressChart.js
 *
 * A compact dashboard card that visualizes preparedness progress for multiple
 * task buckets (e.g., “Go-bag”, “Documents”, “Evac Plan”). Each bucket shows:
 * - a circular progress indicator (completed/total),
 * - a priority icon (High/Medium/Low),
 * - and, when expanded, key task details (due date + description).
 *
 * Key functionalities:
 * - **Progress Calculation**: For each task bucket, computes `progress = completedTasks / totalTasks`
 *   (0 when total is falsy) and renders a circular indicator with a percentage label.
 * - **Priority Indicators**:
 *   - High → `warning` icon, error color
 *   - Medium → `information-circle` icon, warning color
 *   - Low (default) → `checkmark-circle` icon, success color
 * - **Adaptive Colors**: Progress ring color reflects completion level:
 *   - < 50% → error color
 *   - < 80% → warning color
 *   - ≥ 80% → success color
 * - **Expand/Collapse Details**: Tapping a card toggles additional details (due date & description).
 *
 * Props:
 * - `data: Record<string, { totalTasks: number|string, completedTasks: number|string, priority: 'High'|'Medium'|'Low'|string, dueDate: string, description: string }>`
 *   A keyed object where each key is the bucket title and the value contains counts and metadata.
 * - `theme: { card, border, cardShadow, background, surface, title, text, mutedText, error, warning, success }`
 *   Color palette used across the card, icons, and progress ring.
 *
 * UI/UX Notes:
 * - Uses `react-native-progress` `Circle` for the radial meter with an inline percentage label.
 * - Layout adapts to screen width: each bucket occupies ~¼ width (wraps to next line on small screens).
 * - Tapping a bucket toggles a detail panel below the grid without leaving the screen.
 *
 * Author: Sunidhi Abhange
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Circle } from 'react-native-progress';

const getTaskPriority = (priority) => {
    const priorityMap = {
        High: 'warning',
        Medium: 'information-circle',
        Low: 'checkmark-circle',
    };
    return priorityMap[priority] || 'checkmark-circle';
};

const getPriorityColor = (priority, theme) => {
    switch (priority) {
        case 'High':
            return theme.error;
        case 'Medium':
            return theme.warning;
        case 'Low':
        default:
            return theme.success;
    }
};

const getProgressColor = (progress, theme) => {
    if (progress < 0.5) return theme.error;
    if (progress < 0.8) return theme.warning;
    return theme.success;
};

const ProgressChart = ({ data, theme }) => {
    const [expanded, setExpanded] = useState(null);

    const toggleTaskDetails = (task) => {
        setExpanded(expanded === task ? null : task);
    };

    return (
        <Card
            style={[
                styles.card,
                {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    shadowColor: theme.cardShadow,
                },
            ]}
        >
            <Text style={[styles.title, { color: theme.title }]}>
                Preparedness Progress
            </Text>

            <View style={styles.tasksRow}>
                {Object.entries(data).map(([task, taskData]) => {
                    const {
                        totalTasks,
                        completedTasks,
                        priority,
                        dueDate,
                        description,
                    } = taskData;

                    const total = Number(totalTasks);
                    const completed = Number(completedTasks);
                    const progress = total > 0 ? completed / total : 0;

                    return (
                        <View
                            key={task}
                            style={[
                                styles.barRow,
                                expanded === task && {
                                    ...styles.expandedTask,
                                    backgroundColor: theme.card,
                                    borderColor: theme.border,
                                },
                            ]}
                        >
                            <TouchableOpacity
                                onPress={() => toggleTaskDetails(task)}
                                style={[
                                    styles.cardTouchable,
                                    { backgroundColor: theme.background },
                                ]}
                            >
                                <View style={styles.labelRow}>
                                    <Ionicons
                                        name={getTaskPriority(priority)}
                                        size={16}
                                        color={getPriorityColor(
                                            priority,
                                            theme
                                        )}
                                    />
                                    <Text
                                        style={[
                                            styles.label,
                                            { color: theme.text },
                                        ]}
                                    >
                                        {task}
                                    </Text>
                                </View>

                                <Circle
                                    size={45}
                                    progress={progress}
                                    color={getProgressColor(progress, theme)}
                                    showsText
                                    textStyle={{
                                        fontSize: 12,
                                        fontWeight: 'bold',
                                        color: theme.text,
                                    }}
                                    formatText={() =>
                                        `${Math.round(progress * 100)}%`
                                    }
                                />
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>

            {expanded && (
                <View
                    style={[
                        styles.detailsSection,
                        {
                            backgroundColor: theme.surface,
                        },
                    ]}
                >
                    <Text style={{ color: theme.text, fontSize: 14 }}>
                        Task Details:
                    </Text>
                    <Text style={{ color: theme.mutedText, fontSize: 12 }}>
                        Due Date: {data[expanded].dueDate}
                    </Text>
                    <Text style={{ color: theme.mutedText, fontSize: 12 }}>
                        Description: {data[expanded].description}
                    </Text>
                </View>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        borderRadius: 12,
        padding: 20,
        elevation: 5,
        borderWidth: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
        marginBottom: 10,
        textAlign: 'center',
    },
    tasksRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
        marginTop: 10,
    },
    barRow: {
        alignItems: 'center',
        marginRight: 10,
        marginBottom: 20,
        width: Dimensions.get('window').width / 4 - 15,
        justifyContent: 'center',
    },
    expandedTask: {
        borderRadius: 8,
        borderWidth: 1,
        padding: 8,
    },
    cardTouchable: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5,
        borderRadius: 8,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        fontFamily: 'Poppins',
        marginLeft: 6,
        fontWeight: 'bold',
    },
    detailsSection: {
        marginTop: 12,
        padding: 8,
        borderRadius: 5,
    },
});

export default ProgressChart;
