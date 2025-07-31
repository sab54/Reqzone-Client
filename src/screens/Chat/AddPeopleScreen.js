import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    Alert,
    SafeAreaView,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useFonts } from 'expo-font';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SearchBar from '../../components/SearchBar';
import ConfirmationModal from '../../components/ConfirmationModal';

import {
    fetchUserSuggestions,
    addUserToDraftGroup,
    removeUserFromDraftGroup,
    clearDraftGroupUsers,
    createGroupChat,
    startDirectMessage,
    addUserToExistingGroup, // ✅ You must implement this
} from '../../store/actions/chatActions';

let searchDebounceTimeout;

const AddPeopleScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { themeColors } = useSelector((state) => state.theme);
    const { allUsers, draftGroupUsers, loading } = useSelector(
        (state) => state.chat
    );

    const styles = createStyles(themeColors, insets);
    const { chatId, mode } = route.params || {};
    console.log(' AddPeopleScreen route params chatId: ', chatId);

    const [searchQuery, setSearchQuery] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    const [fontsLoaded] = useFonts({
        Poppins: require('../../assets/fonts/Poppins-Regular.ttf'),
        PoppinsBold: require('../../assets/fonts/Poppins-Bold.ttf'),
    });

    useEffect(() => {
        dispatch(fetchUserSuggestions(''));
        dispatch(clearDraftGroupUsers());
    }, [dispatch]);

    useEffect(() => {
        if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout);
        searchDebounceTimeout = setTimeout(() => {
            dispatch(fetchUserSuggestions(searchQuery));
        }, 300);
        return () => clearTimeout(searchDebounceTimeout);
    }, [searchQuery, dispatch]);

    const isSelected = (id) => draftGroupUsers.some((user) => user.id === id);

    // const filteredUsers = allUsers.filter((user) => {
    //     const query = searchQuery.toLowerCase();
    //     return (
    //         (user.name || '').toLowerCase().includes(query) ||
    //         (user.email || '').toLowerCase().includes(query) ||
    //         (user.phone_number || '').toLowerCase().includes(query) ||
    //         (user.postal_code || '').toLowerCase().includes(query) ||
    //         (user.city || '').toLowerCase().includes(query) ||
    //         (user.state || '').toLowerCase().includes(query) ||
    //         (user.country || '').toLowerCase().includes(query) ||
    //         (user.address_line1 || '').toLowerCase().includes(query) ||
    //         (user.address_line2 || '').toLowerCase().includes(query) ||
    //         (user.role || '').toLowerCase().includes(query) ||
    //         (user.gender || '').toLowerCase().includes(query)
    //     );
    // });

    const filteredUsers = allUsers;

    const toggleUser = (user) => {
        if (isSelected(user.id)) {
            dispatch(removeUserFromDraftGroup(user.id));
        } else {
            dispatch(addUserToDraftGroup(user));
        }
    };

    const handleSelectAll = () => {
        filteredUsers.forEach((user) => {
            if (!isSelected(user.id)) {
                dispatch(addUserToDraftGroup(user));
            }
        });
    };

    const handleClearAll = () => {
        dispatch(clearDraftGroupUsers());
    };

    const handleSubmit = async () => {
        const selectedCount = draftGroupUsers.length;
        if (selectedCount === 0) return;

        setSubmitting(true);

        try {
            const userIds = draftGroupUsers.map((u) => u.id);

            if (chatId && mode === 'addToGroup') {
                await dispatch(
                    addUserToExistingGroup({ chatId, userIds })
                ).unwrap();
                navigation.navigate('ChatRoom', { chatId });
            } else if (selectedCount === 1) {
                const otherUserId = draftGroupUsers[0].id;
                const response = await dispatch(
                    startDirectMessage(otherUserId)
                ).unwrap();
                navigation.navigate('ChatRoom', { chatId: response.chat_id });
            } else {
                setModalVisible(true);
            }
        } catch (err) {
            Alert.alert('Error', err?.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGroupCreate = async () => {
        const trimmed = groupName.trim();
        if (!trimmed) {
            Alert.alert('Invalid Name', 'Group name is required.');
            return;
        }

        setSubmitting(true);
        try {
            const userIds = draftGroupUsers.map((u) => u.id);
            const response = await dispatch(
                createGroupChat({ name: trimmed, userIds })
            ).unwrap();
            navigation.navigate('ChatRoom', { chatId: response.chat_id });
        } catch (err) {
            Alert.alert('Error', err?.message || 'Failed to create group');
        } finally {
            setSubmitting(false);
            setModalVisible(false);
            setGroupName('');
        }
    };

    const renderUserItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.userItem,
                isSelected(item.id) && styles.selectedItem,
            ]}
            onPress={() => toggleUser(item)}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {item.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                </Text>
            </View>
            <Text style={styles.userName}>{item.name}</Text>
            {isSelected(item.id) && (
                <Ionicons
                    name='checkmark'
                    size={20}
                    color={themeColors.primary}
                />
            )}
        </TouchableOpacity>
    );

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' color={themeColors.primary} />
                <Text
                    style={{ color: themeColors.text, fontFamily: 'Poppins' }}
                >
                    Loading...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={insets.top + 12}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.header}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons
                                    name='arrow-back-outline'
                                    size={24}
                                    color={themeColors.link}
                                />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>
                                {chatId ? 'Add People' : 'New Message'}
                            </Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <View style={styles.containerInner}>
                            <SearchBar
                                query={searchQuery}
                                onChange={setSearchQuery}
                                theme={themeColors}
                                placeholder='Search users'
                            />

                            <View style={styles.actionsRow}>
                                <TouchableOpacity onPress={handleSelectAll}>
                                    <Text
                                        style={[
                                            styles.actionText,
                                            { color: themeColors.link },
                                        ]}
                                    >
                                        Select All
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleClearAll}>
                                    <Text
                                        style={[
                                            styles.actionText,
                                            { color: themeColors.error },
                                        ]}
                                    >
                                        Clear All
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {draftGroupUsers.length > 0 && (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={[
                                        styles.chipScroll,
                                        { paddingBottom: 8 },
                                    ]}
                                >
                                    {draftGroupUsers.map((user) => (
                                        <View key={user.id} style={styles.chip}>
                                            <Text
                                                style={styles.chipText}
                                                numberOfLines={1}
                                            >
                                                {user.name}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => toggleUser(user)}
                                            >
                                                <Ionicons
                                                    name='close'
                                                    size={18}
                                                    color={themeColors.error}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}

                            <Text style={styles.suggestionsHeader}>
                                Suggestions
                            </Text>

                            {loading ? (
                                <ActivityIndicator
                                    size='large'
                                    color={themeColors.primary}
                                />
                            ) : (
                                <FlatList
                                    data={filteredUsers}
                                    keyExtractor={(item) =>
                                        item?.id?.toString() ||
                                        Math.random().toString()
                                    }
                                    renderItem={renderUserItem}
                                    contentContainerStyle={{
                                        paddingBottom: 160,
                                    }}
                                />
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.addButton,
                                    {
                                        backgroundColor:
                                            draftGroupUsers.length > 0 &&
                                            !submitting
                                                ? themeColors.link
                                                : themeColors.disabled,
                                    },
                                ]}
                                onPress={handleSubmit}
                                disabled={
                                    draftGroupUsers.length === 0 || submitting
                                }
                            >
                                <Text style={styles.addButtonText}>
                                    {submitting
                                        ? 'Processing...'
                                        : chatId
                                        ? `Add (${draftGroupUsers.length})`
                                        : draftGroupUsers.length === 1
                                        ? 'Start Chat'
                                        : `Create Group (${draftGroupUsers.length})`}
                                </Text>
                            </TouchableOpacity>

                            {!chatId && (
                                <ConfirmationModal
                                    visible={modalVisible}
                                    theme={themeColors}
                                    title='Group Name'
                                    description='Please enter a name for the group chat.'
                                    icon='chatbubble-ellipses-outline'
                                    confirmLabel='Create'
                                    cancelLabel='Cancel'
                                    onClose={() => setModalVisible(false)}
                                    onConfirm={handleGroupCreate}
                                    onCancel={() => setModalVisible(false)}
                                >
                                    <TextInput
                                        placeholder='Group name'
                                        value={groupName}
                                        onChangeText={setGroupName}
                                        style={styles.input}
                                        placeholderTextColor={
                                            themeColors.placeholder
                                        }
                                    />
                                </ConfirmationModal>
                            )}
                        </View>
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
        containerInner: { padding: 16 },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
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
        headerTitle: {
            fontFamily: 'Poppins',
            fontSize: 18,
            color: theme.title,
            flex: 1,
            marginLeft: 10,
        },
        actionsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 8,
        },
        actionText: {
            fontSize: 14,
            fontFamily: 'PoppinsBold',
        },
        userItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.card,
            padding: 12,
            marginVertical: 6,
            borderRadius: 10,
            elevation: 2,
        },
        selectedItem: {
            borderColor: theme.primary,
            borderWidth: 2,
        },
        avatar: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.primary + '22',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
        },
        avatarText: {
            fontWeight: 'bold',
            color: theme.primary,
        },
        userName: {
            flex: 1,
            fontSize: 16,
            fontFamily: 'Poppins',
            color: theme.text,
        },
        chipScroll: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            rowGap: 8,
            columnGap: 8,
            marginBottom: 4,
        },
        chip: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surface,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            marginRight: 8,
            minHeight: 36,
            alignSelf: 'flex-start',
            maxWidth: 180,
        },
        chipText: {
            flexShrink: 1,
            fontSize: 13,
            color: theme.text,
            fontFamily: 'Poppins',
            marginRight: 6,
            maxWidth: 130,
            overflow: 'hidden',
        },
        suggestionsHeader: {
            fontSize: 16,
            fontFamily: 'PoppinsBold',
            color: theme.title,
            marginBottom: 8,
        },
        addButton: {
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 24 : 16,
            left: 16,
            right: 16,
            height: 50,
            borderRadius: 25,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 5,
        },
        addButtonText: {
            color: '#fff',
            fontSize: 15,
            fontFamily: 'PoppinsBold',
            textAlign: 'center',
        },
        input: {
            marginTop: 10,
            padding: 12,
            borderRadius: 8,
            backgroundColor: theme.input,
            color: theme.inputText,
            fontFamily: 'Poppins',
        },
    });

export default AddPeopleScreen;
