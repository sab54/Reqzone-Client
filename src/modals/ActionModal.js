import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { Feather } from '@expo/vector-icons';

const ActionModal = ({
    visible,
    onClose,
    onSelect,
    theme,
    options,
    loadingMessage = 'Loading...',
    onModalHide,
}) => {
    const [loading, setLoading] = useState(false);
    const styles = createStyles(theme);

    const handleSelect = (action) => {
        onSelect(action);
        onClose();
    };

    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            onModalHide={onModalHide}
            style={styles.modal}
            backdropTransitionOutTiming={0}
        >
            <View style={styles.modalContent}>
                {/* Close Button */}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Feather name='x' size={20} color={theme.text} />
                </TouchableOpacity>

                {/* Modal Title */}
                <Text style={styles.modalTitle}>Choose an Option</Text>

                {/* Loading or Options */}
                {loading ? (
                    <Text style={styles.loadingText}>{loadingMessage}</Text>
                ) : (
                    <View style={styles.grid}>
                        {options.map(({ emoji, label, action }) => (
                            <TouchableOpacity
                                key={label}
                                style={styles.gridItem}
                                onPress={() => handleSelect(action)}
                            >
                                <Text style={styles.gridEmoji}>{emoji}</Text>
                                <Text style={styles.gridLabel}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </Modal>
    );
};

const createStyles = (theme) =>
    StyleSheet.create({
        modal: {
            justifyContent: 'flex-end',
            margin: 0,
        },
        modalContent: {
            backgroundColor: theme.surface,
            padding: 20,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            position: 'relative',
        },
        closeButton: {
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1,
        },
        modalTitle: {
            fontSize: 16,
            fontFamily: 'Poppins',
            marginBottom: 20,
            color: theme.text,
            textAlign: 'center',
        },
        loadingText: {
            fontSize: 14,
            color: theme.text,
            textAlign: 'center',
            marginBottom: 20,
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
        },
        gridItem: {
            width: '47%',
            backgroundColor: theme.input,
            borderRadius: 12,
            paddingVertical: 20,
            alignItems: 'center',
            marginBottom: 16,
        },
        gridEmoji: {
            fontSize: 26,
            marginBottom: 6,
        },
        gridLabel: {
            fontSize: 14,
            fontFamily: 'Poppins',
            color: theme.text,
        },
    });

export default ActionModal;
