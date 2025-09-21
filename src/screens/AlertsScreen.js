/**
 * AlertScreen.js
 *
 * This screen aggregates weather alerts and shows them alongside app footer content.
 * It uses Redux for theme/weather state, Expo Font loading, and SafeAreaInsets for
 * proper padding on different platforms.
 *
 * Key Functionalities:
 * - **Font Loading**: Uses `useFonts` hook to load custom "Poppins" font. Displays a
 *   loading spinner + message until fonts are ready.
 * - **Weather Data Fetching**: Dispatches `fetchWeatherData` once on mount to refresh
 *   weather state in Redux.
 * - **Dynamic Theming**: Reads theme colors from Redux state to style text, background,
 *   and error messages consistently.
 * - **Error Handling**: If the weather state contains an error, displays an error block
 *   with warning icon and message.
 * - **Content Blocks via FlatList**:
 *   1. **Alert Module** – Renders the main `Alert` component (alert list, tabs, etc.).
 *   2. **Error Block** – Only included if there is a weather fetch error.
 *   3. **Footer** – Always included at the bottom of the list.
 * - **Safe Area Insets**: Applies proper bottom padding for iOS/Android navigation bars.
 *
 * Component Flow:
 * 1. Load custom font → if not ready, show loading spinner.
 * 2. On mount, dispatch weather fetch action.
 * 3. Build `contentBlocks` array (Alert, Error?, Footer).
 * 4. Render using FlatList for scrollable layout.
 *
 * Notes:
 * - The FlatList ensures flexible rendering of multiple blocks.
 * - Styles dynamically adapt based on current theme and platform insets.
 *
 * Author: [Your Name]
 */

import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { useFonts } from 'expo-font';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Modules
import Alert from '../module/Alert';

// Components
import Footer from '../components/Footer';

// Actions
import { fetchWeatherData } from '../store/actions/weatherActions';

const AlertScreen = () => {
    const dispatch = useDispatch();
    const theme = useSelector((state) => state.theme.themeColors);
    const { error } = useSelector((state) => state.weather);
    const insets = useSafeAreaInsets();

    const [fontsLoaded] = useFonts({
        Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
    });

    useEffect(() => {
        dispatch(fetchWeatherData());
    }, [dispatch]);

    const styles = createStyles(theme, insets);

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

    const contentBlocks = [
        {
            key: 'alert',
            render: () => (
                <View style={styles.blockSpacing}>
                    <Alert theme={theme} />
                </View>
            ),
        },
        ...(error
            ? [
                  {
                      key: 'error',
                      render: () => (
                          <Text
                              style={[
                                  styles.errorText,
                                  { color: theme.danger || 'red' },
                              ]}
                          >
                              ⚠️ Weather fetch failed: {error}
                          </Text>
                      ),
                  },
              ]
            : []),
        {
            key: 'footer',
            render: () => (
                <View style={{ marginTop: 20 }}>
                    <Footer theme={theme} />
                </View>
            ),
        },
    ];

    return (
        <FlatList
            data={contentBlocks}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => item.render()}
            contentContainerStyle={[
                styles.container,
                { backgroundColor: theme.background },
            ]}
            showsVerticalScrollIndicator={false}
        />
    );
};

const createStyles = (theme, insets) =>
    StyleSheet.create({
        container: {
            paddingTop: 20,
            paddingHorizontal: 16,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10 + insets.bottom,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 100,
            backgroundColor: theme.background,
        },
        loadingText: {
            marginTop: 10,
            fontFamily: 'Poppins',
        },
        blockSpacing: {
            marginBottom: 18,
        },
        errorText: {
            fontSize: 14,
            marginTop: 20,
            textAlign: 'center',
            fontFamily: 'Poppins',
        },
    });

export default AlertScreen;
