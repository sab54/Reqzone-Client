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
