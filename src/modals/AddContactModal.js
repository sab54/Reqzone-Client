import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    FlatList,
} from 'react-native';
import Modal from 'react-native-modal';
import * as Contacts from 'expo-contacts';
import { Feather } from '@expo/vector-icons';

const AddContactModal = ({ visible, onClose, onAdd, theme }) => {
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [contacts, setContacts] = useState([]);
    const [showList, setShowList] = useState(false);

    const styles = createStyles(theme);

    useEffect(() => {
        if (visible) {
            fetchContacts();
        }
    }, [visible]);

    const fetchContacts = async () => {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.PhoneNumbers],
            });

            const filtered = data
                .filter((c) => c.name && c.phoneNumbers?.length > 0)
                .map((c) => ({
                    name: c.name,
                    number: c.phoneNumbers[0].number,
                }));

            setContacts(filtered);
        } else {
            Alert.alert('Permission Denied', 'Cannot access contacts.');
        }
    };

    const handleAdd = () => {
        const trimmedName = name.trim();
        const trimmedNumber = number.trim();

        if (!trimmedName || !trimmedNumber) {
            Alert.alert('Missing Info', 'Please enter both name and number.');
            return;
        }

        if (!/^[\d+\-()\s]{7,}$/.test(trimmedNumber)) {
            Alert.alert('Invalid Number', 'Please enter a valid phone number.');
            return;
        }

        onAdd({ name: trimmedName, number: trimmedNumber });
        setName('');
        setNumber('');
        setShowList(false);
        onClose();
    };

    const selectFromContact = (contact) => {
        setName(contact.name);
        setNumber(contact.number);
        setShowList(false);
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

                <Text style={styles.title}>Add Emergency Contact</Text>

                <TouchableOpacity
                    style={styles.selectBtn}
                    onPress={() => setShowList(!showList)}
                >
                    <Text style={styles.selectBtnText}>
                        {showList ? 'Hide Contact List' : 'Pick from Contacts'}
                    </Text>
                </TouchableOpacity>

                {showList && (
                    <FlatList
                        data={contacts}
                        keyExtractor={(item, index) =>
                            `${item.number}-${index}`
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.contactItem}
                                onPress={() => selectFromContact(item)}
                            >
                                <Text style={styles.contactName}>
                                    {item.name}
                                </Text>
                                <Text style={styles.contactNumber}>
                                    {item.number}
                                </Text>
                            </TouchableOpacity>
                        )}
                        style={{ maxHeight: 250 }}
                    />
                )}

                <TextInput
                    placeholder='Name'
                    placeholderTextColor={theme.placeholder}
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                />

                <TextInput
                    placeholder='Phone Number'
                    placeholderTextColor={theme.placeholder}
                    keyboardType='phone-pad'
                    value={number}
                    onChangeText={setNumber}
                    style={styles.input}
                />

                <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                    <Text style={styles.addText}>Save Contact</Text>
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
            maxHeight: '90%',
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
        addButton: {
            backgroundColor: theme.link,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
        },
        addText: {
            color: '#fff',
            fontFamily: 'PoppinsBold',
            fontSize: 15,
        },
        selectBtn: {
            marginBottom: 12,
            paddingVertical: 10,
            alignItems: 'center',
            backgroundColor: theme.input,
            borderRadius: 8,
        },
        selectBtnText: {
            fontFamily: 'Poppins',
            color: theme.link,
        },
        contactItem: {
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: theme.border,
        },
        contactName: {
            fontFamily: 'PoppinsBold',
            fontSize: 15,
            color: theme.text,
        },
        contactNumber: {
            fontFamily: 'Poppins',
            fontSize: 13,
            color: theme.mutedText,
        },
    });

export default AddContactModal;
