import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Linking,
    StyleSheet,
    LayoutAnimation,
    Platform,
    UIManager,
    Animated,
    Alert,
    Modal,
    Pressable,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import * as Location from 'expo-location';
import * as Localization from 'expo-localization';
import * as Network from 'expo-network';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchEmergencyContacts,
    addEmergencyContact,
    deleteEmergencyContact,
} from '../store/actions/emergencyActions';
import AddContactModal from '../modals/AddContactModal';
import ConfirmationModal from '../components/ConfirmationModal';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COUNTRY_NUMBERS = {
    US: '911',
    UK: '999',
    IN: '112',
    AU: '000',
    FR: '112',
    DE: '112',
};

const EmergencyShortcuts = ({ theme }) => {
    const dispatch = useDispatch();
    const currentUserId = useSelector((state) => state.auth.user?.id);
    const { contacts = [] } = useSelector((state) => state.emergency);
    const [expanded, setExpanded] = useState({});
    const [pulse] = useState(new Animated.Value(1));
    const [modalVisible, setModalVisible] = useState(false);
    const [smsModalVisible, setSmsModalVisible] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [defaultNumber, setDefaultNumber] = useState('911');
    const [confirmRemoveVisible, setConfirmRemoveVisible] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);

    useEffect(() => {
        startPulse();
        if (currentUserId) {
            dispatch(fetchEmergencyContacts(currentUserId));
        }
        determineEmergencyNumber();
    }, [currentUserId]);

    const determineEmergencyNumber = async () => {
        try {
            const network = await Network.getNetworkStateAsync();
            if (network.isInternetReachable) {
                const { status } =
                    await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({});
                    const places = await Location.reverseGeocodeAsync(
                        loc.coords
                    );
                    const code = places[0]?.isoCountryCode;
                    if (code && COUNTRY_NUMBERS[code]) {
                        setDefaultNumber(COUNTRY_NUMBERS[code]);
                        return;
                    }
                }
            }
            const region = Localization.region;
            setDefaultNumber(COUNTRY_NUMBERS[region] || '911');
        } catch (err) {
            const region = Localization.region;
            setDefaultNumber(COUNTRY_NUMBERS[region] || '911');
        }
    };

    const EMERGENCY_SERVICES = [
        {
            label: 'Police',
            icon: 'shield',
            colorKey: 'error',
            description: 'Contact law enforcement for immediate safety.',
            mapQuery: 'Police Station',
            presetMessages: [
                'Help! I’m in danger. Please send police.',
                'Urgent! Police needed immediately.',
                'Emergency: I feel unsafe and need help now.',
            ],
        },
        {
            label: 'Fire',
            icon: 'flame',
            colorKey: 'warning',
            description: 'Reach fire services in case of fire or gas hazards.',
            mapQuery: 'Fire Station',
            presetMessages: [
                'There’s a fire! I need help.',
                'Smoke detected, please send fire service.',
                'Emergency: Fire hazard at my location.',
            ],
        },
        {
            label: 'Medical',
            icon: 'medkit',
            colorKey: 'success',
            description: 'Call emergency medical responders for health crises.',
            mapQuery: 'Hospital',
            presetMessages: [
                'Medical emergency! Please assist.',
                'I need an ambulance immediately.',
                'Health emergency, urgent care needed.',
            ],
        },
    ];

    const toggle = (label) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1.15,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const openMapWithQuery = (query) => {
        const url = Platform.select({
            ios: `http://maps.apple.com/?q=${query}`,
            android: `geo:0,0?q=${query}`,
        });
        Linking.openURL(url).catch(() =>
            Alert.alert('Error', 'Could not open maps.')
        );
    };

    const sendSMS = (number, message) => {
        Linking.openURL(
            `sms:${number}?body=${encodeURIComponent(message)}`
        ).catch(() => Alert.alert('Error', 'Could not open messaging app.'));
    };

    const handleShareLocation = async (number) => {
        try {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission denied',
                    'Location permission is required.'
                );
                return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            const message = `Emergency! My location: https://www.google.com/maps?q=${loc.coords.latitude},${loc.coords.longitude}`;
            sendSMS(number, message);
        } catch {
            Alert.alert('Error', 'Could not get your location.');
        }
    };

    const handleAddContact = async (contact) => {
        try {
            const formattedContact = {
                user_id: parseInt(currentUserId, 10),
                name: contact.name,
                phone_number: contact.number,
            };
            await dispatch(addEmergencyContact(formattedContact)).unwrap();
            dispatch(fetchEmergencyContacts(currentUserId));
        } catch (err) {
            Alert.alert('Error', err || 'Could not add contact');
        }
        setModalVisible(false);
    };

    const handleOpenSmsModal = (service) => {
        setSelectedService(service);
        setSmsModalVisible(true);
    };

    const handleRemoveContact = async () => {
        try {
            await dispatch(deleteEmergencyContact(selectedContact.id)).unwrap();
            dispatch(fetchEmergencyContacts(currentUserId));
        } catch (err) {
            Alert.alert('Error', err || 'Could not delete contact');
        }
        setConfirmRemoveVisible(false);
        setSelectedContact(null);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.card }]}>
            <Text style={[styles.title, { color: theme.title }]}>
                🚨 Emergency Quick Access
            </Text>

            {EMERGENCY_SERVICES.map((service) => (
                <TouchableOpacity
                    key={service.label}
                    onPress={() => toggle(service.label)}
                    activeOpacity={0.9}
                    style={[
                        styles.serviceCard,
                        {
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                            shadowColor: theme.cardShadow,
                        },
                    ]}
                >
                    <View style={styles.headerRow}>
                        <Ionicons
                            name={service.icon}
                            size={22}
                            color={theme[service.colorKey]}
                            style={{ marginRight: 10 }}
                        />
                        <Text style={[styles.label, { color: theme.text }]}>
                            {service.label}
                        </Text>
                        <TouchableOpacity
                            onPress={() =>
                                Linking.openURL(`tel:${defaultNumber}`)
                            }
                        >
                            <Animated.View
                                style={[
                                    styles.callBtn,
                                    {
                                        transform: [{ scale: pulse }],
                                        backgroundColor:
                                            theme.buttonPrimaryBackground +
                                            '22',
                                    },
                                ]}
                            >
                                <Ionicons
                                    name='call'
                                    size={18}
                                    color={theme.buttonPrimaryBackground}
                                />
                            </Animated.View>
                        </TouchableOpacity>
                        <Ionicons
                            name={
                                expanded[service.label]
                                    ? 'chevron-up'
                                    : 'chevron-down'
                            }
                            size={20}
                            color={theme.icon}
                            style={{ marginLeft: 10 }}
                        />
                    </View>

                    {expanded[service.label] && (
                        <>
                            <Text
                                style={[
                                    styles.description,
                                    { color: theme.text },
                                ]}
                            >
                                {service.description}
                            </Text>
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    onPress={() =>
                                        openMapWithQuery(service.mapQuery)
                                    }
                                    style={[
                                        styles.actionBtn,
                                        {
                                            backgroundColor:
                                                theme.successBackground,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name='location'
                                        size={18}
                                        color={theme.success}
                                    />
                                    <Text
                                        style={[
                                            styles.actionText,
                                            { color: theme.actionText },
                                        ]}
                                    >
                                        Locate
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleOpenSmsModal(service)}
                                    style={[
                                        styles.actionBtn,
                                        {
                                            backgroundColor:
                                                theme.warningBackground,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name='chatbubble'
                                        size={18}
                                        color={theme.warning}
                                    />
                                    <Text
                                        style={[
                                            styles.actionText,
                                            { color: theme.actionText },
                                        ]}
                                    >
                                        Text
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </TouchableOpacity>
            ))}

            {/* Custom Contacts */}
            {contacts.map(({ id, name, phone_number }) => (
                <TouchableOpacity
                    key={`${id}-${phone_number}`}
                    onLongPress={() => {
                        setSelectedContact({ id, name });
                        setConfirmRemoveVisible(true);
                    }}
                    style={[
                        styles.serviceCard,
                        {
                            backgroundColor: theme.background,
                            borderColor: theme.primary,
                        },
                    ]}
                >
                    <View style={styles.headerRow}>
                        <Ionicons
                            name='person'
                            size={22}
                            color={theme.primary}
                            style={{ marginRight: 10 }}
                        />
                        <Text style={[styles.label, { color: theme.text }]}>
                            {name}
                        </Text>
                        <TouchableOpacity
                            onPress={() =>
                                Linking.openURL(`tel:${phone_number}`)
                            }
                        >
                            <Animated.View
                                style={[
                                    styles.callBtn,
                                    {
                                        backgroundColor: theme.success,
                                        transform: [{ scale: pulse }],
                                    },
                                ]}
                            >
                                <Ionicons
                                    name='call'
                                    size={18}
                                    color={theme.buttonSecondaryText}
                                />
                            </Animated.View>
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={[
                            styles.description,
                            { color: theme.text, marginTop: 8 },
                        ]}
                    >
                        {phone_number}
                    </Text>
                </TouchableOpacity>
            ))}

            {/* Confirmation Modal */}
            <ConfirmationModal
                visible={confirmRemoveVisible}
                onClose={() => setConfirmRemoveVisible(false)}
                onConfirm={handleRemoveContact}
                title={`Remove "${selectedContact?.name}"?`}
                description='This contact will be removed from your emergency list.'
                confirmLabel='Remove'
                cancelLabel='Cancel'
                theme={theme}
                icon='trash'
            />

            {/* Add Contact */}
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
                style={[
                    styles.serviceCard,
                    {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 8,
                    },
                ]}
            >
                <Ionicons
                    name='add-circle-outline'
                    size={20}
                    color={theme.link}
                />
                <Text
                    style={[
                        styles.label,
                        { color: theme.link, textAlign: 'center' },
                    ]}
                >
                    Add Another Emergency Contact
                </Text>
            </TouchableOpacity>

            {/* Modal with KeyboardAvoidingView */}
            <Modal
                visible={modalVisible}
                transparent
                animationType='slide'
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <AddContactModal
                            visible={modalVisible}
                            onClose={() => setModalVisible(false)}
                            onAdd={handleAddContact}
                            theme={theme}
                        />
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* SMS Preset Modal */}
            <Modal
                visible={smsModalVisible}
                transparent
                animationType='fade'
                onRequestClose={() => setSmsModalVisible(false)}
            >
                <Pressable
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.4)',
                    }}
                    onPress={() => setSmsModalVisible(false)}
                >
                    <View
                        style={{
                            backgroundColor: theme.surface,
                            padding: 20,
                            borderRadius: 12,
                            width: 280,
                        }}
                    >
                        {selectedService?.presetMessages.map((msg) => (
                            <TouchableOpacity
                                key={msg} // ✅ Updated for unique key warning
                                style={{ paddingVertical: 10 }}
                                onPress={() => {
                                    sendSMS(defaultNumber, msg);
                                    setSmsModalVisible(false);
                                }}
                            >
                                <Text
                                    style={{
                                        color: theme.text,
                                        fontFamily: 'Poppins',
                                    }}
                                >
                                    {msg}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={{ paddingVertical: 10 }}
                            onPress={() => {
                                handleShareLocation(defaultNumber);
                                setSmsModalVisible(false);
                            }}
                        >
                            <Text
                                style={{
                                    color: theme.link,
                                    fontFamily: 'PoppinsBold',
                                }}
                            >
                                📍 Send My Location
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        borderRadius: 12,
        padding: 16,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
        marginBottom: 16,
        textAlign: 'center',
    },
    serviceCard: {
        marginBottom: 12,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Poppins',
        fontWeight: '500',
    },
    callBtn: {
        padding: 6,
        borderRadius: 6,
    },
    description: {
        fontSize: 14,
        fontFamily: 'Poppins',
        lineHeight: 20,
        marginTop: 10,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 6,
        gap: 6,
        flex: 0.48,
    },
    actionText: {
        fontSize: 13,
        fontFamily: 'Poppins',
    },
});

export default EmergencyShortcuts;
