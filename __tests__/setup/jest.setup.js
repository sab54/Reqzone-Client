// __tests__/setup/jest.setup.js

// Extend Jest with useful matchers for React Native testing
import '@testing-library/jest-native/extend-expect';

// AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// expo-linear-gradient mock -> render children inside a View
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, style, ...rest }) => {
    const React = require('react');
    const { View } = require('react-native');
    return (
      <View style={style} {...rest}>
        {children}
      </View>
    );
  },
}));

// react-native-swiper -> proper stub (supports default export)
jest.mock('react-native-swiper', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Swiper = ({ children, ...rest }) => (
    <View accessibilityLabel="Swiper" {...rest}>
      {children}
    </View>
  );
  Swiper.default = Swiper;
  return Swiper;
});

// react-native-country-codes-picker -> minimal picker
jest.mock('react-native-country-codes-picker', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    CountryPicker: ({ show, pickerButtonOnPress }) =>
      show ? (
        <View testID="mock-country-picker">
          <TouchableOpacity
            testID="mock-country-picker-item"
            onPress={() => pickerButtonOnPress({ dial_code: '+1', code: 'US' })}
          >
            <Text>Mock Country +1</Text>
          </TouchableOpacity>
        </View>
      ) : null,
  };
});

// expo-blur -> stub BlurView
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: ({ children, ...rest }) => <View {...rest}>{children}</View>,
  };
});

// react-native-chart-kit -> stubs
jest.mock('react-native-chart-kit', () => {
  const React = require('react');
  const { View } = require('react-native');
  const makeMock = (name) => {
    const Comp = ({ children, ...rest }) => (
      <View accessibilityLabel={name} {...rest}>
        {children}
      </View>
    );
    Comp.displayName = name;
    return Comp;
  };
  return {
    LineChart: makeMock('LineChart'),
    BarChart: makeMock('BarChart'),
    PieChart: makeMock('PieChart'),
    ProgressChart: makeMock('ProgressChart'),
    ContributionGraph: makeMock('ContributionGraph'),
    StackedBarChart: makeMock('StackedBarChart'),
  };
}, { virtual: true });

// @react-native-community/datetimepicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  const DateTimePicker = ({ children, ...rest }) => (
    <View accessibilityLabel="DateTimePicker" {...rest}>
      {children}
    </View>
  );
  DateTimePicker.default = DateTimePicker;
  DateTimePicker.displayName = 'RNDateTimePicker';
  return DateTimePicker;
}, { virtual: true });

// react-native-vector-icons stubs
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name = 'ion', ...rest }) => <Text {...rest}>{`icon:${name}`}</Text>;
  Icon.loadFont = () => Promise.resolve();
  return Icon;
});
jest.mock('react-native-vector-icons/Feather', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name = 'feather', ...rest }) => <Text {...rest}>{`icon:${name}`}</Text>;
  Icon.loadFont = () => Promise.resolve();
  return Icon;
});

// expo-font stub
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// Make useFocusEffect behave like a simple useEffect in tests
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const React = require('react');
  const useFocusEffect = (effect) => {
    React.useEffect(() => {
      if (typeof effect === 'function') {
        const cleanup = effect();
        return cleanup;
      }
    }, []);
  };
  return {
    ...actual,
    useFocusEffect,
    CommonActions: actual.CommonActions,
  };
});

// expo-image-picker
jest.mock('expo-image-picker', () => {
  const PermissionStatus = {
    UNDETERMINED: 'undetermined',
    GRANTED: 'granted',
    DENIED: 'denied',
  };
  return {
    MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
    PermissionStatus,
    requestMediaLibraryPermissionsAsync: jest
      .fn()
      .mockResolvedValue({ status: PermissionStatus.GRANTED, granted: true }),
    requestCameraPermissionsAsync: jest
      .fn()
      .mockResolvedValue({ status: PermissionStatus.GRANTED, granted: true }),
    launchImageLibraryAsync: jest.fn(async () => ({
      canceled: false,
      assets: [{ uri: 'file:///mock/image.jpg', width: 100, height: 100, type: 'image' }],
    })),
    launchCameraAsync: jest.fn(async () => ({
      canceled: false,
      assets: [{ uri: 'file:///mock/camera.jpg', width: 100, height: 100, type: 'image' }],
    })),
  };
});

// react-native-modal
jest.mock('react-native-modal', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Modal = ({ isVisible, children, ...rest }) =>
    isVisible ? (
      <View accessibilityLabel="RNModal" {...rest}>
        {children}
      </View>
    ) : null;
  Modal.default = Modal;
  return Modal;
});

// expo-localization
jest.mock('expo-localization', () => {
  const mock = {
    locale: 'en-US',
    locales: ['en-US'],
    timezone: 'UTC',
    isRTL: false,
    region: 'US',
    getLocales: () => [{ languageCode: 'en', countryCode: 'US', languageTag: 'en-US', isRTL: false }],
    getCalendars: () => [{ calendar: 'gregorian', timeZone: 'UTC', firstWeekday: 2 }],
    getLocalizationAsync: jest.fn(async () => ({
      locale: 'en-US',
      locales: ['en-US'],
      timezone: 'UTC',
      isRTL: false,
      region: 'US',
    })),
    useLocales: () => [{ languageCode: 'en', countryCode: 'US', languageTag: 'en-US', isRTL: false }],
    useLocalization: () => ({
      locale: 'en-US',
      locales: ['en-US'],
      timezone: 'UTC',
      isRTL: false,
      region: 'US',
    }),
  };
  return mock;
});

// expo-haptics
jest.mock('expo-haptics', () => {
  const mock = {
    ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy', Soft: 'Soft', Rigid: 'Rigid' },
    NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
    SelectionFeedbackType: 'Selection',
    impactAsync: jest.fn(async () => undefined),
    notificationAsync: jest.fn(async () => undefined),
    selectionAsync: jest.fn(async () => undefined),
  };
  return mock;
});

// @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => {
  const listeners = new Set();
  return {
    addEventListener: (fn) => {
      listeners.add(fn);
      fn({ isConnected: true, isInternetReachable: true, type: 'wifi', details: {} });
      return { remove: () => listeners.delete(fn) };
    },
    fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true, type: 'wifi', details: {} })),
    useNetInfo: () => ({ isConnected: true, isInternetReachable: true, type: 'wifi', details: {} }),
  };
});

// Core RN/Expo mocks commonly needed by many tests
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { GestureHandlerRootView: ({ children, ...rest }) => <View {...rest}>{children}</View> };
});
jest.mock('react-native/Libraries/Utilities/Dimensions', () => {
  const actual = jest.requireActual('react-native/Libraries/Utilities/Dimensions');
  const dims = {
    window: { width: 390, height: 844, scale: 2, fontScale: 2 },
    screen: { width: 390, height: 844, scale: 2, fontScale: 2 },
  };
  return {
    ...actual,
    get: (key) => dims[key] || dims.window,
    set: () => {},
    addEventListener: () => ({ remove: () => {} }),
    removeEventListener: () => {},
  };
});
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, bottom: 0, left: 0, right: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  const SafeAreaInsetsContext = React.createContext(insets);
  const SafeAreaFrameContext = React.createContext(frame);
  const SafeAreaProvider = ({ children, initialMetrics }) => {
    const providedInsets = initialMetrics?.insets ?? insets;
    const providedFrame = initialMetrics?.frame ?? frame;
    return (
      <SafeAreaInsetsContext.Provider value={providedInsets}>
        <SafeAreaFrameContext.Provider value={providedFrame}>{children}</SafeAreaFrameContext.Provider>
      </SafeAreaInsetsContext.Provider>
    );
  };
  const SafeAreaView = ({ children, ...props }) => <View {...props}>{children}</View>;
  const useSafeAreaInsets = () => React.useContext(SafeAreaInsetsContext);
  const useSafeAreaFrame = () => React.useContext(SafeAreaFrameContext);
  return {
    SafeAreaProvider,
    SafeAreaView,
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    initialWindowMetrics: { insets, frame },
    useSafeAreaInsets,
    useSafeAreaFrame,
  };
});
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-contacts', () => {
  const React = require('react');
  const { View } = require('react-native');
  const ContactAccessButton = (props) => React.createElement(View, props);
  return {
    ContactAccessButton,
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', granted: true }),
    getContactsAsync: jest.fn().mockResolvedValue({ data: [], hasNextPage: false }),
    addContactAsync: jest.fn(),
    updateContactAsync: jest.fn(),
    removeContactAsync: jest.fn(),
    Fields: {},
  };
});
jest.mock('react-native/Libraries/Utilities/Platform', () => {
  const Platform = jest.requireActual('react-native/Libraries/Utilities/Platform');
  Platform.OS = 'android';
  Platform.select = (objs) => ('android' in objs ? objs.android : objs.default);
  return Platform;
});
jest.mock('@expo-google-fonts/poppins', () => ({
  useFonts: jest.fn(() => [true]),
  Poppins_400Regular: 'Poppins_400Regular',
  Poppins_700Bold: 'Poppins_700Bold',
}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const wrap = (prefix) => ({ name, ...rest }) =>
    <Text accessibilityRole="button" {...rest}>{`${prefix}:${name}`}</Text>;
  return { Ionicons: wrap('ion'), Feather: wrap('feather') };
});
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  Accuracy: { High: 5 },
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
}));

// --- Stable react-redux mock WITH unwrap support on dispatch ---
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  const unwrap = jest.fn().mockResolvedValue({});
  const dispatch = jest.fn(() => ({ unwrap }));
  dispatch.unwrap = unwrap; // allow dispatch.unwrap()
  return {
    ...actual,
    Provider: ({ children }) => children,
    useDispatch: jest.fn(() => dispatch),
    useSelector: jest.fn(),
  };
});

// Silence specific warnings/logs across the suite
let warnSpy;
let logSpy;
beforeAll(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation((msg, ...args) => {
    if (typeof msg === 'string' && msg.includes('The native view manager for module(ExpoContactAccessButton)')) return;
    // pass through others
    // eslint-disable-next-line no-console
    console.info(msg, ...args);
  });

  logSpy = jest.spyOn(console, 'log').mockImplementation((msg, ...args) => {
    if (typeof msg === 'string' && msg.includes('No mood logged today')) return;
    // eslint-disable-next-line no-console
    console.info(msg, ...args);
  });

  const infoSpy = jest.spyOn(console, 'info').mockImplementation((msg, ...args) => {
    if (typeof msg === 'string' && msg.startsWith('todayUnrecovered:')) return;
    // fall through for other info logs
    return jest.requireActual('console').info(msg, ...args);
  });
  // keep a reference if you want to restore later
  global.__infoSpy = infoSpy;
});

afterAll(() => {
  if (warnSpy?.mockRestore) warnSpy.mockRestore();
  if (logSpy?.mockRestore) logSpy.mockRestore();
  if (global.__infoSpy?.mockRestore) global.__infoSpy.mockRestore();
});

// Globally filter noisy console.error messages that spam the runner.
// IMPORTANT: this must be top-level (not inside beforeAll) so it runs
// before test files import modules that may trigger these warnings.
const __realConsoleError = console.error;
console.error = (msg, ...args) => {
  if (
    typeof msg === 'string' &&
    (
      msg.includes('forwardRef render functions accept exactly two parameters') || // forwardRef signature
      msg.includes('not wrapped in act') ||                                       // React act()
      msg.includes('An update to Animated') ||                                    // Animated act noise
      msg.includes('useNativeDriver was not specified') ||                           // RN Animated note
      msg.startsWith('Global alert fetch error:')
    )
  ) {
    return; // suppress only these known-noisy warnings
  }
  __realConsoleError(msg, ...args); // pass through real errors
};


// Tame Animated timing/parallel callbacks during tests to avoid
// "useInsertionEffect must not schedule updates" on unmount.
import { Animated, Easing } from 'react-native';

const realTiming = Animated.timing;
const realParallel = Animated.parallel;

jest.spyOn(Animated, 'timing').mockImplementation((value, config) => {
  // force useNativeDriver: false in tests and wrap start()
  const anim = realTiming(value, { easing: Easing.linear, useNativeDriver: false, ...config });
  const realStart = anim.start?.bind(anim);
  anim.start = (cb) => {
    try { if (typeof cb === 'function') cb({ finished: true }); } catch {}
    return realStart?.(() => {}); // swallow original callback
  };
  return anim;
});

jest.spyOn(Animated, 'parallel').mockImplementation((animations, config) => {
  const anim = realParallel(animations, config);
  const realStart = anim.start?.bind(anim);
  anim.start = (cb) => {
    try { if (typeof cb === 'function') cb({ finished: true }); } catch {}
    return realStart?.(() => {});
  };
  return anim;
});
