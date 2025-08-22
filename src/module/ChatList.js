import React, { useRef, useState, useMemo, useEffect, forwardRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { formatTimeAgo, truncate } from '../utils/utils';

import SwipeableList from '../components/SwipeableList';
import Tabs from '../components/Tabs';
import SearchBar from '../components/SearchBar';
import ConfirmationModal from '../components/ConfirmationModal';
import { deleteChat } from '../store/actions/chatActions';

const ChatList = forwardRef(
    (
        {
            theme,
            chats = [],
            onRefresh,
            refreshing = false,
            unreadByChatId = {},
        },
        outerRef
    ) => {
        const navigation = useNavigation();
        const dispatch = useDispatch();

        const [selectedTab, setSelectedTab] = useState('all');
        const [searchQuery, setSearchQuery] = useState('');
        const [modalProps, setModalProps] = useState(null);
        const [page, setPage] = useState(1);
        const [loadingMore, setLoadingMore] = useState(false);

        const PAGE_SIZE = 20;
        const swipeableRefs = useRef({});
        const currentlyOpenSwipeable = useRef(null);

        const styles = createStyles(theme);

        const tabs = [
            { key: 'all', label: '💬 All' },
            { key: 'groups', label: '👥 Groups' },
            { key: 'private', label: '👤 Private' },
        ];

        const filteredChats = useMemo(() => {
            const byType = chats.filter((chat) => {
                if (selectedTab === 'groups') return chat.is_group;
                if (selectedTab === 'private') return !chat.is_group;
                return true;
            });

            const bySearch = byType.filter((chat) =>
                (chat.name || '')
                    .toLowerCase()
                    .includes(searchQuery.trim().toLowerCase())
            );

            return bySearch;
        }, [chats, selectedTab, searchQuery]);

        const paginatedChats = filteredChats.slice(0, page * PAGE_SIZE);

        useEffect(() => {
            setPage(1);
        }, [searchQuery, selectedTab]);

        const handleSwipeStart = (index) => {
            if (
                currentlyOpenSwipeable.current &&
                currentlyOpenSwipeable.current !== swipeableRefs.current[index]
            ) {
                currentlyOpenSwipeable.current.close();
            }
            currentlyOpenSwipeable.current = swipeableRefs.current[index];
        };

        const handleDeleteChat = (chatId) => {
            dispatch(deleteChat(chatId));
            setModalProps(null);
        };

        const confirmDeleteChat = (chatId) => {
            setModalProps({
                visible: true,
                title: 'Delete Chat?',
                description: 'Are you sure you want to delete this chat?',
                icon: 'trash-outline',
                confirmLabel: 'Delete',
                cancelLabel: 'Cancel',
                onConfirm: () => handleDeleteChat(chatId),
                onCancel: () => setModalProps(null),
            });
        };

        const handleLoadMore = () => {
            if (loadingMore || paginatedChats.length >= filteredChats.length)
                return;
            setLoadingMore(true);
            setTimeout(() => {
                setPage((prev) => prev + 1);
                setLoadingMore(false);
            }, 400);
        };

        const stringToColor = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            const hue = hash % 360;
            return `hsl(${hue}, 60%, 60%)`;
        };

        const renderAvatar = (chat) => {
            const backgroundColor = stringToColor(chat.name || 'U');

            if (chat.is_group) {
                return (
                    <View
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 12,
                        }}
                    >
                        <Ionicons
                            name='people'
                            size={24}
                            color={theme.surface}
                        />
                    </View>
                );
            } else {
                const initials = (chat.name || 'U')
                    .split(' ')
                    .map((w) => w.charAt(0).toUpperCase())
                    .slice(0, 2)
                    .join('');

                return (
                    <View
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 12,
                        }}
                    >
                        <Text
                            style={{
                                color: theme.surface,
                                fontWeight: '600',
                                fontSize: 16,
                                fontFamily: 'Poppins',
                            }}
                        >
                            {initials}
                        </Text>
                    </View>
                );
            }
        };

        return (
            <View style={styles.container}>
                <SearchBar
                    query={searchQuery}
                    onChange={setSearchQuery}
                    theme={theme}
                    placeholder='Search chats...'
                    debounceTime={300}
                />

                <Tabs
                    tabs={tabs}
                    selectedTab={selectedTab}
                    onTabSelect={(key) => {
                        setSelectedTab(key);
                        setPage(1);
                    }}
                    theme={theme}
                />

                <SwipeableList
                    ref={outerRef}
                    data={paginatedChats}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    totalCount={filteredChats.length}
                    disableLoadMore={loadingMore}
                    onLoadMore={handleLoadMore}
                    hasMore={paginatedChats.length < filteredChats.length}
                    swipeableRefs={swipeableRefs}
                    handleSwipeStart={handleSwipeStart}
                    theme={theme}
                    showIcon={false}
                    keyExtractor={(item, index) =>
                        item?.id?.toString() || `chat-${index}`
                    }
                    onItemPress={(chat) =>
                        navigation.navigate('ChatRoom', { chatId: chat.id })
                    }
                    renderItemText={() => 'Chat item'}
                    renderRightActions={(chat) => (
                        <View style={styles.swipeActionsWrapper}>
                            <TouchableOpacity
                                style={styles.swipeActionDelete}
                                onPress={() => confirmDeleteChat(chat.id)}
                            >
                                <Ionicons
                                    name='trash-outline'
                                    size={24}
                                    color='#fff'
                                />
                            </TouchableOpacity>
                        </View>
                    )}
                    renderItemContainer={(chat, _text, onItemPress) => {
                        const chatId = chat.id;
                        const hasUnread = unreadByChatId[chatId];
                        return (
                            <Pressable
                                onPress={() => onItemPress(chat)}
                                style={({ pressed }) => [
                                    styles.chatItem,
                                    {
                                        backgroundColor: pressed
                                            ? theme.cardPressed
                                            : theme.surface,
                                    },
                                ]}
                            >
                                <View style={styles.row}>
                                    {renderAvatar(chat)}
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[
                                                styles.chatTitle,
                                                { color: theme.title },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {truncate(
                                                chat.name || 'Unknown',
                                                30
                                            )}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.lastMessage,
                                                {
                                                    color: theme.text,
                                                    opacity: 0.7,
                                                },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {truncate(
                                                chat.lastMessage ||
                                                    'Start chatting!',
                                                50
                                            )}
                                        </Text>
                                    </View>

                                    <View style={styles.metaRight}>
                                        <Text
                                            style={[
                                                styles.timeAgo,
                                                {
                                                    color: theme.text,
                                                    opacity: 0.5,
                                                },
                                            ]}
                                        >
                                            {formatTimeAgo(
                                                chat.updated_at ||
                                                    chat.created_at
                                            )}
                                        </Text>
                                        {hasUnread && (
                                            <View style={styles.unreadDot} />
                                        )}
                                    </View>
                                </View>
                            </Pressable>
                        );
                    }}
                />

                {modalProps && (
                    <ConfirmationModal
                        {...modalProps}
                        theme={theme}
                        onClose={() => setModalProps(null)}
                    />
                )}
            </View>
        );
    }
);

const createStyles = (theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        row: { flexDirection: 'row', alignItems: 'center' },
        chatItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            paddingHorizontal: 12,
            borderRadius: 12,
            marginBottom: 0,
        },
        chatTitle: {
            fontFamily: 'Poppins',
            fontSize: 15,
            fontWeight: 'bold',
        },
        lastMessage: {
            fontFamily: 'Poppins',
            fontSize: 13,
            marginTop: 2,
        },
        timeAgo: {
            fontFamily: 'Poppins',
            fontSize: 12,
            marginLeft: 8,
        },
        metaRight: {
            alignItems: 'flex-end',
            justifyContent: 'center',
            marginLeft: 8,
        },
        unreadDot: {
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: 'dodgerblue',
            marginTop: 6,
        },
        swipeActionsWrapper: {
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            paddingRight: 4,
        },
        swipeActionDelete: {
            backgroundColor: 'red',
            justifyContent: 'center',
            alignItems: 'center',
            width: 70,
            height: '90%',
            borderRadius: 12,
            marginVertical: 4,
        },
    });

export default ChatList;
