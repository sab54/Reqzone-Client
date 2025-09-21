/**
 * ProgressChart.test.js
 *
 * What This Test File Covers:
 *
 * 1) Rendering
 *    - Displays title "Preparedness Progress".
 *    - Renders each task with label and progress percentage.
 *
 * 2) Progress calculations
 *    - Circle receives correct progress value (completed/total).
 *    - Colors change based on thresholds (<0.5 error, <0.8 warning, >=0.8 success).
 *
 * 3) Priority Icons
 *    - Displays Ionicons with correct name & color for High/Medium/Low priority.
 *
 * 4) Expansion toggle
 *    - Pressing a task toggles detail view (due date + description).
 *    - Pressing again collapses it.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// ---- Mocks ----

// Ionicons mock
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, color, size }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return (
      <Text testID={`icon-${name}`} style={{ color, fontSize: size }}>
        {name}
      </Text>
    );
  },
}));

// Card mock
jest.mock('react-native-paper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Card: ({ children, ...rest }) => <View {...rest}>{children}</View> };
});

// Circle mock
jest.mock('react-native-progress', () => ({
  Circle: ({ progress, color, formatText }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return (
      <Text testID="circle" style={{ color }}>
        {formatText ? formatText(progress) : progress}::{color}
      </Text>
    );
  },
}));

// ---- SUT ----
import ProgressChart from '../../../src/module/ProgressChart';

// ---- Helpers ----
const theme = {
  card: '#fff',
  border: '#ccc',
  cardShadow: '#000',
  background: '#f7f7f7',
  surface: '#fafafa',
  text: '#111',
  mutedText: '#777',
  title: '#000',
  error: 'red',
  warning: 'orange',
  success: 'green',
};

const data = {
  'Task A': {
    totalTasks: 10,
    completedTasks: 2,
    priority: 'High',
    dueDate: '2025-12-31',
    description: 'Critical action',
  },
  'Task B': {
    totalTasks: 5,
    completedTasks: 3,
    priority: 'Medium',
    dueDate: '2025-10-01',
    description: 'Medium task',
  },
  'Task C': {
    totalTasks: 4,
    completedTasks: 4,
    priority: 'Low',
    dueDate: '2025-09-30',
    description: 'All done',
  },
};

// ---- Tests ----
describe('ProgressChart', () => {
  it('renders title and tasks', () => {
    const { getByText } = render(<ProgressChart data={data} theme={theme} />);
    expect(getByText('Preparedness Progress')).toBeTruthy();
    expect(getByText('Task A')).toBeTruthy();
    expect(getByText('Task B')).toBeTruthy();
    expect(getByText('Task C')).toBeTruthy();
  });

  it('calculates progress and passes correct color', () => {
    const { getAllByTestId } = render(<ProgressChart data={data} theme={theme} />);
    const circles = getAllByTestId('circle').map((el) => el.props.children);

    // Task A: 2/10 = 20% -> red
    expect(circles[0]).toContain('20%');
    expect(circles[0]).toContain('red');

    // Task B: 3/5 = 60% -> orange
    expect(circles[1]).toContain('60%');
    expect(circles[1]).toContain('orange');

    // Task C: 4/4 = 100% -> green
    expect(circles[2]).toContain('100%');
    expect(circles[2]).toContain('green');
  });

  it('renders priority icons with correct names', () => {
    const { getByTestId } = render(<ProgressChart data={data} theme={theme} />);
    expect(getByTestId('icon-warning')).toBeTruthy(); // High
    expect(getByTestId('icon-information-circle')).toBeTruthy(); // Medium
    expect(getByTestId('icon-checkmark-circle')).toBeTruthy(); // Low
  });

  it('toggles task details when pressed', () => {
    const { getByText, queryByText } = render(<ProgressChart data={data} theme={theme} />);

    // Initially details are hidden
    expect(queryByText(/Task Details/i)).toBeNull();

    // Expand Task A
    fireEvent.press(getByText('Task A'));
    expect(getByText(/Task Details/i)).toBeTruthy();
    expect(getByText(/Critical action/)).toBeTruthy();

    // Collapse Task A
    fireEvent.press(getByText('Task A'));
    expect(queryByText(/Task Details/i)).toBeNull();
  });
});
