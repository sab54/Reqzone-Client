/**
 * Client/src/components/__tests__/DueTag.test.js
 *
 * What This Test File Covers:
 *
 * 1. Overdue
 *    - Renders "📅 Overdue" when dueDate < now, color = theme.error.
 *
 * 2. Due Today (strict equality)
 *    - Per component logic, "Due Today" shows when Math.ceil(diffDays) === 0,
 *      which happens only if dueDate == now (same millisecond). We set the
 *      system clock and pass the exact same timestamp to match this logic.
 *      Color = theme.warning.
 *
 * 3. Future
 *    - Renders "📅 Due in Xd" with correct day count when dueDate > now,
 *      color = theme.text. We use a 36-hour future (=> ceil(1.5) = 2).
 *
 * Notes:
 * - Uses modern fake timers + jest.setSystemTime so that `new Date()` inside
 *   the component reflects our fixed "now". This is necessary because the
 *   component calls `new Date()` directly (not `Date.now()`).
 *
 * Author: Sunidhi Abhange
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import DueTag from 'src/components/DueTag';

const theme = {
  error: 'red',
  warning: 'orange',
  text: 'black',
};

describe('DueTag', () => {
  const fixedNow = new Date('2024-01-10T12:00:00.000Z');

  beforeAll(() => {
    // Make new Date() inside the component return fixedNow
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('shows Overdue when dueDate is before now', () => {
    const { getByText } = render(
      <DueTag dueDate="2024-01-08T00:00:00.000Z" theme={theme} />
    );
    const node = getByText('📅 Overdue');
    expect(node).toBeTruthy();
    // Style is an array: [styles.text, { color: theme.error }]
    expect(node.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: theme.error })])
    );
  });

  it('shows Due Today only when dueDate equals now (strict 0 days left)', () => {
    const { getByText } = render(
      <DueTag dueDate={fixedNow.toISOString()} theme={theme} />
    );
    const node = getByText('📅 Due Today');
    expect(node).toBeTruthy();
    expect(node.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: theme.warning })])
    );
  });

  it('shows "Due in 2d" for a due date 36 hours in the future', () => {
    const future36h = new Date(fixedNow.getTime() + 36 * 60 * 60 * 1000); // +36h
    const { getByText } = render(
      <DueTag dueDate={future36h.toISOString()} theme={theme} />
    );
    const node = getByText('📅 Due in 2d'); // ceil(1.5) => 2
    expect(node).toBeTruthy();
    expect(node.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: theme.text })])
    );
  });
});
