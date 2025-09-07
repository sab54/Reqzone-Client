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

import {
    fetchWeatherData,
    fetchForecastData,
} from '../store/actions/weatherActions';

// Modules
import WeatherCard from '../module/WeatherCard';
import NewsAndBookmarks from '../module/NewsAndBookmarks';

// Components
import Footer from '../components/Footer';

const preparednessProgressData = {
    Kit: {
        totalTasks: 5,
        completedTasks: 3,
        priority: 'High',
        dueDate: '2025-12-12',
        description: 'Complete your emergency kit with essential items.',
    },
    Plan: {
        totalTasks: 4,
        completedTasks: 2,
        priority: 'Medium',
        dueDate: '2025-10-10',
        description: 'Create a detailed emergency plan for your family.',
    },
    Quiz: {
        totalTasks: 1,
        completedTasks: 1,
        priority: 'Low',
        dueDate: '2025-06-20',
        description:
            'Take the emergency preparedness quiz to test your knowledge.',
    },
    Contact: {
        totalTasks: 3,
        completedTasks: 0,
        priority: 'Low',
        dueDate: '2025-08-15',
        description: 'Update your emergency contact list.',
    },
    Drill: {
        totalTasks: 2,
        completedTasks: 1,
        priority: 'Medium',
        dueDate: '2025-09-01',
        description:
            'Conduct a family emergency drill to practice evacuation plans.',
    },
    Emergency: {
        totalTasks: 2,
        completedTasks: 1,
        priority: 'High',
        dueDate: '2025-07-25',
        description:
            'Ensure you have emergency services contacts and a first aid kit.',
    },
    Safety: {
        totalTasks: 3,
        completedTasks: 2,
        priority: 'Medium',
        dueDate: '2025-11-15',
        description:
            'Review safety measures and ensure your home is disaster-proof.',
    },
    Evacuation: {
        totalTasks: 4,
        completedTasks: 1,
        priority: 'High',
        dueDate: '2025-12-01',
        description: 'Prepare an evacuation plan for your family and pets.',
    },
};

const HomeScreen = () => {
    const dispatch = useDispatch();
    const theme = useSelector((state) => state.theme.themeColors);
    const insets = useSafeAreaInsets(); // Safe area inset for padding

    const {
        current: weatherData,
        forecast: forecastData,
        loading: loadingWeather,
        error,
    } = useSelector((state) => state.weather);

    const [refreshing, setRefreshing] = useState(false);

    const [fontsLoaded] = useFonts({
        Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
    });

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([
            dispatch(fetchWeatherData()),
            dispatch(fetchForecastData()),
        ]).finally(() => {
            setTimeout(() => setRefreshing(false), 1000);
        });
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchWeatherData());
        dispatch(fetchForecastData());
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
            key: 'header',
            render: () => (
                <View style={styles.headerWrapper}>
                    <Text style={styles.headerText}>
                        <Text style={{ color: '#DB4437' }}>Res</Text>
                        <Text style={{ color: '#4285F4' }}>Q</Text>
                        <Text style={{ color: '#0F9D58' }}>Zone-Sunidhi</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        <Text style={{ color: '#DB4437' }}>Respond</Text>
                        <Text style={{ color: theme.text }}>. </Text>
                        <Text style={{ color: '#4285F4' }}>Prepare</Text>
                        <Text style={{ color: theme.text }}>. </Text>
                        <Text style={{ color: '#0F9D58' }}>StaySafe</Text>
                    </Text>
                </View>
            ),
        },
        {
            key: 'weather',
            render: () => (
                <View style={styles.blockSpacing}>
                    <WeatherCard
                        weatherData={weatherData}
                        forecastData={forecastData}
                        loadingWeather={loadingWeather}
                        theme={theme}
                    />
                </View>
            ),
        },
        {
            key: 'news',
            render: () => (
                <View style={styles.blockSpacing}>
                    <NewsAndBookmarks theme={theme} />
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
            fontFamily: 'PoppinsBold',
            textAlign: 'center',
        },
        subtitle: {
            fontSize: 16,
            marginTop: 1,
            opacity: 0.7,
            fontFamily: 'PoppinsBold',
            textAlign: 'center',
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

export default HomeScreen;
