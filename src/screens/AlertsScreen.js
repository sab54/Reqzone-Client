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
