// src/screens/ResourcesScreen.js
/**
 * ResourcesScreen.js
 *
 * Purpose:
 * Screen providing quick access to emergency shortcuts and user documents,
 * wrapped with pull-to-refresh behavior and a persistent footer.
 *
 * Key Responsibilities:
 * - **Font Loading**: Uses `expo-font` to load "Poppins" / "PoppinsBold".
 *   Shows an ActivityIndicator + "Loading fonts..." until loaded.
 * - **Pull-to-Refresh**: Implements `RefreshControl` on FlatList. On refresh,
 *   sets `refreshing=true`, then clears it after 1 second (dummy behavior).
 * - **Header/Footer Composition**:
 *   - `EmergencyShortcuts` module
 *   - `DocumentsScreen` module
 *   - `Footer` component (always at the bottom)
 * - **Styling**: Reads `theme.themeColors` for palette. Fallback primary
 *   color: `theme.primary || theme.info || '#0078D4'`.
 *
 * Rendering Guarantees:
 * - Shows centered loading state until fonts load.
 * - Once fonts loaded, renders a FlatList with:
 *   - Header: EmergencyShortcuts + DocumentsScreen
 *   - Footer: Footer component
 *
 * Store Contracts:
 * - Reads `theme.themeColors` from Redux.
 *
 * Author: Sunidhi Abhange
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    FlatList,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFonts } from 'expo-font';

import EmergencyShortcuts from '../module/EmergencyShortcuts';
import DocumentsScreen from '../module/DocumentsScreen';
import Footer from '../components/Footer';

const ResourcesScreen = () => {
    const theme = useSelector((state) => state.theme.themeColors);
    const [fontsLoaded] = useFonts({
        Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
        PoppinsBold: require('../assets/fonts/Poppins-Bold.ttf'),
    });

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    const styles = createStyles(theme);
    const primaryColor = theme.primary || theme.info || '#0078D4';

    if (!fontsLoaded) {
        return (
            <View
                style={[styles.centered, { backgroundColor: theme.background }]}
            >
                <ActivityIndicator size='large' color={primaryColor} />
                <Text style={styles.loadingText}>Loading fonts...</Text>
            </View>
        );
    }

    // Dummy data to enable FlatList (we only use the header/footer here)
    const DATA = [{ key: 'content' }];

    return (
        <FlatList
            data={DATA}
            keyExtractor={(item) => item.key}
            renderItem={null}
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[primaryColor]}
                    tintColor={primaryColor}
                />
            }
            ListHeaderComponent={
                <>
                    <EmergencyShortcuts theme={theme} />
                    <DocumentsScreen theme={theme} />
                </>
            }
            ListFooterComponent={<Footer theme={theme} />}
        />
    );
};

const createStyles = (theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        content: {
            padding: 20,
            paddingBottom: 100,
        },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        loadingText: {
            marginTop: 10,
            fontSize: 16,
            fontFamily: 'Poppins',
            color: theme.text,
        },
    });

export default ResourcesScreen;
