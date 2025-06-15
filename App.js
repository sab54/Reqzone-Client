import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useEffect, useState, useRef } from 'react';
import {
    ActivityIndicator,
    View,
    Dimensions,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated,
    Pressable,
    Text,
    Easing,
    Platform,
} from 'react-native';
import {
    NavigationContainer,
    DefaultTheme,
    DarkTheme,
    useNavigationContainerRef,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    Poppins_400Regular,
    Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
    SafeAreaProvider,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './src/store';
import {
    loadThemeFromStorage,
    applyThemeMode,
} from './src/store/actions/themeActions';
import { logout, updateUserLocation } from './src/store/actions/loginActions';
import { ChatProvider } from './src/context/ChatContext';

// Login and Registration Screens
import LoginScreen from './src/screens/LoginScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';

// Home Screen
import HomeScreen from './src/screens/HomeScreen';

// Games, Tasks, Quiz Screens
import TasksScreen from './src/screens/Games/TasksScreen';
import QuizScreen from './src/screens/Games/QuizScreen';
import BadgesScreen from './src/screens/Games/BadgesScreen';

// Alerts Screens
import AlertsScreen from './src/screens/AlertsScreen';

// More Screens
import ResourcesScreen from './src/screens/ResourcesScreen';

// Chats Screens
import ChatScreen from './src/screens/Chat/ChatScreen';
import ChatRoomScreen from './src/screens/Chat/ChatRoomScreen';
import AddPeopleScreen from './src/screens/Chat/AddPeopleScreen';

import SettingsScreen from './src/screens/SettingsScreen';

const { width: screenWidth } = Dimensions.get('window');
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const icons = {
    Home: 'home',
    Tasks: 'checkbox',
    Alerts: 'notifications',
    Resources: 'document-text',
    Chat: 'chatbubble-ellipses',
};

const TabNavigator = ({ navigationRef }) => {
    const themeState = useSelector((state) => state.theme);
    const authState = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-240)).current;
    const [modalVisible, setModalVisible] = useState(false);

    const { themeColors, isDarkMode } = themeState;
    const { user } = authState;
    const styles = createStyles(themeColors);

    const openModal = () => {
        setModalVisible(true);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
            }),
        ]).start();
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -240,
                duration: 200,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start(() => setModalVisible(false));
    };

    return (
        <Tab.Navigator
            initialRouteName='Home'
            screenOptions={({ route, navigation }) => ({
                headerShown: true,
                tabBarIcon: ({ color, size }) => (
                    <Ionicons
                        name={icons[route.name]}
                        size={size}
                        color={color}
                    />
                ),
                tabBarActiveTintColor: themeColors.link,
                tabBarInactiveTintColor: themeColors.text,
                headerStyle: {
                    backgroundColor: themeColors.headerBackground,
                    shadowColor: 'transparent',
                },
                tabBarStyle: {
                    backgroundColor: themeColors.card,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    height: Platform.OS === 'ios' ? 80 : 70,
                    paddingBottom:
                        Platform.OS === 'ios' ? 20 : 40 + insets.bottom,
                    paddingTop: 10,
                    paddingHorizontal: 16,
                    borderTopWidth: 0,
                    elevation: 10,
                },
                headerLeft: () => (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginLeft: 15,
                        }}
                    >
                        <TouchableOpacity onPress={openModal}>
                            <Ionicons
                                name='person-circle'
                                size={38}
                                color={themeColors.text}
                            />
                        </TouchableOpacity>
                        <Modal
                            transparent
                            visible={modalVisible}
                            animationType='none'
                        >
                            <Pressable
                                style={{
                                    flex: 1,
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    flexDirection: 'row',
                                }}
                                onPress={closeModal}
                            >
                                <Animated.View
                                    style={[
                                        styles.sidebar,
                                        {
                                            transform: [
                                                { translateX: slideAnim },
                                            ],
                                            paddingTop: insets.top + 20,
                                        },
                                    ]}
                                    onStartShouldSetResponder={() => true}
                                >
                                    <View style={styles.profileHeader}>
                                        <Text
                                            style={[
                                                styles.menuText,
                                                {
                                                    fontWeight: 'bold',
                                                    marginBottom: 4,
                                                    fontSize: 16,
                                                    color: themeColors.title,
                                                },
                                            ]}
                                        >
                                            👋 Welcome,{' '}
                                            {user?.first_name || 'User'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            dispatch(
                                                applyThemeMode(
                                                    isDarkMode
                                                        ? 'light'
                                                        : 'dark'
                                                )
                                            );
                                            closeModal();
                                        }}
                                        style={styles.menuItem}
                                    >
                                        <Feather
                                            name={isDarkMode ? 'sun' : 'moon'}
                                            size={18}
                                            color={themeColors.text}
                                        />
                                        <Text style={styles.menuText}>
                                            {isDarkMode
                                                ? 'Switch to Light Mode'
                                                : 'Switch to Dark Mode'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            closeModal();
                                            navigation.navigate('Settings');
                                        }}
                                        style={styles.menuItem}
                                    >
                                        <Ionicons
                                            name='settings-outline'
                                            size={18}
                                            color={themeColors.text}
                                        />
                                        <Text style={styles.menuText}>
                                            Settings
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            dispatch(logout());
                                            closeModal();
                                        }}
                                        style={styles.menuItem}
                                    >
                                        <Ionicons
                                            name='log-out-outline'
                                            size={18}
                                            color={themeColors.error || 'red'}
                                        />
                                        <Text
                                            style={[
                                                styles.menuText,
                                                {
                                                    color:
                                                        themeColors.error ||
                                                        'red',
                                                },
                                            ]}
                                        >
                                            Logout
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            </Pressable>
                        </Modal>
                    </View>
                ),
                headerRight: () => null,
            })}
        >
            <Tab.Screen name='Alerts' component={AlertsScreen} />
            <Tab.Screen name='Chat' component={ChatScreen} />
            <Tab.Screen name='Home' component={HomeScreen} />
            <Tab.Screen name='Tasks' component={TasksScreen} />
            <Tab.Screen name='Resources' component={ResourcesScreen} />
        </Tab.Navigator>
    );
};

const AppNavigation = ({ navigationRef }) => {
    const { isDarkMode } = useSelector((state) => state.theme);
    const { user } = useSelector((state) => state.auth);

    return (
        <NavigationContainer
            ref={navigationRef}
            theme={isDarkMode ? DarkTheme : DefaultTheme}
        >
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <>
                        <Stack.Screen name='Login' component={LoginScreen} />
                        <Stack.Screen
                            name='Registration'
                            component={RegistrationScreen}
                        />
                        <Stack.Screen
                            name='OTPVerification'
                            component={OTPVerificationScreen}
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen
                            name='MainTabs'
                            component={TabNavigator}
                        />
                        <Stack.Screen
                            name='ChatRoom'
                            component={ChatRoomScreen}
                        />
                        <Stack.Screen
                            name='AddPeopleScreen'
                            component={AddPeopleScreen}
                        />
                        <Stack.Screen
                            name='Settings'
                            component={SettingsScreen}
                        />
                        <Stack.Screen name='Quiz' component={QuizScreen} />
                        <Stack.Screen
                            name='BadgesScreen'
                            component={BadgesScreen}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const MainApp = () => {
    const dispatch = useDispatch();
    const navigationRef = useNavigationContainerRef();
    const { user } = useSelector((state) => state.auth);
    const [fontsLoaded] = useFonts({
        Poppins: Poppins_400Regular,
        PoppinsBold: Poppins_700Bold,
    });
    const [isSplashReady, setSplashReady] = useState(false);

    useEffect(() => {
        const prepare = async () => {
            dispatch(loadThemeFromStorage());
            await SplashScreen.preventAutoHideAsync();
            setSplashReady(true);
        };
        prepare();
    }, [dispatch]);

    useEffect(() => {
        if (fontsLoaded && isSplashReady) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, isSplashReady]);

    useEffect(() => {
        if (!user && navigationRef.isReady()) {
            navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
    }, [user, navigationRef]);

    // 🌍 Update user location using expo-location
    useEffect(() => {
        let locationSubscription = null;
        const startLocationUpdates = async () => {
            if (user) {
                const { status } =
                    await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.warn('Permission to access location was denied');
                    return;
                }

                locationSubscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 10000,
                        distanceInterval: 50,
                    },
                    (location) => {
                        const { latitude, longitude } = location.coords;
                        dispatch(
                            updateUserLocation({
                                userId: user.id,
                                latitude,
                                longitude,
                            })
                        );
                    }
                );
            }
        };
        startLocationUpdates();
        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, [user]);

    if (!fontsLoaded || !isSplashReady) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <ActivityIndicator size='large' color='#999' />
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AppNavigation navigationRef={navigationRef} />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
};

export default function App() {
    return (
        <Provider store={store}>
            <ChatProvider>
                <MainApp />
            </ChatProvider>
        </Provider>
    );
}

const createStyles = (themeColors) =>
    StyleSheet.create({
        sidebar: {
            width: screenWidth * 0.8,
            height: '100%',
            backgroundColor: themeColors.surface,
            paddingHorizontal: 20,
            paddingVertical: 20,
            paddingBottom: 20,
            elevation: 12,
            zIndex: 1000,
            shadowColor: themeColors.shadow,
        },
        profileHeader: {
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: themeColors.divider,
            marginBottom: 8,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
        },
        menuText: {
            marginLeft: 12,
            fontFamily: 'Poppins',
            fontSize: 14,
            lineHeight: 20,
            color: themeColors.text,
        },
    });
