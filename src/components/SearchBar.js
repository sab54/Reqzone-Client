// Client/src/components/SearchBar.js
/**
 * SearchBar
 *
 * An animated, debounced search input for React Native with optional voice action.
 * It manages focus state, interpolates a highlight border, debounces text changes,
 * and exposes clear & submit behaviors that match common mobile search patterns.
 *
 * Key functionalities:
 * - **Controlled Text State**: Initializes from `query` prop and mirrors user edits via internal state.
 * - **Debounced onChange**: Calls `onChange` using lodash `debounce` (default 300ms).
 * - **Animated Border**: Interpolates border color between `theme.card` and `theme.accent`/`theme.primary`
 *   on focus/blur using `Animated.timing`.
 * - **Clear Button**: Fades in/out based on input length and clears the field (refocuses input) when tapped.
 * - **Submit Behavior**: Triggers `onSubmit` with the current text on the keyboard “search” action and dismisses the keyboard.
 * - **Optional Voice Button**: When `showVoice` is true, renders a mic icon and placeholder press handler.
 *
 * Render flow:
 * 1. Root `Animated.View` styled by theme + animated `borderColor`.
 * 2. Leading search icon, middle `TextInput`, trailing clear button (animated), optional mic button.
 *
 * Props:
 * - `query: string` — initial text.
 * - `onChange: (text: string) => void` — debounced change handler.
 * - `theme: { text, card, input, accent, primary }` — color tokens used in the UI.
 * - `placeholder?: string` — defaults to "Search...".
 * - `debounceTime?: number` — defaults to 300ms.
 * - `onSubmit?: (text: string) => void` — called on submit.
 * - `showVoice?: boolean` — toggles mic button.
 *
 * Notes:
 * - Uses `Animated` with `useNativeDriver: false` for color interpolation.
 * - Accessibility: the input has label "Search input", hint "Enter text to search", role "search".
 *
 * Author: Sunidhi Abhange
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { debounce } from 'lodash';

const SearchBar = ({
    query,
    onChange,
    theme,
    placeholder = 'Search...',
    debounceTime = 300,
    onSubmit = () => {},
    showVoice = false,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [inputValue, setInputValue] = useState(query);
    const inputRef = useRef(null);
    const animatedBorder = useRef(new Animated.Value(0)).current;
    const clearOpacity = useRef(new Animated.Value(0)).current;

    const debouncedChange = useRef(
        debounce((text) => onChange(text), debounceTime)
    ).current;

    useEffect(() => {
        debouncedChange(inputValue);
    }, [inputValue]);

    useEffect(() => {
        Animated.timing(animatedBorder, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused]);

    useEffect(() => {
        Animated.timing(clearOpacity, {
            toValue: inputValue.length > 0 ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [inputValue]);

    const borderColor = animatedBorder.interpolate({
        inputRange: [0, 1],
        outputRange: [
            theme.card || '#eee',
            theme.accent || theme.primary || '#4B7BE5',
        ],
    });

    const handleClear = () => {
        setInputValue('');
        onChange('');
        inputRef.current?.focus();
    };

    const handleVoiceInput = () => {
        console.log('Voice input placeholder logic');
    };

    return (
        <Animated.View
            style={[
                styles.wrapper,
                {
                    backgroundColor: theme.input || theme.card || '#fff',
                    borderColor,
                },
            ]}
        >
            <Ionicons name='search' size={20} color={theme.text || '#000'} />

            <TextInput
                ref={inputRef}
                style={[styles.input, { color: theme.text || '#000' }]}
                placeholder={placeholder}
                placeholderTextColor={(theme.text || '#000') + '99'}
                value={inputValue}
                onChangeText={setInputValue}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                returnKeyType='search'
                onSubmitEditing={() => {
                    onSubmit(inputValue);
                    Keyboard.dismiss();
                }}
                accessibilityLabel='Search input'
                accessibilityHint='Enter text to search'
                accessibilityRole='search'
            />

            <Animated.View style={{ opacity: clearOpacity }}>
                {inputValue.length > 0 && (
                    <TouchableOpacity onPress={handleClear}>
                        <Ionicons
                            name='close-circle'
                            size={20}
                            color={(theme.text || '#000') + '88'}
                        />
                    </TouchableOpacity>
                )}
            </Animated.View>

            {showVoice && (
                <TouchableOpacity
                    onPress={handleVoiceInput}
                    accessibilityLabel='Voice input'
                    accessibilityHint='Activate voice search'
                    style={{ marginLeft: 8 }}
                >
                    <Ionicons
                        name='mic-outline'
                        size={20}
                        color={(theme.text || '#000') + '88'}
                    />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginBottom: 10,
        borderWidth: 2,
    },
    input: {
        flex: 1,
        fontSize: 13,
        marginLeft: 8,
        fontFamily: 'Poppins',
        paddingVertical: 2,
    },
});

export default SearchBar;
