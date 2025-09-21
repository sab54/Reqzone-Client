import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import QuizPromptModal from 'src/modals/QuizPromptModal';  // Adjust path as needed

const baseTheme = {
  surface: '#fff',
  text: '#000',
  input: '#f7f7f7',
  buttonPrimaryBackground: '#007bff',  // Background color for selected button
  buttonPrimaryText: '#fff',
  currentUserId: 'user123',
  currentChatId: 'chat456',
};

const setup = (props = {}) => {
  const onClose = jest.fn();
  const onCreate = jest.fn();

  const utils = render(
    <QuizPromptModal
      visible
      onClose={onClose}
      onCreate={onCreate}
      theme={baseTheme}
      {...props}
    />
  );

  return { ...utils, onClose, onCreate };
};

describe('QuizPromptModal', () => {
  it('calls onCreate when the "Generate Quiz" button is pressed', () => {
    const { getByText, onCreate } = setup({ visible: true });

    // Simulate entering topic
    fireEvent.changeText(getByText("What's the topic?"), 'Science');

    // Simulate clicking the "Generate Quiz" button
    fireEvent.press(getByText('Generate Quiz'));

    // Verify that onCreate was called with the expected data
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith({
      topic: 'Science',
      difficulty: 'easy',
      createdBy: baseTheme.currentUserId,
      chatId: baseTheme.currentChatId,
    });
  });
});
