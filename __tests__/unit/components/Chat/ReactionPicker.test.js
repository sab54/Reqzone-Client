/**
 * __tests__/unit/components/Chat/ReactionPicker.test.js
 *
 * What This Test File Covers:
 *
 * 1. Visibility Control
 *    - Shows modal with emojis when `visible=true`.
 *    - Does not render when `visible=false`.
 *
 * 2. Reaction Selection
 *    - Pressing an emoji calls `onSelect` with the correct emoji.
 *
 * 3. Styling Awareness (non-blocking)
 *    - Verifies overlay uses `theme.overlay` color.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// --- IMPORTANT: Virtually mock the path that ReactionPicker imports ---
// From src/components/Chat/ReactionPicker.js, "../assets/reactions.json"
// resolves to: src/components/assets/reactions.json
const MOCK_REACTIONS = ['👍', '❤️', '😂', '👏', '🔥'];
jest.doMock(
  '../../../../src/components/assets/reactions.json',
  () => MOCK_REACTIONS,
  { virtual: true }
);

// Import AFTER the mock above so it takes effect:
const ReactionPicker = require('../../../../src/components/Chat/ReactionPicker').default;

const theme = {
  overlay: 'rgba(0,0,0,0.5)',
  surface: '#fff',
};

describe('ReactionPicker', () => {
  test('renders emojis when visible', () => {
    const { getByText } = render(
      <ReactionPicker visible={true} onSelect={jest.fn()} onClose={jest.fn()} theme={theme} />
    );

    expect(getByText(MOCK_REACTIONS[0])).toBeTruthy();
    expect(getByText(MOCK_REACTIONS[MOCK_REACTIONS.length - 1])).toBeTruthy();
  });

  test('does not render when not visible', () => {
    const { queryByText } = render(
      <ReactionPicker visible={false} onSelect={jest.fn()} onClose={jest.fn()} theme={theme} />
    );

    expect(queryByText(MOCK_REACTIONS[0])).toBeNull();
  });

  test('calls onSelect when emoji pressed', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <ReactionPicker visible={true} onSelect={onSelect} onClose={jest.fn()} theme={theme} />
    );

    fireEvent.press(getByText(MOCK_REACTIONS[0]));
    expect(onSelect).toHaveBeenCalledWith(MOCK_REACTIONS[0]);
  });

 // eslint-disable-next-line jest/no-disabled-tests
test('pressing overlay triggers onClose', () => {
  const onClose = jest.fn();

  const { UNSAFE_getAllByType } = render(
    <ReactionPicker visible={true} onSelect={jest.fn()} onClose={onClose} theme={theme} />
  );

  // Import the platform TouchableOpacity type so we can query by component
  const { TouchableOpacity } = require('react-native');

  const touchables = UNSAFE_getAllByType(TouchableOpacity);

  // Helper to check for the overlay background color
  const hasOverlayBg = (styles) => {
    const flat = Array.isArray(styles) ? styles.flat() : [styles];
    return flat.some((s) => s && s.backgroundColor === theme.overlay);
  };

  // The overlay is the TouchableOpacity with the overlay background
  const overlayTouchable = touchables.find((node) => hasOverlayBg(node.props.style));
  expect(overlayTouchable).toBeTruthy();

  fireEvent.press(overlayTouchable);
  expect(onClose).toHaveBeenCalledTimes(1);
});
});
