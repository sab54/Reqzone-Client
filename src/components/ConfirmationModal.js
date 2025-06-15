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
