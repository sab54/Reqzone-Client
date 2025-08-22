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
    Pressable,
} from 'react-native';
import Modal from 'react-native-modal';
import { Feather } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { removeUserFromGroup } from '../store/actions/chatActions';
import ConfirmationModal from '../components/ConfirmationModal';

const GroupInfoModal = ({ visible, onClose, chat, theme }) => {
    const insets = useSafeAreaInsets();
    const currentUserId = useSelector((state) => state.auth.user?.id);
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const [showConfirm, setShowConfirm] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [deferConfirm, setDeferConfirm] = React.useState(false); // open confirm AFTER modal is closed

    if (!chat) return null;

    const isGroup = !!chat.is_group;
    const creatorId = chat.created_by || null;
    const styles = createStyles(theme, insets);

    // Normalize members
    const participants = (chat.members || []).map((m) => ({
        id: m.id || m.user_id,
        name: m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim(),
        first_name: m.first_name,
        last_name: m.last_name,
        email: m.email,
        phone: m.phone || m.phone_number || null,
        location: m.location || m.city || m.country || m.postal_code || null,
        avatar: m.avatar,
        role: m.role || 'member',
    }));

    const isOwner =
        participants.find((m) => m.id === currentUserId)?.role === 'owner';

    const sortedParticipants = [...participants].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
    );

    // For 1:1 chat, determine the "other" user
    const otherUser = !isGroup
        ? participants.find((p) => p.id !== currentUserId) ||
          participants[0] ||
          null
        : null;

    const renderAvatar = (user, size = 64) => {
        if (user?.avatar) {
            return (
                <Image
                    source={{ uri: user.avatar }}
                    style={[
                        styles.avatar,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            marginRight: 0,
                        },
                    ]}
                />
            );
        }
        const base = user?.name || user?.email || 'U';
        const initials = base
            .split(' ')
            .filter(Boolean)
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
        return (
            <View
                style={[
                    styles.avatarFallback,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        marginRight: 0,
                    },
                ]}
            >
                <Text
                    style={[styles.avatarInitials, { fontSize: size * 0.35 }]}
                >
                    {initials}
                </Text>
            </View>
        );
    };

    const renderUser = ({ item }) => {
        const isSelf = item.id === currentUserId;
        const isCreator = item.id === creatorId;
        const isAdmin = item.role === 'admin';

        return (
            <View style={styles.memberItem}>
                {renderAvatar(item, 40)}
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.nameRow}>
                        <Text style={styles.memberName}>
                            {item.name || item.email || 'Unnamed'}
                        </Text>
                        {isSelf && <Text style={styles.badge}>You</Text>}
                        {isCreator && <Text style={styles.badge}>Creator</Text>}
                        {isAdmin && <Text style={styles.badge}>👑 Admin</Text>}
                    </View>
                    {item.email ? (
                        <Text style={styles.memberEmail}>{item.email}</Text>
                    ) : null}
                </View>

                {/* Owner can remove non-admins, not self */}
                {isGroup && !isSelf && !isAdmin && isOwner && (
                    <Pressable
                        style={styles.removeButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => {
                            setSelectedUser(item);
                            setDeferConfirm(true);
                            onClose?.();
                        }}
                    >
                        <Text style={styles.removeText}>Remove</Text>
                    </Pressable>
                )}
            </View>
        );
    };

    // Simple row for non-group info
    const InfoRow = ({ label, value }) => {
        if (!value) return null;
        return (
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        );
    };

    return (
        <>
            <Modal
                isVisible={visible}
                onBackdropPress={onClose}
                onBackButtonPress={onClose}
                onModalHide={() => {
                    if (deferConfirm && selectedUser) {
                        setDeferConfirm(false);
                        setShowConfirm(true);
                    }
                }}
                style={styles.modal}
                useNativeDriver
                useNativeDriverForBackdrop
                propagateSwipe
                statusBarTranslucent
                backdropTransitionOutTiming={0} // avoid flicker when chaining modals
            >
                <SafeAreaView style={styles.modalContent}>
                    {/* Header (don't steal touches) */}
                    <View style={styles.absWrapper} pointerEvents='box-none'>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            hitSlop={{
                                top: 10,
                                right: 10,
                                bottom: 10,
                                left: 10,
                            }}
                        >
                            <Feather name='x' size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.header}>
                        {isGroup ? 'Group Members' : ''}
                    </Text>

                    {isGroup ? (
                        <>
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
                                keyboardShouldPersistTaps='handled'
                                removeClippedSubviews={false}
                            />

                            {/* Bottom bar (don't blanket the list) */}
                            <View pointerEvents='box-none'>
                                {isGroup && isOwner && (
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={() => {
                                            onClose?.();
                                            navigation.navigate(
                                                'AddPeopleScreen',
                                                {
                                                    mode: 'addToGroup',
                                                    chatId:
                                                        chat.chat_id ?? chat.id,
                                                    existingMembers:
                                                        participants.map(
                                                            (p) => p.id
                                                        ),
                                                }
                                            );
                                        }}
                                    >
                                        <Text style={styles.addButtonText}>
                                            ➕ Add People
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    ) : (
                        // 1:1 USER INFO
                        <View style={styles.userInfoContainer}>
                            <View style={styles.profileHeader}>
                                {otherUser ? renderAvatar(otherUser, 72) : null}
                                <View
                                    style={{
                                        marginTop: 12,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={styles.profileName}>
                                        {otherUser?.name ||
                                            otherUser?.email ||
                                            'Unnamed'}
                                    </Text>
                                    {otherUser?.role ? (
                                        <Text style={styles.profileRole}>
                                            {otherUser.role}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                            {console.log('User: ', otherUser)}
                            <View style={styles.infoCard}>
                                <InfoRow
                                    label='Email'
                                    value={otherUser?.email}
                                />
                                {/* <InfoRow
                                    label='Phone'
                                    value={otherUser?.phone}
                                />
                                <InfoRow
                                    label='Location'
                                    value={otherUser?.location}
                                /> */}
                            </View>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>

            {/* Confirmation after Group modal closes */}
            <ConfirmationModal
                visible={showConfirm}
                onClose={() => {
                    setShowConfirm(false);
                    setSelectedUser(null);
                }}
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
        absWrapper: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
        },
        closeButton: {
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 11,
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

        /* === 1:1 user info styles === */
        userInfoContainer: {
            paddingHorizontal: 8,
            paddingTop: 8,
        },
        profileHeader: {
            alignItems: 'center',
            marginBottom: 16,
        },
        profileName: {
            fontSize: 18,
            fontFamily: 'PoppinsBold',
            color: theme.text,
        },
        profileRole: {
            marginTop: 2,
            fontSize: 12,
            fontFamily: 'Poppins',
            color: theme.mutedText,
        },
        infoCard: {
            backgroundColor: theme.input,
            borderRadius: 12,
            padding: 12,
        },
        infoRow: {
            paddingVertical: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.mutedText + '33',
        },
        infoLabel: {
            fontFamily: 'Poppins',
            fontSize: 12,
            color: theme.mutedText,
            marginBottom: 2,
        },
        infoValue: {
            fontFamily: 'Poppins',
            fontSize: 15,
            color: theme.text,
        },
    });
};

export default GroupInfoModal;
