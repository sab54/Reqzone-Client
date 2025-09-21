// __tests__/unit/modals/GroupInfoModal.test.js

/**
 * GroupInfoModal.test.js
 *
 * What This Test File Covers:
 *
 * 1. Basic Rendering
 *    - Renders header/subheader and member list for a group chat.
 *
 * 2. Add People CTA (Owner Only)
 *    - Shows "➕ Add People" when current user is the owner, and navigates on press.
 *
 * 3. Remove Member Flow
 *    - Owner sees "Remove" for non-self, non-admin members; pressing it opens confirm and dispatches action.
 *
 * 4. One-to-one Chat
 *    - Shows "User Info" header and has no "➕ Add People" button.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import GroupInfoModal from 'src/modals/GroupInfoModal';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { removeUserFromGroup } from 'src/store/actions/chatActions';

// ---- Mocks ----

// react-redux
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  const unwrap = jest.fn().mockResolvedValue({});
  const dispatch = jest.fn(() => ({ unwrap }));
  dispatch.unwrap = unwrap;
  return {
    ...actual,
    useSelector: jest.fn(),
    useDispatch: jest.fn(() => dispatch),
  };
});

// navigation
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

// chat actions
jest.mock('../../../src/store/actions/chatActions', () => ({
  removeUserFromGroup: jest.fn((payload) => ({ type: 'REMOVE_USER_FROM_GROUP', payload })),
}));

// ConfirmationModal -> simple stub with Confirm and Cancel buttons
jest.mock('../../../src/components/ConfirmationModal', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return ({ visible, onClose, onConfirm, title }) =>
    visible ? (
      <View accessibilityLabel="ConfirmationModal">
        <Text>{title}</Text>
        <TouchableOpacity onPress={onConfirm}>
          <Text>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text>Cancel</Text>
        </TouchableOpacity>
      </View>
    ) : null;
});

// ---- Test Data / Helpers ----

const theme = {
  surface: '#fff',
  text: '#111',
  input: '#f7f7f7',
  title: '#000',
  mutedText: '#666',
  accent: '#eef',
  badgeText: '#123',
  link: '#0a84ff',
};

const ownerId = 'u1';
const chatId = 'chat-123';

const groupChat = {
  is_group: true,
  created_by: ownerId,
  chat_id: chatId,
  members: [
    { id: ownerId, name: 'Owner User', role: 'owner', email: 'owner@example.com' },
    { id: 'u2', name: 'Bob', role: 'member', email: 'bob@example.com' },
    { id: 'u3', name: 'Admin', role: 'admin', email: 'admin@example.com' },
  ],
};

const oneToOneChat = {
  is_group: false,
  created_by: ownerId,
  chat_id: chatId,
  members: [{ id: ownerId, name: 'Owner User', role: 'owner' }, { id: 'u9', name: 'Jane', role: 'member' }],
};

const setupRedux = (userId = ownerId) => {
  useSelector.mockImplementation((sel) =>
    sel({ auth: { user: { id: userId } } })
  );
};

const setupNav = () => {
  const navigate = jest.fn();
  useNavigation.mockReturnValue({ navigate });
  return { navigate };
};

const renderModal = (props = {}) =>
  render(
    <GroupInfoModal
      visible
      onClose={jest.fn()}
      chat={groupChat}
      theme={theme}
      {...props}
    />
  );

describe('GroupInfoModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupRedux();
  });

  it('renders group header, member count and member items', () => {
    const { getByText } = renderModal();

    expect(getByText('Group Members')).toBeTruthy();
    // 3 members in the sample chat
    expect(getByText('3 members')).toBeTruthy();

    // Member names
    expect(getByText('Owner User')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
    expect(getByText('Admin')).toBeTruthy();

    // Badges for current user and admin (👑 Admin text is in a badge string)
    expect(getByText('You')).toBeTruthy();
    expect(getByText('👑 Admin')).toBeTruthy();
  });

  it('shows "➕ Add People" for owner and navigates on press', () => {
    const { navigate } = setupNav();
    const onClose = jest.fn();

    const { getByText } = render(
      <GroupInfoModal
        visible
        onClose={onClose}
        chat={groupChat}
        theme={theme}
      />
    );

    const addBtn = getByText('➕ Add People');
    expect(addBtn).toBeTruthy();

    fireEvent.press(addBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('AddPeopleScreen', {
      mode: 'addToGroup',
      chatId,
      existingMembers: groupChat.members.map((m) => m.id),
    });
  });

  it('owner can remove a non-self, non-admin member: opens confirm and dispatches action', async () => {
    setupNav(); // navigation not used here but keep consistent
    const dispatch = useDispatch(); // mocked dispatch
    const { getByText, queryByText } = renderModal();

    // Remove button should be present for Bob (member), not for Admin or self
    const removeBob = getByText('Remove');
    expect(removeBob).toBeTruthy();

    // Press "Remove" -> confirmation modal appears
    fireEvent.press(removeBob);
    expect(getByText('Remove')).toBeTruthy();
    //expect(queryByText('Cancel')).toBeTruthy();

    // Confirm removal -> dispatch called with payload
    await act(async () => {
      fireEvent.press(getByText('Remove'));
    });

    expect(removeUserFromGroup).toHaveBeenCalledWith({
      chatId,
      userId: 'u9',
    });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'REMOVE_USER_FROM_GROUP',
        payload: { chatId, userId: 'u2' },
      })
    );
  });

  it('for a one-to-one chat, shows "User Info" and hides "➕ Add People"', () => {
    setupNav();
    const { queryByText, getByText } = render(
      <GroupInfoModal
        visible
        onClose={jest.fn()}
        chat={oneToOneChat}
        theme={theme}
      />
    );

    expect(getByText('User Info')).toBeTruthy();
    expect(queryByText('➕ Add People')).toBeNull();
  });
});
