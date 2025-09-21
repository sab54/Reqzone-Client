/**
 * Tabs.js
 *
 * A lightweight, customizable tab bar component with an animated underline indicator.
 * Designed for React Native + Expo apps, it allows users to switch between different
 * sections via horizontal tabs.
 *
 * Key Functionalities:
 * - **Render Tabs**: Displays each tab from the `tabs` prop, supporting labels and disabled states.
 * - **Selection & Callback**: Calls `onTabSelect(key)` when a tab is pressed, unless disabled.
 * - **Animated Indicator**: Uses `Animated.spring` to smoothly move an underline indicator
 *   beneath the active tab.
 * - **Responsive Layout**: On layout, dynamically calculates tab width based on container width
 *   and number of tabs to size and position the indicator correctly.
 * - **Scrollable Mode**: When `scrollable` is true, wraps tabs in a horizontal `ScrollView`
 *   for variable-width tabs; otherwise lays them out evenly.
 *
 * Props:
 * - `tabs` (Array<{ key: string, label: string, disabled?: boolean }>)
 *   List of tab definitions, each with a unique key and label.
 * - `selectedTab` (string)
 *   The key of the currently selected tab.
 * - `onTabSelect` (function)
 *   Callback invoked with a tab’s key when pressed.
 * - `theme` (object, optional)
 *   Provides colors and styles:
 *     - `primary`: selected tab text & indicator color
 *     - `text`: unselected tab text color
 *     - `muted`: disabled tab text color
 *     - `surface`: background color of the tab row
 *     - `border`: bottom border color of the tab row
 * - `scrollable` (boolean, default: false)
 *   Enables horizontal scrolling for the tab row.
 * - `indicatorColor` (string, optional)
 *   Overrides the underline indicator color. Defaults to `theme.primary` or `#4B7BE5`.
 *
 * Animation Flow:
 * 1. Compute selected tab index from `tabs` and `selectedTab`.
 * 2. Run `Animated.spring(indicatorAnim, { toValue: index, useNativeDriver: false })`.
 * 3. Interpolate `indicatorAnim` to map to horizontal `translateX` of the indicator.
 *
 * Accessibility:
 * - Each tab is rendered as a `TouchableOpacity` with `accessibilityRole="button"`
 *   and appropriate `accessibilityState` (selected/disabled).
 *
 * Author: Sunidhi Abhange
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Animated,
    ScrollView,
} from 'react-native';

const Tabs = ({
    tabs,
    selectedTab,
    onTabSelect,
    theme = {},
    scrollable = false,
    indicatorColor = theme?.primary || '#4B7BE5',
}) => {
    const indicatorAnim = useRef(new Animated.Value(0)).current;
    const containerWidth = useRef(0);
    const [tabWidth, setTabWidth] = useState(0);

    const handleLayout = (e) => {
        const width = e.nativeEvent.layout.width;
        containerWidth.current = width;
        setTabWidth(width / tabs.length);
    };

    useEffect(() => {
        const index = tabs.findIndex((tab) => tab.key === selectedTab);
        if (index !== -1) {
            Animated.spring(indicatorAnim, {
                toValue: index,
                useNativeDriver: false,
                speed: 20,
                bounciness: 8,
            }).start();
        }
    }, [selectedTab, tabs]);

    const renderTabs = () =>
        tabs.map((tab, index) => {
            const isSelected = selectedTab === tab.key;
            const isDisabled = tab.disabled;

            return (
                <TouchableOpacity
                    key={tab.key}
                    style={styles.tabItem}
                    onPress={() => !isDisabled && onTabSelect(tab.key)}
                    activeOpacity={isDisabled ? 1 : 0.8}
                    accessibilityRole='button'
                    accessibilityState={{
                        selected: isSelected,
                        disabled: isDisabled,
                    }}
                >
                    <Text
                        style={[
                            styles.tabText,
                            {
                                color: isDisabled
                                    ? theme.muted || '#999'
                                    : isSelected
                                    ? theme.primary || '#4B7BE5'
                                    : theme.text || '#000',
                                fontWeight: isSelected ? '600' : '500',
                            },
                        ]}
                    >
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            );
        });

    const translateX = indicatorAnim.interpolate({
        inputRange: [0, tabs.length - 1],
        outputRange: [0, tabWidth * (tabs.length - 1)],
    });

    return (
        <View style={styles.wrapper} onLayout={handleLayout}>
            <ScrollView
                horizontal={scrollable}
                contentContainerStyle={[
                    styles.tabRow,
                    {
                        backgroundColor: theme.surface || '#f5f5f5',
                        borderColor: theme.border || '#ddd',
                    },
                ]}
                showsHorizontalScrollIndicator={false}
            >
                {renderTabs()}
                {tabWidth > 0 && (
                    <Animated.View
                        style={[
                            styles.indicator,
                            {
                                width: tabWidth,
                                backgroundColor: indicatorColor,
                                transform: [{ translateX }],
                            },
                        ]}
                    />
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 12,
    },
    tabRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        justifyContent: 'space-around',
        overflow: 'hidden',
        borderRadius: 6,
        position: 'relative',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        minWidth: 80,
    },
    tabText: {
        fontSize: 14,
        fontFamily: 'Poppins',
    },
    indicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        borderRadius: 2,
        left: 0,
    },
});

export default Tabs;
