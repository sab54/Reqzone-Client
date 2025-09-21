/**
 * HorizontalSelector.js
 *
 * What This Component Does:
 * - Renders a horizontally scrollable list of selectable "chips".
 * - Highlights the currently selected item via theme-driven colors.
 * - Invokes `onSelect(item)` when a chip is pressed.
 *
 * Props:
 * - data: Array<any>                     // Items to render. Each item must at least provide a `label` field for display.
 * - selected: any                        // The currently selected item.
 * - onSelect: (item: any) => void        // Callback when an item is pressed.
 * - theme?: {
 *     primary?: string,                  // Background color for selected chip.
 *     surface?: string,                  // Background color for unselected chip.
 *     border?: string,                   // Border color for all chips.
 *     text?: string,                     // Text color for unselected chip.
 *     buttonPrimaryText?: string,        // Text color for selected chip.
 *   }
 * - isEqual?: (a: any, b: any) => boolean  // Equality fn to determine selection (default strict equality).
 * - renderIcon?: (item: any, isSelected: boolean) => React.Node  // Optional icon renderer per chip.
 * - itemKey?: (item: any) => string | number                     // Key extractor for React lists (defaults to the item itself).
 *
 * Behavior:
 * - Selected chip uses `{ backgroundColor: theme.primary, color: theme.buttonPrimaryText, fontWeight: '600' }`.
 * - Unselected chip uses `{ backgroundColor: theme.surface, color: theme.text, fontWeight: '500' }`.
 * - Scrolls horizontally without a scrollbar; spacing and rounded corners applied for chip look.
 *
 * Notes:
 * - No testIDs are required; tests should query by visible label text and inspect styles.
 * - Ensure Poppins font is loaded in the app if using custom fonts.
 *
 * Author: Sunidhi Abhange
 */

import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

const HorizontalSelector = ({
    data = [],
    selected,
    onSelect,
    theme = {},
    isEqual = (a, b) => a === b,
    renderIcon,
    itemKey = (item) => item,
}) => {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
        >
            {data.map((item) => {
                const isSelected = isEqual(item, selected);
                return (
                    <TouchableOpacity
                        key={itemKey(item)}
                        onPress={() => onSelect(item)}
                        style={[
                            styles.item,
                            {
                                backgroundColor: isSelected
                                    ? theme.primary || '#4B7BE5'
                                    : theme.surface || '#f0f0f0',
                                borderColor: theme.border || '#ddd',
                            },
                        ]}
                    >
                        {renderIcon?.(item, isSelected)}
                        <Text
                            style={[
                                styles.label,
                                {
                                    color: isSelected
                                        ? theme.buttonPrimaryText || '#fff'
                                        : theme.text || '#333',
                                    fontWeight: isSelected ? '600' : '500',
                                },
                            ]}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexDirection: 'row',
        paddingBottom: 8,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    label: {
        marginLeft: 6,
        fontSize: 14,
        fontFamily: 'Poppins',
    },
});

export default HorizontalSelector;
