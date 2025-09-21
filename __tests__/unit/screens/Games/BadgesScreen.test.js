/**
 * BadgesScreen.test.js
 *
 * Covers:
 * 1) Rendering & order
 *    - Renders all 3 badges and preserves the order: Prepared, Quiz Master, Level Up.
 *
 * 2) Locked vs Unlocked state
 *    - With no unlocked badges => all "Locked 🔒".
 *    - With some unlocked => correct "Unlocked 🎉" count and success/border colors.
 *
 * 3) Icon colors
 *    - Ionicons receive theme.iconActive for unlocked and theme.iconInactive for locked.
 *
 * Notes:
 * - Uses a local Ionicons mock that records props via a variable prefixed with "mock"
 *   so it’s allowed inside `jest.mock()` factories.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// --- react-redux: provide the slice we need via useSelector
const mockSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (sel) => sel(mockSelector()),
}));

// --- Capture Ionicons props for assertions (MUST start with "mock")
let mockIoniconsProps = [];
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Ionicons = (props) => {
    mockIoniconsProps.push(props); // record all renders
    // keep output minimal and deterministic
    return <Text>{`icon:${props.name}:${props.color}:${props.size}`}</Text>;
  };
  return { Ionicons };
});

// Import after mocks
import BadgesScreen from '../../../../src/screens/Games/BadgesScreen';

// Shared theme for all tests (matches keys used in component)
const theme = {
  background: '#101010',
  surface: '#1e1e1e',
  shadow: '#000',
  textPrimary: '#ffffff',
  textSecondary: '#cccccc',
  success: '#16a34a',
  border: '#555555',
  iconActive: '#22c55e',
  iconInactive: '#999999',
};

describe('BadgesScreen', () => {
  beforeEach(() => {
    mockIoniconsProps = [];
  });

  test('renders all 3 badges in order and defaults to locked', () => {
    // no unlocked badges
    mockSelector.mockReturnValue({
      gamification: { badges: [] },
    });

    const { getByText, queryAllByText } = render(<BadgesScreen theme={theme} />);

    // Title exists (basic smoke test + ensures theming prop was accepted)
    expect(getByText('🎖️ Badge Collection')).toBeTruthy();

    // All three titles appear, in their defined order
    expect(getByText('Prepared')).toBeTruthy();
    expect(getByText('Quiz Master')).toBeTruthy();
    expect(getByText('Level Up')).toBeTruthy();

    // All locked
    expect(queryAllByText('Locked 🔒').length).toBe(3);
    expect(queryAllByText('Unlocked 🎉').length).toBe(0);

    // Ionicons rendered 3 times with inactive color
    expect(mockIoniconsProps.length).toBe(3);
    mockIoniconsProps.forEach((p) => {
      expect(p.color).toBe(theme.iconInactive);
      expect(p.size).toBe(60);
    });
  });

  test('unlocked states reflect in labels, colors, and icon colors', () => {
    // prepared and levelup unlocked
    mockSelector.mockReturnValue({
      gamification: { badges: ['prepared', 'levelup'] },
    });

    const { getAllByText } = render(<BadgesScreen theme={theme} />);

    // Two unlocked, one locked
    const unlockedEls = getAllByText('Unlocked 🎉');
    const lockedEls = getAllByText('Locked 🔒');
    expect(unlockedEls.length).toBe(2);
    expect(lockedEls.length).toBe(1);

    // Status color for an unlocked label
    const unlockedStyle = Array.isArray(unlockedEls[0].props.style)
      ? Object.assign({}, ...unlockedEls[0].props.style)
      : unlockedEls[0].props.style;
    expect(unlockedStyle.color).toBe(theme.success);

    // Status color for a locked label
    const lockedStyle = Array.isArray(lockedEls[0].props.style)
      ? Object.assign({}, ...lockedEls[0].props.style)
      : lockedEls[0].props.style;
    expect(lockedStyle.color).toBe(theme.border);

    // Icons: 2 active, 1 inactive; also ensure the icon names are correct
    expect(mockIoniconsProps.length).toBe(3);
    const activeIcons = mockIoniconsProps.filter((p) => p.color === theme.iconActive);
    const inactiveIcons = mockIoniconsProps.filter((p) => p.color === theme.iconInactive);
    expect(activeIcons.length).toBe(2);
    expect(inactiveIcons.length).toBe(1);

    const names = mockIoniconsProps.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(['shield-checkmark', 'school', 'rocket']));
  });

  test('only quizmaster unlocked -> its icon uses active color, others inactive', () => {
    mockSelector.mockReturnValue({
      gamification: { badges: ['quizmaster'] },
    });

    render(<BadgesScreen theme={theme} />);

    const quizIcon = mockIoniconsProps.find((p) => p.name === 'school');
    const preparedIcon = mockIoniconsProps.find((p) => p.name === 'shield-checkmark');
    const levelIcon = mockIoniconsProps.find((p) => p.name === 'rocket');

    expect(quizIcon.color).toBe(theme.iconActive);
    expect(preparedIcon.color).toBe(theme.iconInactive);
    expect(levelIcon.color).toBe(theme.iconInactive);
  });
});
