import React, { useEffect, useState, useCallback } from 'react';
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
    const insets = useSafeAreaInsets(); // Safe area inset for padding

    const [refreshing, setRefreshing] = useState(false);

    const [fontsLoaded] = useFonts({
        Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
    });

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([dispatch(fetchWeatherData())]).finally(() => {
            setTimeout(() => setRefreshing(false), 1000);
        });
    }, [dispatch]);

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
            refreshing={refreshing}
            onRefresh={onRefresh}
        />
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
        headerWrapper: {
            alignItems: 'center',
            marginBottom: 24,
        },
        headerText: {
            fontSize: 26,
            fontWeight: '700',
            fontFamily: 'Poppins',
        },
        subtitle: {
            fontSize: 14,
            marginTop: 6,
            opacity: 0.7,
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
