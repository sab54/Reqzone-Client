// __tests__/unit/components/TaskStatsCard.test.js

/**
 * TaskStatsCard.test.js
 *
 * What This Test File Covers:
 *
 * 1) Basic Rendering
 *    - Shows heading and all stat items with correct values.
 *
 * 2) Theming
 *    - Applies theme colors to card background, title, and text items.
 *
 * 3) Defaults
 *    - Falls back to default colors when theme is omitted.
 *
 * 4) Tasks Fraction
 *    - Displays completed/total tasks in "X/Y" format correctly.
 *
 * 5) Layout Row Styles
 *    - Row container has flexDirection 'row', justifyContent 'space-between', and flexWrap 'wrap'.
 *
 * Notes:
 * - No native deps; pure RN component assertions (styles + content).
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// 👉 Update this path if your structure differs
import TaskStatsCard from '../../../src/components/TaskStatsCard';

const flatten = (style) =>
  Array.isArray(style) ? Object.assign({}, ...style) : style;

const findViewWithStyle = (tree, predicate) => {
  if (!tree || typeof tree !== 'object') return null;
  const { type, props, children } = tree;

  if (
    type === 'View' &&
    props &&
    props.style &&
    predicate(flatten(props.style))
  ) {
    return tree;
  }

  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findViewWithStyle(child, predicate);
      if (found) return found;
    }
  }
  return null;
};

describe('TaskStatsCard', () => {
  test('renders heading and all stat items with correct values', () => {
    const props = {
      level: 7,
      xp: 1234,
      badgeCount: 12,
      totalTasks: 40,
      completedTasks: 25,
      theme: { card: '#fafafa', title: '#111111', text: '#222222' },
    };

    const { getByText } = render(<TaskStatsCard {...props} />);

    // Heading
    expect(getByText('📊 Your Stats')).toBeTruthy();

    // Row items
    expect(getByText('Level: 7')).toBeTruthy();
    expect(getByText('XP: 1234')).toBeTruthy();
    expect(getByText('Badges: 12')).toBeTruthy();
    expect(getByText('Tasks: 25/40')).toBeTruthy();
  });

  test('applies theme colors to card, title, and items', () => {
    const theme = { card: '#fafafa', title: '#111111', text: '#222222' };
    const { toJSON, getByText } = render(
      <TaskStatsCard
        level={1}
        xp={10}
        badgeCount={0}
        totalTasks={2}
        completedTasks={1}
        theme={theme}
      />
    );

    const tree = toJSON();
    // Card backgroundColor
    const cardView = findViewWithStyle(tree, (s) => s.backgroundColor === theme.card);
    expect(cardView).toBeTruthy();

    // Title color
    const heading = getByText('📊 Your Stats');
    const headingStyle = flatten(heading.props.style);
    expect(headingStyle.color).toBe(theme.title);

    // Item text color (spot check one)
    const levelText = getByText('Level: 1');
    const levelStyle = flatten(levelText.props.style);
    expect(levelStyle.color).toBe(theme.text);
  });

  test('falls back to default colors when theme is omitted', () => {
    const { toJSON, getByText } = render(
      <TaskStatsCard
        level={2}
        xp={99}
        badgeCount={5}
        totalTasks={10}
        completedTasks={3}
        // no theme
      />
    );

    const tree = toJSON();

    // Defaults from component:
    // card: '#fff', title: '#000', text: '#333'
    const cardView = findViewWithStyle(tree, (s) => s.backgroundColor === '#fff');
    expect(cardView).toBeTruthy();

    const heading = getByText('📊 Your Stats');
    const headingStyle = flatten(heading.props.style);
    expect(headingStyle.color).toBe('#000');

    const xpText = getByText('XP: 99');
    const xpStyle = flatten(xpText.props.style);
    expect(xpStyle.color).toBe('#333');
  });

  test('displays tasks fraction in "completed/total" format', () => {
    const { getByText, rerender } = render(
      <TaskStatsCard
        level={1}
        xp={0}
        badgeCount={0}
        totalTasks={0}
        completedTasks={0}
      />
    );
    expect(getByText('Tasks: 0/0')).toBeTruthy();

    rerender(
      <TaskStatsCard
        level={1}
        xp={0}
        badgeCount={0}
        totalTasks={9}
        completedTasks={9}
      />
    );
    expect(getByText('Tasks: 9/9')).toBeTruthy();
  });

  test('row layout uses row/space-between/wrap', () => {
    const { toJSON } = render(
      <TaskStatsCard
        level={3}
        xp={15}
        badgeCount={1}
        totalTasks={3}
        completedTasks={1}
        theme={{}}
      />
    );

    const tree = toJSON();
    const rowView = findViewWithStyle(
      tree,
      (s) =>
        s.flexDirection === 'row' &&
        s.justifyContent === 'space-between' &&
        s.flexWrap === 'wrap'
    );
    expect(rowView).toBeTruthy();
  });
});
