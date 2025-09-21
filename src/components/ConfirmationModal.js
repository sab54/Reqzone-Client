// components/ConfirmationModal.js
/**
 * ConfirmationModal.js
 *
 * A theme-aware confirmation modal for React Native apps.
 * Renders an overlayed dialog with title, optional description/children,
 * and one or two action buttons. The overlay tap (outside card) and the
 * optional "Cancel" button both dismiss via `onClose`; the primary action
 * invokes `onConfirm`.
 *
 * Key functionalities:
 * - **Visibility Control**: Uses React Native's `Modal` with `visible` prop.
 * - **Dismissal**: Overlay press or Cancel button calls `onClose`.
 * - **Primary Action**: Confirm button calls `onConfirm`.
 * - **Custom Content**: Optional `description`, `children`, and `Ionicons` icon.
 * - **Theming**: Colors and styles come from the provided `theme` object.
 * - **Single vs. Dual Buttons**: Controlled by `multipleButtons` prop.
 *
 * Props:
 * - visible: boolean — controls modal visibility.
 * - onClose: function — called when modal should close.
 * - onConfirm: function — called when confirm action is taken.
 * - title?: string — modal title (default: "Are you sure?").
 * - description?: string — optional description text.
 * - confirmLabel?: string — confirm button label (default: "Confirm").
 * - cancelLabel?: string — cancel button label (default: "Cancel").
 * - multipleButtons?: boolean — show Cancel button when true (default: true).
 * - children?: ReactNode — optional custom content inside the modal.
 * - theme: object — contains overlay/surface/text/button colors.
 * - icon?: string — Ionicons name for optional header icon.
 *
 * Author: Sunidhi Abhange
 */

import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ConfirmationModal = ({
    visible,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    description = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    multipleButtons = true,
    children,
    theme,
    icon,
}) => {
    return (
        <Modal
            visible={visible}
            animationType='fade'
            transparent
            onRequestClose={onClose}
        >
            <Pressable
                style={[styles.overlay, { backgroundColor: theme.overlay }]}
                onPress={onClose}
            >
                <Pressable
                    style={[
                        styles.modalContainer,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            shadowColor: theme.shadow,
                        },
                    ]}
                    onPress={() => {}}
                >
                    <ScrollView
                        contentContainerStyle={{ alignItems: 'center' }}
                        showsVerticalScrollIndicator={false}
                    >
                        {icon && (
                            <Ionicons
                                name={icon}
                                size={32}
                                color={theme.error}
                                style={{ marginBottom: 12 }}
                            />
                        )}

                        <Text style={[styles.title, { color: theme.title }]}>
                            {title}
                        </Text>

                        {description !== '' && (
                            <Text
                                style={[
                                    styles.description,
                                    { color: theme.text },
                                ]}
                            >
                                {description}
                            </Text>
                        )}

                        {children && (
                            <View style={styles.childWrapper}>{children}</View>
                        )}
                    </ScrollView>

                    <View
                        style={[
                            styles.buttonRow,
                            {
                                justifyContent: multipleButtons
                                    ? 'space-between'
                                    : 'center',
                            },
                        ]}
                    >
                        {multipleButtons && (
                            <TouchableOpacity
                                onPress={onClose}
                                style={[
                                    styles.button,
                                    {
                                        backgroundColor:
                                            theme.buttonDisabledBackground,
                                    },
                                ]}
                            >
                                <Text
                                    style={{ color: theme.buttonDisabledText }}
                                >
                                    {cancelLabel}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={onConfirm}
                            style={[
                                styles.button,
                                {
                                    backgroundColor:
                                        theme.buttonSecondaryBackground,
                                },
                            ]}
                        >
                            <Text style={{ color: theme.buttonSecondaryText }}>
                                {confirmLabel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        maxHeight: '80%',
        padding: 20,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        elevation: 4,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Poppins',
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        fontFamily: 'Poppins',
        textAlign: 'center',
        marginBottom: 16,
    },
    childWrapper: {
        width: '100%',
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
});

export default ConfirmationModal;
