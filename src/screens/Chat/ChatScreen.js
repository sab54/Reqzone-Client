// src/screens/Chat/ChatScreen.js
/**
 * ChatScreen.js
 *
 * Purpose:
 * Inbox-style chat list with pull-to-refresh, socket-driven live updates,
 * geofenced “local group” prioritization, and a FAB to start chats or join a
 * local group using current location.
 *
 * Key Responsibilities:
 * - **Font Loading**: Uses `expo-font`; shows spinner + "Loading fonts..." until ready.
 * - **Bootstrap/Refresh**:
 *   - On focus and socket connect/reconnect → dispatches `fetchActiveChats()`.
 *   - Pull-to-refresh calls `fetchActiveChats()` and toggles `refreshing`.
 * - **Socket Live Updates**:
 *   - Initializes socket via `initSocket({ userId })`.
 *   - Subscribes `onEvent('chat:list_update', ...)` and debounces 200ms, then
 *     dispatches `updateActiveChatsFromSocket(chats)`.
 * - **Location**:
 *   - On mount, requests location permission; if granted, caches current coords.
 *   - FAB → "Join Local Group" asks permission, reverse geocodes (Expo first,
 *     fallback to `reverseGeocode` util), then dispatches `joinLocalGroup(...)`
 *     and navigates to `ChatRoom` with the returned `chat_id`.
 * - **Sorting**:
 *   - Local groups (within their `radius_km` of current coords) float to top.
 *   - Otherwise sorts by `updated_at` desc.
 * - **Rendering**:
 *   - Loading state: "Loading chats..." with spinner.
 *   - Empty state: illustration + "No chats yet. Start one!", pull-to-refresh enabled.
 *   - Non-empty: renders `ChatList` + persistent `Footer`.
 *   - Always shows a floating FAB to open `ActionModal`.
 *
 * Store Contracts:
 * - Reads `theme.themeColors`, `auth.user.id`, `chat` slice fields
 *   (`activeChats`, `loading`, `error`, `messagesByChatId`, `lastReadByChatId`).
 * - Dispatches: `fetchActiveChats`, `joinLocalGroup`,
 *   reducer action `updateActiveChatsFromSocket`.
 *
 * Notes:
 * - Effects may fire twice in React 18 Strict Mode; tests assert "was called"
 *   not exact counts.
 *
 * Author: Sunidhi Abhange
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { reverseGeocode } from '../../utils/utils';

// Components
import ChatList from '../../module/ChatList';
import Footer from '../../components/Footer';
import ActionModal from '../../modals/ActionModal';

// Redux
import {
    fetchActiveChats,
    joinLocalGroup,
} from '../../store/actions/chatActions';
import { updateActiveChatsFromSocket } from '../../store/reducers/chatReducer';

// Socket
import { initSocket, onEvent, offEvent } from '../../utils/socket';

const ChatScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const flatListRef = useRef(null);
    const debounceRef = useRef(null);
    const insets = useSafeAreaInsets();

    const [refreshing, setRefreshing] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [currentCoords, setCurrentCoords] = useState(null);
    const [fontsLoaded] = useFonts({
        Poppins: require('../../assets/fonts/Poppins-Regular.ttf'),
    });

    const theme = useSelector((state) => state.theme.themeColors);
    const currentUserId = useSelector((state) => state.auth.user?.id);
    const { activeChats, loading, error } = useSelector((state) => state.chat);
    const messagesByChatId = useSelector(
        (state) => state.chat.messagesByChatId
    );
    const lastReadByChatId = useSelector(
        (state) => state.chat.lastReadByChatId
    );

    const styles = createStyles(theme, insets);

    const fetchChats = useCallback(() => {
        if (refreshing) return;
        setRefreshing(true);
        dispatch(fetchActiveChats()).finally(() => setRefreshing(false));
    }, [dispatch, refreshing]);

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchActiveChats());
        }, [dispatch])
    );

    useEffect(() => {
        if (!currentUserId) return;

        const socket = initSocket({ userId: currentUserId });

        socket?.on('connect', () => {
            dispatch(fetchActiveChats());
        });

        socket?.on('reconnect', () => {
            dispatch(fetchActiveChats());
        });

        onEvent('chat:list_update', (chats) => {
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                dispatch(updateActiveChatsFromSocket(chats));
            }, 200);
        });

        return () => {
            offEvent('chat:list_update');
        };
    }, [currentUserId, dispatch]);

    useEffect(() => {
        if (flatListRef.current && activeChats.length > 0) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
    }, [activeChats.length]);

    useEffect(() => {
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setCurrentCoords(location.coords);
            }
        })();
    }, []);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const sortedChats = [...activeChats].sort((a, b) => {
        const aIsLocal =
            a.is_group &&
            a.latitude &&
            a.longitude &&
            a.radius_km &&
            currentCoords &&
            calculateDistance(
                currentCoords.latitude,
                currentCoords.longitude,
                parseFloat(a.latitude),
                parseFloat(a.longitude)
            ) <= parseFloat(a.radius_km);

        const bIsLocal =
            b.is_group &&
            b.latitude &&
            b.longitude &&
            b.radius_km &&
            currentCoords &&
            calculateDistance(
                currentCoords.latitude,
                currentCoords.longitude,
                parseFloat(b.latitude),
                parseFloat(b.longitude)
            ) <= parseFloat(b.radius_km);

        if (aIsLocal && !bIsLocal) return -1;
        if (!aIsLocal && bIsLocal) return 1;
        return new Date(b.updated_at) - new Date(a.updated_at);
    });

    const handleSelection = async (action) => {
        setActionModalVisible(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        switch (action) {
            case 'start_new_chat':
                navigation.navigate('AddPeopleScreen');
                break;
            case 'join_local_group':
                try {
                    const { status } =
                        await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert(
                            'Permission Denied',
                            'Location access is required.'
                        );
                        return;
                    }

                    const location = await Location.getCurrentPositionAsync({});
                    const { latitude, longitude } = location.coords;
                    let address = `Lat: ${latitude.toFixed(
                        5
                    )}, Lon: ${longitude.toFixed(5)}`;
                    let hasAddress = false;
                    try {
                        const data = await Location.reverseGeocodeAsync({
                            latitude,
                            longitude,
                        });
                        if (data?.[0]) {
                            address = data[0];
                            hasAddress = true;
                        }
                    } catch (_) {
                        const getReverseGeocode = await reverseGeocode(
                            latitude,
                            longitude
                        );
                        address = {
                            street: getReverseGeocode.road,
                            ...getReverseGeocode,
                        };
                        hasAddress = !getReverseGeocode.hasErrors;
                        console.log('address: ', address, hasAddress);
                    }

                    const result = await dispatch(
                        joinLocalGroup({
                            latitude,
                            longitude,
                            address,
                            hasAddress,
                        })
                    );

                    if (result?.payload?.chat_id) {
                        navigation.navigate('ChatRoom', {
                            chatId: result.payload.chat_id,
                        });
                    }
                } catch (err) {
                    Alert.alert('Error', 'Failed to join local group.');
                }
                break;
            case 'start_ai_chat':
                console.log('AI Chat');
                break;
        }
    };

    const unreadByChatId = {};
    activeChats.forEach((chat) => {
        const chatId = chat.chat_id || chat.id;
        const messages = messagesByChatId[chatId] || [];
        const lastMessage = messages[messages.length - 1];
        const lastReadId = lastReadByChatId[chatId];
        unreadByChatId[chatId] = !!(
            lastMessage && lastMessage.id !== lastReadId
        );
    });

    const renderEmptyList = () => (
        <FlatList
            data={[{ key: 'placeholder' }]}
            keyExtractor={(item) => item.key}
            renderItem={() => (
                <View style={styles.emptyContainer}>
                    <Image
                        source={require('../../assets/no-chats2.png')}
                        style={styles.emptyImage}
                        resizeMode='contain'
                    />
                    <Text style={styles.emptyText}>
                        No chats yet. Start one!
                    </Text>
                </View>
            )}
            contentContainerStyle={styles.scrollContent}
            refreshing={refreshing}
            onRefresh={fetchChats}
            ListFooterComponent={<View style={{ height: 100 }} />}
        />
    );

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>
                    Loading fonts...
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size='large' color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.text }]}>
                        Loading chats...
                    </Text>
                </View>
            ) : sortedChats.length === 0 ? (
                renderEmptyList()
            ) : (
                <>
                    <ChatList
                        ref={flatListRef}
                        theme={theme}
                        chats={sortedChats}
                        refreshing={refreshing}
                        onRefresh={fetchChats}
                        unreadByChatId={unreadByChatId}
                    />
                    <Footer theme={theme} />
                </>
            )}

            {error && (
                <Text style={[styles.errorText, { color: theme.error }]}>
                    {error}
                </Text>
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setActionModalVisible(true)}
            >
                <Ionicons name='chatbox-ellipses' size={28} color='#fff' />
            </TouchableOpacity>

            <ActionModal
                visible={actionModalVisible}
                onClose={() => setActionModalVisible(false)}
                onSelect={handleSelection}
                theme={theme}
                options={[
                    {
                        emoji: '🗨️',
                        label: 'Start New Chat',
                        action: 'start_new_chat',
                    },
                    {
                        emoji: '👥',
                        label: 'Join Local Group',
                        action: 'join_local_group',
                    },
                    {
                        emoji: '🤖',
                        label: 'AI Chat',
                        action: 'start_ai_chat',
                    },
                ]}
            />
        </KeyboardAvoidingView>
    );
};

const createStyles = (theme, insets) =>
    StyleSheet.create({
        container: {
            flex: 1,
            paddingTop: 20,
            paddingHorizontal: 16,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10 + insets.bottom,
        },
        scrollContent: {
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        loadingText: {
            marginTop: 10,
            fontFamily: 'Poppins',
        },
        emptyContainer: {
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
        emptyText: {
            textAlign: 'center',
            marginTop: -90,
            fontSize: 16,
            fontFamily: 'Poppins',
            color: theme.text,
        },
        fab: {
            position: 'absolute',
            bottom: 20,
            right: 20,
            backgroundColor: theme.link,
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 6,
        },
        errorText: {
            textAlign: 'center',
            fontSize: 14,
            fontFamily: 'Poppins',
            marginBottom: 12,
        },
    });

export default ChatScreen;
