import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { Feather } from '@expo/vector-icons';

const QuizPromptModal = ({ visible, onClose, onCreate, theme }) => {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('easy');

    const styles = createStyles(theme);

    const handleSubmit = () => {
        const trimmed = topic.trim();
        if (!trimmed) {
            Alert.alert('Missing Topic', 'Please enter a topic to continue.');
            return;
        }

        onCreate({ topic: trimmed, difficulty });
        setTopic('');
        setDifficulty('easy');
    };

    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            style={styles.modal}
        >
            <View style={styles.modalContent}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Feather name='x' size={20} color={theme.text} />
                </TouchableOpacity>

                <Text style={styles.title}>Create a Quiz</Text>

                <TextInput
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="What's the topic?"
                    placeholderTextColor={theme.placeholder}
                    style={styles.input}
                />

                <Text style={styles.label}>Select Difficulty</Text>
                <View style={styles.difficultyRow}>
                    {['easy', 'medium', 'hard'].map((level) => (
                        <TouchableOpacity
                            key={level}
                            style={[
                                styles.diffButton,
                                difficulty === level &&
                                    styles.diffButtonSelected,
                            ]}
                            onPress={() => setDifficulty(level)}
                        >
                            <Text
                                style={[
                                    styles.diffText,
                                    difficulty === level &&
                                        styles.diffTextSelected,
                                ]}
                            >
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleSubmit}
                >
                    <Text style={styles.createText}>Generate Quiz</Text>
                </TouchableOpacity>
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
        title: {
            fontSize: 18,
            fontFamily: 'PoppinsBold',
            color: theme.text,
            marginBottom: 16,
            textAlign: 'center',
        },
        input: {
            backgroundColor: theme.input,
            color: theme.inputText,
            fontFamily: 'Poppins',
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
        },
        label: {
            fontSize: 14,
            fontFamily: 'PoppinsBold',
            color: theme.text,
            marginBottom: 8,
        },
        difficultyRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
        },
        diffButton: {
            flex: 1,
            paddingVertical: 10,
            marginHorizontal: 4,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: 'center',
            backgroundColor: theme.input,
        },
        diffButtonSelected: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        diffText: {
            color: theme.text,
            fontFamily: 'Poppins',
            fontSize: 13,
        },
        diffTextSelected: {
            color: theme.buttonPrimaryText,
            fontFamily: 'PoppinsBold',
        },
        createButton: {
            backgroundColor: theme.link,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
        },
        createText: {
            color: '#fff',
            fontFamily: 'PoppinsBold',
            fontSize: 15,
        },
    });

export default QuizPromptModal;
