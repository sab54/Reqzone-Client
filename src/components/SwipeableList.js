import React, { forwardRef, useRef } from 'react';
import {
    ActivityIndicator,
    Text,
    View,
    TouchableOpacity,
    StyleSheet,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

const SwipeableList = forwardRef(
    (
        {
            data = [],
            totalCount = 0,
            loading = false,
            refreshing = false,
            onRefresh = () => {},
            disableLoadMore = false,
            theme = {},
            swipeableRefs = { current: [] },
            handleSwipeStart = () => {},
            renderRightActions,
            keyExtractor,
            renderItemText,
            renderItemContainer,
            icon = 'list-outline',
            iconColor,
            onItemPress = () => {},
            showIcon = true,
            emptyText = 'No items available.',
            onLoadMore = () => {},
            hasMore = false,
            ListHeaderComponent = null,
        },
        ref
    ) => {
        const isSwipingRef = useRef(false);
        const scrollToBottom = () => {
            ref?.current?.scrollToEnd?.({ animated: true });
        };

        const safeKeyExtractor = (item, index) => {
            if (keyExtractor) return keyExtractor(item, index);
            if (item?.url) return `${item.url}-${index}`;
            if (item?.id) return `id-${item.id}-${index}`;
            return `item-${index}`;
        };

        const renderItem = ({ item, index }) => {
            const content = (
                <>
                    {showIcon && (
                        <Ionicons
                            name={icon}
                            size={24}
                            color={iconColor || theme.text || '#000'}
                            style={styles.icon}
                        />
                    )}
                    <View style={styles.textWrapper}>
                        {renderItemText(item)}
                    </View>
                </>
            );

            return (
                <View style={styles.swipeContainer}>
                    <Swipeable
                        ref={(r) => (swipeableRefs.current[index] = r)}
                        renderRightActions={(progress, dragX) => (
                            <View style={styles.swipeActionsWrapper}>
                                {renderRightActions?.(
                                    item,
                                    index,
                                    progress,
                                    dragX
                                )}
                            </View>
                        )}
                        friction={1}
                        rightThreshold={20}
                        overshootRight={false}
                        onSwipeableWillOpen={() => {
                            isSwipingRef.current = true;
                            handleSwipeStart(index);
                        }}
                    >
                        {renderItemContainer ? (
                            renderItemContainer(item, content, onItemPress)
                        ) : (
                            <TouchableOpacity
                                style={[
                                    styles.item,
                                    {
                                        backgroundColor: theme.card || '#fff',
                                        borderColor:
                                            theme.border ||
                                            (theme.text || '#000') + '22',
                                    },
                                ]}
                                activeOpacity={0.8}
                                onPress={() => {
                                    if (!isSwipingRef.current) {
                                        onItemPress(item);
                                    }
                                    setTimeout(() => {
                                        isSwipingRef.current = false;
                                    }, 100);
                                }}
                            >
                                {content}
                            </TouchableOpacity>
                        )}
                    </Swipeable>
                </View>
            );
        };

        const renderFooter = () => {
            if (!hasMore && data.length > 0) {
                return (
                    <Text
                        style={[styles.meta, { color: theme.text || '#000' }]}
                    >
                        Showing {data.length} of {totalCount}
                    </Text>
                );
            }

            return (
                <View style={styles.footer}>
                    <Text
                        style={[styles.meta, { color: theme.text || '#000' }]}
                    >
                        Showing {data.length} of {totalCount}
                    </Text>

                    {loading ? (
                        <ActivityIndicator
                            size='small'
                            color={theme.text || '#000'}
                            style={{ marginTop: 10 }}
                        />
                    ) : (
                        <TouchableOpacity
                            onPress={() => {
                                onLoadMore?.();
                                setTimeout(scrollToBottom, 300);
                            }}
                            style={[
                                styles.loadMoreBtn,
                                {
                                    borderColor: theme.primary || '#007AFF',
                                    opacity: disableLoadMore ? 0.5 : 1,
                                },
                            ]}
                            disabled={disableLoadMore}
                        >
                            <Text
                                style={[
                                    styles.loadMoreText,
                                    { color: theme.primary || '#007AFF' },
                                ]}
                            >
                                Load More
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        };

        const renderEmpty = () => {
            if (loading) return null;
            return (
                <Text style={[styles.text, { color: theme.text || '#000' }]}>
                    {emptyText}
                </Text>
            );
        };

        return (
            <FlatList
                ref={ref}
                data={data}
                keyExtractor={safeKeyExtractor}
                renderItem={renderItem}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                ListHeaderComponent={ListHeaderComponent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={{ paddingBottom: 80 }}
                refreshing={refreshing}
                onRefresh={onRefresh}
            />
        );
    }
);

const styles = StyleSheet.create({
    swipeContainer: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        marginBottom: 10,
        overflow: 'hidden',
    },
    text: {
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    icon: {
        marginRight: 10,
        marginTop: 3,
    },
    textWrapper: {
        flex: 1,
    },
    swipeActionsWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        backgroundColor: 'transparent',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    meta: {
        fontSize: 13,
        opacity: 0.6,
        textAlign: 'center',
        marginBottom: 8,
    },
    loadMoreBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderWidth: 1.5,
        borderRadius: 25,
        marginTop: 8,
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default SwipeableList;
