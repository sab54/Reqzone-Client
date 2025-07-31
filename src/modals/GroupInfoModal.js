import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    SafeAreaView,
    Dimensions,
    Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import { Feather } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { removeUserFromGroup } from '../store/actions/chatActions';
import ConfirmationModal from '../components/ConfirmationModal';

const GroupInfoModal = ({ visible, onClose, chat, theme }) => {
    console.log('GroupInfoModal chat: ', chat);

    const insets = useSafeAreaInsets();
    const keyboardOffset = Platform.OS === 'ios' ? insets.top : 0;

    const currentUserId = useSelector((state) => state.auth.user?.id);
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const [showConfirm, setShowConfirm] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState(null);

    if (!chat) return null;

    const isGroup = chat.is_group;
    const creatorId = chat.created_by || null;
    const styles = createStyles(theme, insets);

    // ✅ Normalize participants
    const participants = (chat.members || []).map((m) => ({
        id: m.id || m.user_id,
        name: m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim(),
        email: m.email,
        avatar: m.avatar,
        role: m.role || 'member',
    }));

    const isOwner =
        participants.find((m) => m.id === currentUserId)?.role === 'owner';

    const sortedParticipants = [...participants].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
    );

    const renderAvatar = (user) => {
        if (user.avatar) {
            return (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
            );
        }

        const initials = (user.name || user.email || 'U')
            .split(' ')
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

        return (
            <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
        );
    };

    const renderUser = ({ item }) => {
        const isSelf = item.id === currentUserId;
        const isCreator = item.id === creatorId;
        const isAdmin = item.role === 'admin';

        return (
            <View style={styles.memberItem}>
                {renderAvatar(item)}
                <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                        <Text style={styles.memberName}>
                            {item.name || item.email || 'Unnamed'}
                        </Text>
                        {isSelf && <Text style={styles.badge}>You</Text>}
                        {isCreator && <Text style={styles.badge}>Creator</Text>}
                        {isAdmin && <Text style={styles.badge}>👑 Admin</Text>}
                    </View>
                    {item.email && (
                        <Text style={styles.memberEmail}>{item.email}</Text>
                    )}
                </View>

                {/* ✅ Only show remove button in group chats */}
                {isGroup && !isSelf && !isAdmin && isOwner && (
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => {
                            setSelectedUser(item);
                            setShowConfirm(true);
                        }}
                    >
                        <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <>
            <Modal
                isVisible={visible}
                onBackdropPress={onClose}
                onBackButtonPress={onClose}
                style={styles.modal}
                useNativeDriver
                propagateSwipe
            >
                <SafeAreaView style={styles.modalContent}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Feather name='x' size={20} color={theme.text} />
                    </TouchableOpacity>

                    <Text style={styles.header}>
                        {isGroup ? 'Group Members' : 'User Info'}
                    </Text>

                    <Text style={styles.subheader}>
                        {sortedParticipants.length} member
                        {sortedParticipants.length !== 1 ? 's' : ''}
                    </Text>

                    <FlatList
                        data={sortedParticipants}
                        keyExtractor={(item, index) =>
                            item?.id?.toString?.() || `member-${index}`
                        }
                        renderItem={renderUser}
                        contentContainerStyle={styles.listContent}
                    />

                    {isGroup && isOwner && (
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => {
                                onClose();
                                navigation.navigate('AddPeopleScreen', {
                                    mode: 'addToGroup',
                                    chatId: chat.chat_id ?? chat.id,
                                    existingMembers: participants.map(
                                        (p) => p.id
                                    ),
                                });
                            }}
                        >
                            <Text style={styles.addButtonText}>
                                ➕ Add People
                            </Text>
                        </TouchableOpacity>
                    )}
                </SafeAreaView>
            </Modal>

            <ConfirmationModal
                visible={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={async () => {
                    if (selectedUser) {
                        await dispatch(
                            removeUserFromGroup({
                                chatId: chat.chat_id ?? chat.id,
                                userId: selectedUser.id,
                            })
                        );
                        setShowConfirm(false);
                        setSelectedUser(null);
                    }
                }}
                title={`Remove ${selectedUser?.name || 'this user'}?`}
                description='They will no longer have access to this group chat.'
                confirmLabel='Remove'
                cancelLabel='Cancel'
                theme={theme}
                icon='person-remove-outline'
            />
        </>
    );
};

const createStyles = (theme, insets) => {
    const { height } = Dimensions.get('window');
    return StyleSheet.create({
        modal: {
            justifyContent: 'flex-end',
            margin: 0,
        },
        modalContent: {
            backgroundColor: theme.surface,
            maxHeight: height * 0.95,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 20,
            paddingBottom: 120,
            flexGrow: 1,
        },
        closeButton: {
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 10,
        },
        header: {
            fontSize: 20,
            fontFamily: 'PoppinsBold',
            color: theme.title,
            textAlign: 'center',
            marginBottom: 6,
        },
        subheader: {
            fontSize: 13,
            fontFamily: 'Poppins',
            color: theme.mutedText,
            textAlign: 'center',
            marginBottom: 12,
        },
        listContent: {
            paddingBottom: 140,
        },
        memberItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.input,
            padding: 14,
            marginBottom: 10,
            borderRadius: 10,
        },
        avatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: 12,
        },
        avatarFallback: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.link,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        avatarInitials: {
            color: '#fff',
            fontSize: 14,
            fontFamily: 'PoppinsBold',
        },
        nameRow: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 6,
        },
        memberName: {
            fontFamily: 'Poppins',
            fontSize: 16,
            color: theme.text,
        },
        memberEmail: {
            fontFamily: 'Poppins',
            fontSize: 13,
            color: theme.text,
            opacity: 0.7,
            marginTop: 2,
        },
        badge: {
            backgroundColor: theme.accent,
            color: theme.badgeText,
            fontSize: 11,
            fontFamily: 'Poppins',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
            overflow: 'hidden',
            marginLeft: 6,
        },
        addButton: {
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 24 : 16,
            left: 20,
            right: 20,
            backgroundColor: theme.link,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            zIndex: 10,
        },
        addButtonText: {
            color: '#fff',
            fontSize: 15,
            fontFamily: 'PoppinsBold',
        },
        removeButton: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: 'rgba(255,0,0,0.1)',
        },
        removeText: {
            fontFamily: 'Poppins',
            fontSize: 12,
            color: 'red',
        },
    });
};

export default GroupInfoModal;
