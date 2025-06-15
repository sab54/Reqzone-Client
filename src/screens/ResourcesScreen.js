import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFonts } from 'expo-font';

import EmergencyShortcuts from '../module/EmergencyShortcuts';
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

        // Simulate data re-fetching
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    const styles = createStyles(theme);

    const primaryColor = theme.primary || theme.info || '#0078D4'; // Fallback for missing primary

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

    return (
        <ScrollView
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
        >
            <Text style={styles.title}>📚 Emergency Resources</Text>

            <EmergencyShortcuts theme={theme} />

            <Footer theme={theme} />
        </ScrollView>
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
        title: {
            fontSize: 24,
            fontFamily: 'PoppinsBold',
            marginBottom: 20,
            color: theme.primary || theme.info || '#0078D4', // fallback for title color
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
