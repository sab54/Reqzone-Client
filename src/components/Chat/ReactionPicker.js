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
