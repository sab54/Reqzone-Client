// /src/modals/ThreadModal.js

import React, { useState, useContext } from 'react';
import {
    Modal,
    View,
    FlatList,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ChatContext } from '../context/ChatContext';
import formatTime from '../utils/utils';

const ThreadModal = ({ visible, onClose, message, chatId, theme }) => {
    const { addReply } = useContext(ChatContext);
    const [replyText, setReplyText] = useState('');

    const styles = createStyles(theme);

    const handleReply = () => {
        if (!replyText.trim()) return;
        addReply(chatId, message.id, replyText);
        setReplyText('');
    };

    if (!message) return null;

    return (
        <Modal visible={visible} animationType='slide'>
            <View style={styles.container}>
                {/* Original Message */}
                <View style={styles.originalMessage}>
                    <Text style={styles.originalText}>{message.text}</Text>
                    <Text style={styles.timestamp}>
                        {formatTime(message.timestamp)}
                    </Text>
                </View>

                {/* Replies */}
                <FlatList
                    data={message.replies}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.replyItem}>
                            <Text style={styles.replyText}>{item.text}</Text>
                            <Text style={styles.timestamp}>
                                {formatTime(item.timestamp)}
                            </Text>
                        </View>
                    )}
                    contentContainerStyle={styles.repliesContainer}
                />

                {/* Reply input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        value={replyText}
                        onChangeText={setReplyText}
                        placeholder='Write a reply...'
                        placeholderTextColor={theme.placeholder}
                        style={styles.input}
                        onSubmitEditing={handleReply}
                    />
                    <TouchableOpacity
                        onPress={handleReply}
                        style={styles.sendButton}
                    >
                        <Feather name='send' size={20} color='#ffffff' />
                    </TouchableOpacity>
                </View>

                {/* Close */}
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={[styles.closeText, { color: theme.link }]}>
                        Close
                    </Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const createStyles = (theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        originalMessage: {
            backgroundColor: theme.surface,
            padding: 16,
            margin: 16,
            borderRadius: 12,
        },
        originalText: {
            fontSize: 16,
            fontFamily: 'Poppins',
            color: theme.text,
        },
        timestamp: {
            fontSize: 10,
            marginTop: 6,
            fontFamily: 'Poppins',
            color: theme.mutedText,
        },
        repliesContainer: {
            paddingHorizontal: 16,
            paddingTop: 10,
        },
        replyItem: {
            backgroundColor: theme.surface,
            padding: 12,
            marginBottom: 10,
            borderRadius: 10,
        },
        replyText: {
            fontFamily: 'Poppins',
            color: theme.text,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: theme.divider,
        },
        input: {
            flex: 1,
            backgroundColor: theme.input,
            borderRadius: 20,
            paddingHorizontal: 16,
            fontFamily: 'Poppins',
            color: theme.inputText,
        },
        sendButton: {
            backgroundColor: theme.link,
            padding: 12,
            borderRadius: 20,
            marginLeft: 10,
        },
        closeButton: {
            alignItems: 'center',
            marginVertical: 16,
        },
        closeText: {
            fontFamily: 'Poppins',
            fontSize: 16,
        },
    });

export default ThreadModal;
