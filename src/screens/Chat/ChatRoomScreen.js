import React, {
    useEffect,
    useRef,
    useState,
    useMemo,
    useCallback,
} from 'react';
import {
    View,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Text,
    ActivityIndicator,
    SafeAreaView,
    Keyboard,
    TouchableWithoutFeedback,
    Image,
    Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import {
    selectTypingUsersByChatId,
    selectMessagesByChatId,
} from '../../store/selectors/chatSelectors';

import MessageBubble from '../../components/Chat/MessageBubble';
import TypingIndicator from '../../components/Chat/TypingIndicator';
import ThreadModal from '../../modals/ThreadModal';
import GroupInfoModal from '../../modals/GroupInfoModal';
import ActionModal from '../../modals/ActionModal';
import QuizPromptModal from '../../modals/QuizPromptModal';

import { generateQuizAI } from '../../store/actions/quizActions';
import {
    sendMessage,
    fetchMessages,
    markChatAsReadThunk,
    queuePendingMessage,
    flushQueuedMessages,
    fetchChatById, // ✅ NEW
} from '../../store/actions/chatActions';
import {
    appendMessage,
    setTypingUser,
    removeTypingUser,
} from '../../store/reducers/chatReducer';
import {
    getSocket,
    onEvent,
    offEvent,
    joinChat,
    leaveChat,
    emitEvent,
} from '../../utils/socket';
import { getUserLocation } from '../../utils/utils';

const ChatRoomScreen = () => {
    const insets = useSafeAreaInsets();
    const keyboardOffset = Platform.OS === 'ios' ? insets.top : 0;

    const { themeColors } = useSelector((state) => state.theme);
    const { params } = useRoute();
    const navigation = useNavigation();
    const { chatId } = params;

    const dispatch = useDispatch();
    const inputRef = useRef(null);
    const flatListRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const [inputMessage, setInputMessage] = useState('');
    const [threadMessage, setThreadMessage] = useState(null);
    const [groupInfoVisible, setGroupInfoVisible] = useState(false);
    const [isConnected, setIsConnected] = useState(true);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [location, setLocation] = useState(null);
    const [quizPromptVisible, setQuizPromptVisible] = useState(false);

    const chat = useSelector((state) =>
        state.chat.activeChats.find(
            (c) => c.id === chatId || c.chat_id === chatId
        )
    );

    const messages = useSelector(selectMessagesByChatId(chatId));
    const lastReadMessageId = useSelector(
        (state) => state.chat.lastReadByChatId[chatId]
    );
    const senderId = useSelector((state) => state.auth.user?.id);
    const typingUsers = useSelector(selectTypingUsersByChatId(chatId));
    const loadingMessages = useSelector((state) => state.chat.loading);

    const styles = useMemo(
        () => createStyles(themeColors, insets),
        [themeColors, insets]
    );

    const { subtitle, avatarUri, initials } = useMemo(() => {
        if (!chat) return {};

        if (chat.is_group) {
            const members = chat.members || [];
            return {
                subtitle: `${members.length} member${
                    members.length !== 1 ? 's' : ''
                }`,
            };
        } else {
            const otherUser = chat.members?.find((u) => u.id !== senderId);
            const name = otherUser?.name || otherUser?.email || 'Direct Chat';
            const initials = name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
            return {
                subtitle: 'Direct Chat',
                avatarUri: otherUser?.avatar || null,
                initials,
            };
        }
    }, [chat, senderId]);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(state.isConnected);
            if (state.isConnected) {
                dispatch(flushQueuedMessages(chatId));
            }
        });
        return () => unsubscribe();
    }, [chatId, dispatch]);

    useEffect(() => {
        if (!messages.length) {
            dispatch(fetchMessages(chatId));
        }

        inputRef.current?.focus();
        const showSub = Keyboard.addListener('keyboardDidShow', scrollToBottom);
        return () => showSub.remove?.();
    }, [chatId, dispatch]);

    // ✅ Auto refresh chat (members etc.) when opening or groupInfo changes
    useEffect(() => {
        if (chatId) {
            dispatch(fetchChatById(chatId));
        }
    }, [chatId, groupInfoVisible, dispatch]);

    useEffect(() => {
        if (!chatId) return;

        const socket = getSocket();
        const onConnect = () => joinChat(chatId);

        if (socket?.connected) {
            joinChat(chatId);
        } else {
            socket?.on('connect', onConnect);
        }

        const handleNewMessage = (newMessage) => {
            if (newMessage.chat_id !== chatId) return;
            dispatch(appendMessage({ chatId, message: newMessage }));
            scrollToBottom();
        };

        const handleTypingStart = ({ chatId: cid, userId }) => {
            if (cid !== chatId || userId === senderId) return;
            const user = (chat?.members || chat?.participants || []).find(
                (u) => u.id === userId
            );
            if (user) dispatch(setTypingUser({ chatId, user }));
        };

        const handleTypingStop = ({ chatId: cid, userId }) => {
            if (cid !== chatId || userId === senderId) return;
            dispatch(removeTypingUser({ chatId, userId }));
        };

        onEvent('chat:new_message', handleNewMessage);
        onEvent('chat:typing_start', handleTypingStart);
        onEvent('chat:typing_stop', handleTypingStop);

        return () => {
            offEvent('chat:new_message');
            offEvent('chat:typing_start');
            offEvent('chat:typing_stop');
            socket?.off?.('connect', onConnect);
            leaveChat(chatId);
        };
    }, [chatId, senderId, chat, dispatch]);

    useEffect(() => {
        if (actionModalVisible) {
            getUserLocation()
                .then((location) => setLocation(location))
                .catch(() => {
                    Alert.alert('Error', 'Unable to fetch location');
                });
        }
    }, [actionModalVisible]);

    const scrollToBottom = () => {
        setTimeout(() => {
            flatListRef.current?.scrollToOffset?.({
                offset: 0,
                animated: true,
            });
        }, 100);
    };

    const handleTyping = (text) => {
        setInputMessage(text);
        if (!isTyping) {
            setIsTyping(true);
            emitEvent('chat:typing_start', { chatId, userId: senderId });
        }
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            emitEvent('chat:typing_stop', { chatId, userId: senderId });
        }, 1500);
    };

    const handleSend = useCallback(() => {
        const trimmed = inputMessage.trim();
        if (!trimmed || !senderId) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        emitEvent('chat:typing_stop', { chatId, userId: senderId });
        setIsTyping(false);

        if (isConnected) {
            dispatch(sendMessage({ chatId, senderId, message: trimmed }));
        } else {
            dispatch(
                queuePendingMessage({ chatId, senderId, message: trimmed })
            );
        }

        setInputMessage('');
        scrollToBottom();
    }, [chatId, senderId, inputMessage, isConnected, dispatch]);

    const handlePreparedMessage = async ({ messageText, messageType }) => {
        setActionModalVisible(false);

        if (!senderId || !chatId) return;

        if (messageType === 'quiz') {
            setQuizPromptVisible(true);
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        emitEvent('chat:typing_stop', { chatId, userId: senderId });

        const message = {
            message: messageText,
            message_type: messageType,
            senderId,
            chatId,
        };

        dispatch(sendMessage(message));
        scrollToBottom();
    };

    const handleCreateQuiz = async ({ topic, difficulty }) => {
        setQuizPromptVisible(false);
        if (!topic || !chatId || !senderId) return;

        try {
            const quiz = await dispatch(
                generateQuizAI({
                    topic,
                    difficulty,
                    createdBy: senderId,
                    chatId,
                })
            ).unwrap();

            const quizMessage = {
                chatId,
                senderId,
                message: `🧠 A new quiz on "${topic}" is ready! [quizId:${quiz.id}]`,
                message_type: 'quiz',
                metadata: { quizId: quiz.id },
            };

            dispatch(sendMessage(quizMessage));
        } catch (err) {
            Alert.alert('Error', 'Failed to generate quiz.');
        }
    };

    const handleScroll = (event) => {
        const atBottom = event.nativeEvent.contentOffset.y <= 10;
        setIsAtBottom(atBottom);
    };

    useEffect(() => {
        if (isAtBottom && messages.length > 0) {
            dispatch(markChatAsReadThunk(chatId, messages[0].id));
        }
    }, [isAtBottom, messages, chatId, dispatch]);

    const renderItem = ({ item }) => {
        const showUnreadSeparator =
            lastReadMessageId && item.id === lastReadMessageId;

        return (
            <>
                {showUnreadSeparator && (
                    <View style={styles.unreadSeparator}>
                        <Text style={styles.unreadText}>Unread messages</Text>
                    </View>
                )}
                <MessageBubble
                    message={item}
                    theme={themeColors}
                    senderId={senderId}
                    openThread={() => setThreadMessage(item)}
                />
            </>
        );
    };

    const typingNames = typingUsers.map((u) => u.name || u.email || 'Someone');

    if (!chat) {
        return (
            <View style={styles.centered}>
                <Text style={[styles.errorText, { color: themeColors.error }]}>
                    Chat not found.
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={keyboardOffset}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity
                                onPress={() =>
                                    navigation.reset({
                                        index: 0,
                                        routes: [
                                            {
                                                name: 'MainTabs',
                                                params: { screen: 'Chat' },
                                            },
                                        ],
                                    })
                                }
                            >
                                <Ionicons
                                    name='arrow-back-outline'
                                    size={24}
                                    color={themeColors.link}
                                />
                            </TouchableOpacity>

                            {avatarUri || initials ? (
                                <View style={styles.headerAvatarWrapper}>
                                    {avatarUri ? (
                                        <Image
                                            source={{ uri: avatarUri }}
                                            style={styles.avatar}
                                        />
                                    ) : (
                                        <View style={styles.avatarFallback}>
                                            <Text style={styles.avatarInitials}>
                                                {initials}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ) : null}

                            <View style={styles.headerTitleWrapper}>
                                <Text
                                    style={styles.headerTitle}
                                    numberOfLines={1}
                                >
                                    {chat.name || 'Unnamed Chat'}
                                </Text>
                                {subtitle && (
                                    <Text
                                        style={styles.headerSubtitle}
                                        numberOfLines={1}
                                    >
                                        {subtitle}
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={() => setGroupInfoVisible(true)}
                            >
                                <Ionicons
                                    name='information-circle-outline'
                                    size={24}
                                    color={themeColors.link}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Body */}
                        {loadingMessages ? (
                            <ActivityIndicator
                                size='large'
                                color={themeColors.primary}
                                style={{ marginTop: 20 }}
                            />
                        ) : messages.length === 0 ? (
                            <View style={styles.centered}>
                                <Image
                                    source={require('../../assets/no-chats2.png')}
                                    style={styles.emptyImage}
                                    resizeMode='contain'
                                />
                                <Text style={styles.noMessageText}>
                                    No messages yet. Say hello!
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={[...messages].reverse()}
                                keyExtractor={(item) => item.id?.toString()}
                                renderItem={renderItem}
                                inverted
                                onScroll={handleScroll}
                                contentContainerStyle={{ padding: 16 }}
                                keyboardShouldPersistTaps='handled'
                            />
                        )}

                        {typingNames.length > 0 && (
                            <TypingIndicator
                                theme={themeColors}
                                usernames={typingNames}
                            />
                        )}

                        <View style={styles.inputContainer}>
                            <TextInput
                                ref={inputRef}
                                value={inputMessage}
                                onChangeText={handleTyping}
                                placeholder='Type a message...'
                                placeholderTextColor={themeColors.placeholder}
                                style={styles.input}
                                onSubmitEditing={handleSend}
                                multiline
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    { opacity: inputMessage.trim() ? 1 : 0.5 },
                                ]}
                                onPress={
                                    inputMessage.trim() ? handleSend : null
                                }
                                onLongPress={() => setActionModalVisible(true)}
                            >
                                <Feather name='send' size={20} color='#fff' />
                            </TouchableOpacity>
                        </View>

                        {/* Modal */}
                        <ThreadModal
                            visible={!!threadMessage}
                            onClose={() => setThreadMessage(null)}
                            message={threadMessage}
                            chatId={chatId}
                            theme={themeColors}
                        />
                        {chat && (
                            <GroupInfoModal
                                visible={groupInfoVisible}
                                onClose={() => setGroupInfoVisible(false)}
                                chat={chat}
                                theme={themeColors}
                            />
                        )}
                        <ActionModal
                            visible={actionModalVisible}
                            onClose={() => setActionModalVisible(false)}
                            onSelect={handlePreparedMessage}
                            theme={themeColors}
                            options={[
                                {
                                    emoji: '🗓️',
                                    label: 'Event',
                                    action: {
                                        messageText: '🗓️ Event issued.',
                                        messageType: 'event',
                                    },
                                },
                                {
                                    emoji: '🧠',
                                    label: 'Create a Quiz',
                                    action: {
                                        messageText:
                                            '🧠 I would like to create a quiz.',
                                        messageType: 'quiz',
                                    },
                                },
                                {
                                    emoji: '📍',
                                    label: 'Location',
                                    action: {
                                        messageText: { location },
                                        messageType: 'location',
                                    },
                                },
                                {
                                    emoji: '📊',
                                    label: 'Poll',
                                    action: {
                                        messageText:
                                            '📊 Please participate in this poll.',
                                        messageType: 'poll',
                                    },
                                },
                            ]}
                        />

                        <QuizPromptModal
                            visible={quizPromptVisible}
                            onClose={() => setQuizPromptVisible(false)}
                            onCreate={handleCreateQuiz}
                            theme={themeColors}
                        />
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const createStyles = (theme, insets) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10 + insets.bottom,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 20,
            paddingBottom: 20,
            backgroundColor: theme.headerBackground,
        },
        headerAvatarWrapper: { marginLeft: 8, marginRight: 4 },
        avatar: { width: 32, height: 32, borderRadius: 16 },
        avatarFallback: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.link,
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarInitials: {
            color: '#fff',
            fontSize: 14,
            fontFamily: 'Poppins',
        },
        headerTitleWrapper: { flex: 1, marginLeft: 10 },
        headerTitle: {
            fontFamily: 'Poppins',
            fontSize: 18,
            fontWeight: '600',
            color: theme.title,
        },
        headerSubtitle: {
            fontSize: 12,
            fontFamily: 'Poppins',
            color: theme.text,
            opacity: 0.7,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: theme.divider,
            backgroundColor: theme.surface,
        },
        input: {
            flex: 1,
            backgroundColor: theme.input,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontFamily: 'Poppins',
            color: theme.inputText,
            maxHeight: 120,
        },
        sendButton: {
            marginLeft: 10,
            backgroundColor: theme.link,
            borderRadius: 20,
            padding: 12,
            justifyContent: 'center',
            alignItems: 'center',
        },
        centered: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 40,
        },

        emptyImage: {
            width: 450,
            height: 450,
            opacity: 0.9,
        },
        noMessageText: {
            textAlign: 'center',
            marginTop: -90,
            fontSize: 16,
            fontFamily: 'Poppins',
            color: theme.text,
        },
        errorText: {
            fontSize: 16,
            fontFamily: 'Poppins',
        },
        unreadSeparator: {
            paddingVertical: 6,
            alignItems: 'center',
            marginVertical: 10,
        },
        unreadText: {
            fontFamily: 'Poppins',
            fontSize: 13,
            color: theme.accent,
        },
    });

export default ChatRoomScreen;
