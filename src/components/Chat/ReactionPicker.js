/**
 * ReactionPicker.js
 *
 * A modal component for selecting emoji reactions in chats.
 *
 * Key functionalities:
 * - **Emoji List**: Displays available reactions from `reactions.json`.
 * - **Selection Handling**: Calls `onSelect(emoji)` when a reaction is tapped.
 * - **Close Behavior**: Tapping the backdrop calls `onClose` to dismiss the picker.
 * - **Theming**: Uses theme colors for overlay and container styling.
 *
 * Component Flow:
 * 1. When `visible` is true, shows a centered modal with reaction emojis.
 * 2. Each emoji is touchable; pressing it calls the `onSelect` handler.
 * 3. Pressing outside (overlay) calls the `onClose` handler.
 *
 * Notes:
 * - Styling adapts based on the provided `theme` object (`overlay`, `surface`).
 * - Reactions are loaded from a JSON file to ensure consistency across app usage.
 *
 * Author: Sunidhi Abhange
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import reactions from '../assets/reactions.json';

const ReactionPicker = ({ visible, onSelect, onClose, theme }) => {
    const styles = createStyles(theme);

    return (
        <Modal transparent visible={visible} animationType='fade'>
            <TouchableOpacity style={styles.overlay} onPress={onClose}>
                <View style={styles.pickerContainer}>
                    {reactions.map((emoji, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => onSelect(emoji)}
                        >
                            <Text style={styles.emoji}>{emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const createStyles = (theme) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: theme.overlay,
            justifyContent: 'center',
            alignItems: 'center',
        },
        pickerContainer: {
            flexDirection: 'row',
            backgroundColor: theme.surface,
            padding: 16,
            borderRadius: 30,
            elevation: 8,
        },
        emoji: {
            fontSize: 28,
            marginHorizontal: 10,
        },
    });

export default ReactionPicker;
