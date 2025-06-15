import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Pressable,
    Alert,
    Clipboard,
    Image,
    Linking,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import formatTime from '../../utils/utils';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const MessageBubble = ({ senderId, message, theme, openThread }) => {
    const navigation = useNavigation();
    const isMe = message.sender?.id === senderId;
    const styles = createStyles(theme, isMe);
    const [actionVisible, setActionVisible] = useState(false);

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActionVisible(true);
    };

    const handleCopy = () => {
        Clipboard.setString(message.content || '');
        setActionVisible(false);
    };

    const handleReact = () => {
        Alert.alert('React', '❤️ reaction added (demo only)');
        setActionVisible(false);
    };

    const handleDelete = () => {
        Alert.alert('Delete', 'This would remove the message (UI only).');
        setActionVisible(false);
    };

    const handleReply = () => {
        openThread(message);
        setActionVisible(false);
    };

    // Handle map location link
    const handleOpenLocation = (location) => {
        const url = Platform.select({
            ios: `http://maps.apple.com/?ll=${location.latitude},${location.longitude}`,
            android: `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}`,
        });
        Linking.openURL(url);
    };

    // Handle Poll Voting
    const handlePollVote = (pollOption) => {
        Alert.alert('Poll Vote', `You voted for: ${pollOption}`);
        setActionVisible(false);
    };

    const extractQuizId = (text) => {
        const match = text.match(/\[quizId:(\d+)\]/);
        return match ? match[1] : null;
    };

    const handleTakeQuiz = (quizId) => {
        navigation.navigate('Quiz', { quizId: parseInt(quizId, 10) });
    };

    const renderMessageContent = () => {
        if (message.message_type === 'location') {
            let getLocation = JSON.parse(
                message.content.replace(/([a-zA-Z0-9_]+):/g, '"$1":')
            );

            console.log('message: ', typeof getLocation, getLocation);
            return (
                <TouchableOpacity
                    onPress={() => handleOpenLocation(getLocation)}
                >
                    <Image
                        // source={{
                        //     uri: `https://maps.googleapis.com/maps/api/staticmap?center=${getLocation.latitude},${getLocation.longitude}&zoom=14&size=400x400&markers=color:red%7C${getLocation.latitude},${getLocation.longitude}`,
                        // }}
                        source={require('../../assets/map.png')}
                        style={styles.locationImage}
                    />
                    <Text style={styles.messageText}>Tap to view on Map</Text>
                </TouchableOpacity>
            );
        }

        if (message.message_type === 'quiz') {
            const quizId = extractQuizId(message.content);
            return (
                <View>
                    <Text style={styles.messageText}>
                        {message.content.replace(/\[quizId:\d+\]/, '').trim()}
                    </Text>
                    {quizId && (
                        <TouchableOpacity
                            style={styles.quizButton}
                            onPress={() => handleTakeQuiz(quizId)}
                        >
                            <Text style={styles.quizButtonText}>Take Quiz</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }

        if (message.type === 'poll' && message.poll) {
            return (
                <View>
                    <Text style={styles.messageText}>
                        {message.poll.question}
                    </Text>
                    {message.poll.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handlePollVote(option)}
                            style={styles.pollOption}
                        >
                            <Text style={styles.pollOptionText}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }

        return (
            <Text style={styles.messageText}>
                {message.content || '[No content]'}
            </Text>
        );
    };

    return (
        <>
            <TouchableOpacity
                onLongPress={handleLongPress}
                activeOpacity={0.85}
            >
                <View style={styles.container}>
                    {!isMe && (
                        <Text style={styles.senderName}>
                            {message.sender?.name}
                        </Text>
                    )}
                    <View style={styles.bubble}>
                        {renderMessageContent()}
                        {message.reactions?.length > 0 && (
                            <View style={styles.reactionRow}>
                                {message.reactions.map((reaction, index) => (
                                    <Text
                                        key={index}
                                        style={styles.reactionEmoji}
                                    >
                                        {reaction.emoji}
                                    </Text>
                                ))}
                            </View>
                        )}
                        <Text style={styles.timestamp}>
                            {formatTime(message.timestamp)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            <Modal
                visible={actionVisible}
                transparent
                animationType='fade'
                onRequestClose={() => setActionVisible(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setActionVisible(false)}
                >
                    <View style={styles.modalActions}>
                        <Pressable
                            style={styles.modalItem}
                            onPress={handleReply}
                        >
                            <Feather
                                name='corner-up-left'
                                size={18}
                                color={theme.text}
                            />
                            <Text style={styles.modalText}>Reply</Text>
                        </Pressable>
                        <Pressable
                            style={styles.modalItem}
                            onPress={handleCopy}
                        >
                            <Feather name='copy' size={18} color={theme.text} />
                            <Text style={styles.modalText}>Copy</Text>
                        </Pressable>
                        <Pressable
                            style={styles.modalItem}
                            onPress={handleReact}
                        >
                            <Text style={[styles.modalText, { fontSize: 18 }]}>
                                ❤️
                            </Text>
                            <Text style={styles.modalText}>React</Text>
                        </Pressable>
                        {isMe && (
                            <Pressable
                                style={styles.modalItem}
                                onPress={handleDelete}
                            >
                                <Feather name='trash-2' size={18} color='red' />
                                <Text
                                    style={[styles.modalText, { color: 'red' }]}
                                >
                                    Delete
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </Pressable>
            </Modal>
        </>
    );
};

const createStyles = (theme, isMe) =>
    StyleSheet.create({
        container: {
            alignSelf: isMe ? 'flex-end' : 'flex-start',
            marginVertical: 6,
            maxWidth: '80%',
            paddingHorizontal: 10,
        },
        senderName: {
            fontSize: 12,
            color: theme.text,
            fontFamily: 'Poppins',
            marginBottom: 4,
            marginLeft: 4,
        },
        bubble: {
            backgroundColor: isMe ? theme.primary : theme.surface,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 20,
            borderTopLeftRadius: isMe ? 20 : 6,
            borderTopRightRadius: isMe ? 6 : 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
        },
        messageText: {
            fontSize: 15,
            fontFamily: 'Poppins',
            color: theme.text,
        },
        timestamp: {
            fontSize: 10,
            marginTop: 6,
            alignSelf: 'flex-end',
            fontFamily: 'Poppins',
            color: theme.mutedText || '#aaa',
        },
        locationImage: {
            width: '100%',
            height: 200,
            borderRadius: 8,
        },
        reactionRow: {
            flexDirection: 'row',
            marginTop: 6,
        },
        reactionEmoji: {
            fontSize: 16,
            marginRight: 6,
        },
        pollOption: {
            padding: 10,
            backgroundColor: theme.accent,
            borderRadius: 8,
            marginTop: 6,
        },
        pollOptionText: {
            color: theme.text,
            fontSize: 16,
            fontFamily: 'Poppins',
        },
        quizButton: {
            marginTop: 10,
            backgroundColor: theme.link,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
            alignSelf: 'flex-start',
        },
        quizButtonText: {
            color: '#fff',
            fontFamily: 'PoppinsBold',
            fontSize: 14,
        },
        modalBackdrop: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)',
        },
        modalActions: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 14,
            width: 240,
        },
        modalItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            gap: 10,
        },
        modalText: {
            fontFamily: 'Poppins',
            fontSize: 14,
            color: theme.text,
        },
    });

export default MessageBubble;
