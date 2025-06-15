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
