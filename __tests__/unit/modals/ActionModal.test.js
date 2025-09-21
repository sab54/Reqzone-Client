// __tests__/unit/modals/ActionModal.test.js

/**
 * ActionModal.test.js
 *
 * What This Test File Covers:
 *
 * 1. Visibility
 *    - Renders content when visible=true and hides content when visible=false.
 *
 * 2. Basic Rendering
 *    - Shows title and provided option labels/emojis.
 *
 * 3. Close Button
 *    - Tapping the close button triggers onClose.
 *
 * 4. Option Selection
 *    - Tapping an option calls onSelect with its action and then calls onClose.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ActionModal from 'src/modals/ActionModal';

const baseTheme = {
  surface: '#ffffff',
  text: '#111111',
  input: '#f2f2f2',
};

const sampleOptions = [
  { emoji: '📝', label: 'Note', action: 'note' },
  { emoji: '📷', label: 'Photo', action: 'photo' },
];

const setup = (props = {}) => {
  const onClose = jest.fn();
  const onSelect = jest.fn();
  const onModalHide = jest.fn();

  const utils = render(
    <ActionModal
      visible
      onClose={onClose}
      onSelect={onSelect}
      theme={baseTheme}
      options={sampleOptions}
      onModalHide={onModalHide}
      {...props}
    />
  );

  return { ...utils, onClose, onSelect, onModalHide };
};

describe('ActionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible=true and shows title and options', () => {
    const { getByText } = setup({ visible: true });

    // Title indicates modal content is visible
    expect(getByText('Choose an Option')).toBeTruthy();

    // Option labels and emojis
    expect(getByText('Note')).toBeTruthy();
    expect(getByText('📝')).toBeTruthy();
    expect(getByText('Photo')).toBeTruthy();
    expect(getByText('📷')).toBeTruthy();
  });

  it('does not render content when visible=false', () => {
    const { queryByText } = setup({ visible: false });

    // When hidden, the modal content (title) should not be present
    expect(queryByText('Choose an Option')).toBeNull();
  });

  it('pressing the close button calls onClose', () => {
    const { getByText, onClose } = setup({ visible: true });

    // Feather icon mock renders text like "feather:x"
    const closeIcon = getByText('feather:x');
    fireEvent.press(closeIcon);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pressing an option calls onSelect with action and then onClose', () => {
    const { getByText, onSelect, onClose } = setup({ visible: true });

    // Tap the "Photo" option
    fireEvent.press(getByText('Photo'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('photo');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
