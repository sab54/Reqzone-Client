import React, { useEffect, useRef, useState } from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    Linking,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from 'react-native-paper';

import Tabs from '../components/Tabs';
import HorizontalSelector from '../components/HorizontalSelector';
import SwipeableList from '../components/SwipeableList';
import SearchBar from '../components/SearchBar';
import ConfirmationModal from '../components/ConfirmationModal';

import {
    fetchAlertsData,
    fetchUserAlerts,
    loadPendingActions,
    markAlertAsRead,
    fetchGlobalHazardAlerts,
} from '../store/actions/alertsActions';

import { formatTimeAgo, truncate } from '../utils/utils';

const haversineDistance = (coords1, coords2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(coords2.latitude - coords1.latitude);
    const dLon = toRad(coords2.longitude - coords1.longitude);
    const lat1 = toRad(coords1.latitude);
    const lat2 = toRad(coords2.latitude);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const Alert = ({ theme }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const {
        alerts: { data: alertsData = [], loading, hasMore },
        pendingActions = [],
        globalHazards: {
            data: hazardAlerts = [],
            loading: hazardLoading,
            error: hazardError,
        },
    } = useSelector((state) => state.alerts);

    const [selectedTab, setSelectedTab] = useState('alerts');
    const [selectedCategory, setSelectedCategory] = useState('System');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [modalProps, setModalProps] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    const swipeableRefs = useRef({});
    const currentlyOpenSwipeable = useRef(null);

    useEffect(() => {
        dispatch(loadPendingActions());
        dispatch(fetchGlobalHazardAlerts());
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Location permission denied');
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation(location.coords);
        })();
    }, [dispatch]);

    useEffect(() => {
        if (selectedTab === 'alerts') {
            setPage(1);
            if (user) dispatch(fetchUserAlerts(user.id));
            dispatch(
                fetchAlertsData({
                    category: selectedCategory,
                    page: 1,
                    userId: user?.id,
                })
            );
        }
    }, [dispatch, selectedCategory, selectedTab, user]);

    const loadMoreAlerts = () => {
        if (loading || !hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        dispatch(
            fetchAlertsData({
                category: selectedCategory,
                page: nextPage,
                userId: user?.id,
            })
        );
    };

    const handleAction = async (type, alert, index) => {
        if (type === 'markRead') {
            const alertType = alert.related_id ? 'user' : 'system';
            const userId = user?.id;
            await dispatch(
                markAlertAsRead({ alertId: alert.id, alertType, userId })
            );
        }
        swipeableRefs.current[index]?.close();
    };

    const handleSwipeStart = (index) => {
        if (
            currentlyOpenSwipeable.current &&
            currentlyOpenSwipeable.current !== swipeableRefs.current[index]
        ) {
            currentlyOpenSwipeable.current.close();
        }
        currentlyOpenSwipeable.current = swipeableRefs.current[index];
    };

    const categories = [
        { label: 'System', icon: 'tv-outline' },
        { label: 'Emergency', icon: 'warning-outline' },
        { label: 'Weather', icon: 'cloud-outline' },
    ];

    const filteredAlerts = (() => {
        const normalizedSearch = searchQuery.toLowerCase();

        const matchesFilters = (alert) => {
            const titleMatch = alert.title
                ?.toLowerCase()
                .includes(normalizedSearch);

            const normalizedType = alert.type?.toLowerCase() || '';
            const normalizedCategory = alert.category?.toLowerCase() || '';

            let categoryMatch = false;

            if (selectedCategory === 'System') {
                categoryMatch = [
                    'system',
                    'maintenance',
                    'update',
                    'security',
                    'general',
                ].includes(normalizedCategory);
            } else if (selectedCategory === 'Weather') {
                categoryMatch =
                    normalizedType === 'weather' ||
                    normalizedCategory === 'weather' ||
                    alert.source === 'global'; // ✅ match global entries
            } else if (selectedCategory === 'Emergency') {
                categoryMatch =
                    normalizedType === 'emergency' ||
                    normalizedCategory === 'emergency';
            }

            if (
                alert.latitude &&
                alert.longitude &&
                alert.radius_km &&
                userLocation
            ) {
                const distance = haversineDistance(userLocation, {
                    latitude: parseFloat(alert.latitude),
                    longitude: parseFloat(alert.longitude),
                });
                if (distance > parseFloat(alert.radius_km)) return false;
            }

            return titleMatch && categoryMatch;
        };

        const mainData = alertsData.filter(matchesFilters);
        const includeGlobal = selectedCategory === 'Weather';
        const globalData = includeGlobal
            ? hazardAlerts.filter(matchesFilters)
            : [];

        return [...mainData, ...globalData];
    })();

    const alertsTabContent = () => (
        <SwipeableList
            data={filteredAlerts}
            loading={
                selectedCategory === 'Weather'
                    ? loading || hazardLoading
                    : loading
            }
            hasMore={
                selectedCategory === 'Weather'
                    ? hasMore && !user
                    : hasMore && !user
            }
            totalCount={filteredAlerts.length}
            onLoadMore={
                selectedCategory === 'Weather' || user
                    ? undefined
                    : loadMoreAlerts
            }
            theme={theme}
            swipeableRefs={swipeableRefs}
            handleSwipeStart={handleSwipeStart}
            keyExtractor={(item, index) =>
                `${item.id ?? index}-${item.type ?? item.category ?? 'alert'}`
            }
            icon='notifications-outline'
            renderItemText={(alert) => (
                <View>
                    <Text
                        style={[styles.alertTitle, { color: theme.title }]}
                        numberOfLines={2}
                    >
                        {!alert.is_read && (
                            <Ionicons
                                name='ellipse'
                                size={8}
                                color={theme.info || 'blue'}
                                style={{ marginLeft: 4 }}
                            />
                        )}{' '}
                        {truncate(alert.title)}
                    </Text>
                    {alert.message && (
                        <Text
                            style={[styles.summary, { color: theme.text }]}
                            numberOfLines={2}
                        >
                            {truncate(alert.message)}
                        </Text>
                    )}
                    <View style={styles.row}>
                        <Text
                            style={[
                                styles.time,
                                { color: theme.text, opacity: 0.6 },
                            ]}
                        >
                            {formatTimeAgo(alert.created_at || alert.timestamp)}
                        </Text>
                    </View>
                </View>
            )}
            renderRightActions={(alert, index) => (
                <TouchableOpacity
                    style={{
                        backgroundColor: alert.is_read
                            ? theme.error
                            : theme.success,
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 80,
                        height: '90%',
                        borderRadius: 12,
                        marginVertical: 4,
                    }}
                    onPress={() => handleAction('markRead', alert, index)}
                >
                    <Ionicons
                        name={
                            alert.is_read
                                ? 'close-circle-outline'
                                : 'checkmark-done-outline'
                        }
                        size={24}
                        color='#fff'
                    />
                </TouchableOpacity>
            )}
            onItemPress={(alert) => alert.url && Linking.openURL(alert.url)}
            ListHeaderComponent={
                <>
                    <SearchBar
                        query={searchQuery}
                        onChange={setSearchQuery}
                        theme={theme}
                        placeholder='Search alerts...'
                        debounceTime={300}
                    />
                    <HorizontalSelector
                        data={categories}
                        selected={categories.find(
                            (item) => item.label === selectedCategory
                        )}
                        onSelect={(item) => setSelectedCategory(item.label)}
                        theme={theme}
                        isEqual={(a, b) => a.label === b.label}
                        renderIcon={(item, isSelected) => (
                            <Ionicons
                                name={item.icon}
                                size={16}
                                color={
                                    isSelected
                                        ? theme.buttonPrimaryText
                                        : theme.text
                                }
                            />
                        )}
                        itemKey={(item) => item.label}
                    />
                </>
            }
        />
    );

    const pendingActionsTabContent = () => (
        <SwipeableList
            data={pendingActions}
            loading={false}
            hasMore={false}
            totalCount={pendingActions.length}
            theme={theme}
            swipeableRefs={swipeableRefs}
            handleSwipeStart={handleSwipeStart}
            keyExtractor={(item, index) => `${item.id ?? index}-pending`}
            icon='time-outline'
            renderItemText={(action) => (
                <View>
                    <Text
                        style={[styles.alertTitle, { color: theme.title }]}
                        numberOfLines={2}
                    >
                        {truncate(action.title)}
                    </Text>
                    {action.description && (
                        <Text
                            style={[styles.summary, { color: theme.text }]}
                            numberOfLines={2}
                        >
                            {truncate(action.description)}
                        </Text>
                    )}
                </View>
            )}
        />
    );

    const tabs = [
        { key: 'alerts', label: '🔔 Alerts', content: alertsTabContent },
        {
            key: 'pendingActions',
            label: '⏳ Pending Actions',
            content: pendingActionsTabContent,
        },
    ];

    return (
        <Card
            style={[
                styles.card,
                {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    shadowColor: theme.shadow,
                },
            ]}
        >
            <Tabs
                tabs={tabs}
                selectedTab={selectedTab}
                onTabSelect={setSelectedTab}
                theme={theme}
            />
            {tabs.find((t) => t.key === selectedTab)?.content()}
            {modalProps && (
                <ConfirmationModal
                    visible={modalProps.visible}
                    theme={theme}
                    onClose={() => setModalProps(null)}
                    onConfirm={modalProps.onConfirm}
                    onCancel={modalProps.onCancel}
                    title={modalProps.title}
                    description={modalProps.description}
                    icon={modalProps.icon}
                    confirmLabel={modalProps.confirmLabel}
                    cancelLabel={modalProps.cancelLabel}
                />
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        borderRadius: 12,
        padding: 15,
        elevation: 4,
        borderWidth: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontFamily: 'Poppins',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    summary: { fontSize: 13, fontFamily: 'Poppins', marginBottom: 4 },
    time: { fontSize: 12, fontFamily: 'Poppins' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});

export default Alert;
