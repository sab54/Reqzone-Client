import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WeatherCard = ({ weatherData, forecastData, loadingWeather, theme }) => {
    const [showForecast, setShowForecast] = useState(false);
    const [unit, setUnit] = useState('C');
    const [loadingForecast, setLoadingForecast] = useState(false);

    const toggleForecast = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowForecast((prev) => !prev);
    };

    const convertTemp = (temp) => {
        return unit === 'C'
            ? `${temp.toFixed(1)}°C`
            : `${((temp * 9) / 5 + 32).toFixed(1)}°F`;
    };

    const getWeatherIcon = (weatherMain) => {
        switch (weatherMain) {
            case 'Clear':
                return 'weather-sunny';
            case 'Clouds':
                return 'weather-cloudy';
            case 'Rain':
                return 'weather-rainy';
            case 'Snow':
                return 'weather-snowy';
            default:
                return 'weather-partly-cloudy';
        }
    };

    const hasWeatherData =
        weatherData?.main && weatherData?.weather?.[0] && weatherData?.name;

    const handleForecastToggle = () => {
        setLoadingForecast(true);
        toggleForecast();
        // Simulate loading for forecast data if required (or actual data fetching can go here)
        setTimeout(() => {
            setLoadingForecast(false); // Remove loading state after fetching
        }, 1500); // Adjust delay based on actual fetch timing
    };

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    shadowColor: theme.shadow,
                },
            ]}
        >
            <TouchableOpacity onPress={handleForecastToggle}>
                <View style={styles.headerRow}>
                    <Text style={[styles.cardTitle, { color: theme.title }]}>
                        🌤️ Weather Overview
                    </Text>
                    <Ionicons
                        name={showForecast ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={theme.icon}
                        style={styles.expandIcon}
                    />
                </View>
            </TouchableOpacity>

            {loadingWeather ? (
                <ActivityIndicator size='small' color={theme.text} />
            ) : hasWeatherData ? (
                <>
                    {weatherData.alerts && (
                        <View
                            style={[
                                styles.alertBox,
                                {
                                    backgroundColor: theme.warningBackground,
                                    borderLeftColor: theme.warning,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.alertText,
                                    { color: theme.text },
                                ]}
                            >
                                ⚠️ {weatherData.alerts[0].event}
                            </Text>
                        </View>
                    )}

                    <View style={styles.weatherInfoRow}>
                        <MaterialCommunityIcons
                            name={getWeatherIcon(weatherData.weather[0].main)}
                            size={40}
                            color={theme.icon}
                            style={styles.weatherIcon}
                        />
                        <View style={styles.weatherDetails}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                City: {weatherData.name}
                            </Text>
                            <Text style={[styles.label, { color: theme.text }]}>
                                Temp: {convertTemp(weatherData.main.temp)}
                            </Text>
                            <Text style={[styles.label, { color: theme.text }]}>
                                Feels Like:{' '}
                                {convertTemp(weatherData.main.feels_like)}
                            </Text>
                        </View>
                        <View style={styles.weatherDetails}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                Humidity: {weatherData.main.humidity}%
                            </Text>
                            <Text style={[styles.label, { color: theme.text }]}>
                                Wind Speed: {weatherData.wind.speed} m/s
                            </Text>
                            <Text
                                style={[
                                    styles.label,
                                    { color: theme.mutedText },
                                ]}
                            >
                                {weatherData.weather[0].description}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => setUnit(unit === 'C' ? 'F' : 'C')}
                        style={styles.unitToggle}
                    >
                        <Text
                            style={[
                                styles.unitToggleText,
                                { color: theme.link },
                            ]}
                        >
                            Switch to °{unit === 'C' ? 'F' : 'C'}
                        </Text>
                    </TouchableOpacity>
                </>
            ) : (
                <Text style={[styles.label, { color: theme.mutedText }]}>
                    No weather data available.
                </Text>
            )}

            {forecastData?.length > 0 && showForecast && !loadingForecast && (
                <View style={{ marginTop: 10 }}>
                    <Text style={[styles.subTitle, { color: theme.title }]}>
                        5-Day Forecast
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.scrollContainer}
                    >
                        {forecastData.map((day, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.forecastCard,
                                    {
                                        backgroundColor: theme.card,
                                        borderColor: theme.border,
                                        shadowColor: theme.shadow,
                                    },
                                ]}
                            >
                                <Text
                                    style={[styles.date, { color: theme.text }]}
                                >
                                    {new Date(day.dt * 1000).toLocaleDateString(
                                        undefined,
                                        {
                                            weekday: 'short',
                                            day: 'numeric',
                                        }
                                    )}
                                </Text>
                                <MaterialCommunityIcons
                                    name={getWeatherIcon(day.weather[0].main)}
                                    size={30}
                                    color={theme.icon}
                                    style={{ marginVertical: 4 }}
                                />
                                <Text
                                    style={[styles.temp, { color: theme.text }]}
                                >
                                    {convertTemp(day.main.temp)}
                                </Text>
                                <Text
                                    style={[
                                        styles.desc,
                                        { color: theme.mutedText },
                                    ]}
                                >
                                    {day.weather[0].main}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {forecastData?.length > 0 && showForecast && loadingForecast && (
                <ActivityIndicator size='small' color={theme.text} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        borderRadius: 12,
        padding: 20,
        elevation: 5,
        borderWidth: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
        marginBottom: 12,
    },
    expandIcon: {
        marginLeft: 10,
    },
    subTitle: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins',
        marginBottom: 10,
    },
    weatherInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        justifyContent: 'space-between',
    },
    weatherIcon: {
        marginRight: 12,
    },
    weatherDetails: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Poppins',
        marginBottom: 4,
    },
    scrollContainer: {
        marginTop: 12,
    },
    forecastCard: {
        width: 100,
        borderRadius: 10,
        padding: 10,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        borderWidth: 1,
    },
    date: {
        fontSize: 12,
        fontFamily: 'Poppins',
    },
    temp: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
    },
    desc: {
        fontSize: 12,
        fontFamily: 'Poppins',
        textAlign: 'center',
    },
    unitToggle: {
        alignSelf: 'flex-end',
        marginTop: 10,
    },
    unitToggleText: {
        fontSize: 13,
        fontFamily: 'Poppins',
        textDecorationLine: 'underline',
    },
    alertBox: {
        borderLeftWidth: 4,
        padding: 10,
        borderRadius: 6,
        marginBottom: 10,
    },
    alertText: {
        fontFamily: 'Poppins',
        fontSize: 14,
    },
});

export default WeatherCard;
