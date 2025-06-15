import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TipBanner = ({ tip, theme = {} }) => {
    const {
        highlight = '#f5f5dc', // default to a soft yellow-like highlight
        title = '#000', // default to black text
    } = theme;

    return (
        <View style={[styles.container, { backgroundColor: highlight }]}>
            <Text style={[styles.tipText, { color: title }]}>💡 {tip}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
    },
    tipText: {
        fontSize: 13,
        fontFamily: 'Poppins',
    },
});

export default TipBanner;
