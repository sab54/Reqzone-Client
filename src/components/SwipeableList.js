// Client/src/components/SwipeableList.js
/**
 * SwipeableList
 *
 * A forwardRef-enabled, swipeable, paginated list for React Native. Each row is wrapped
 * in `react-native-gesture-handler`'s `Swipeable` so you can render right-side actions
 * (e.g., delete buttons). The component also supports empty/loading states, "Load More"
 * pagination, pull-to-refresh, and safe key extraction.
 *
 * Key functionalities:
 * - **Swipe Actions**: Per-row `Swipeable` with `renderRightActions(progress, dragX)` and
 *   `onSwipeableWillOpen` hook to let the parent know when a swipe begins (`handleSwipeStart`).
 * - **Tap vs. Swipe Guard**: Row presses are ignored while a swipe is in progress
 *   using an internal `isSwipingRef`; it resets shortly after a tap attempt.
 * - **Pagination Footer**: Shows total/visible counts. When `hasMore` is true:
 *   - Shows spinner while `loading` is true.
 *   - Shows a "Load More" button when not loading; pressing triggers `onLoadMore()`,
 *     then auto-scrolls to bottom via `ref.current?.scrollToEnd()` after 300ms.
 * - **Empty State**: When not `loading` and there’s no data, shows `emptyText`.
 * - **Icons & Theming**: Optional leading icon (`Ionicons`) and theme-driven colors
 *   (`theme.card`, `theme.text`, `theme.border`, `theme.primary`).
 * - **Safe Keys**: If `keyExtractor` is not provided, falls back to `item.url`, `item.id`,
 *   or index-based key.
 *
 * Props (selected):
 * - `data: any[]` — items to render.
 * - `totalCount: number` — total count across pages.
 * - `loading: boolean` — fetch-in-progress flag.
 * - `refreshing: boolean` — pull-to-refresh flag; `onRefresh()` handler.
 * - `hasMore: boolean` — whether more data can be loaded.
 * - `disableLoadMore: boolean` — disables "Load More" press & dims button.
 * - `onLoadMore(): void` — invoked on "Load More" press.
 * - `renderRightActions(item, index, progress, dragX): React.Node` — right-side swipe UI.
 * - `renderItemText(item): string | React.Node` — inner text or custom node.
 * - `renderItemContainer(item, content, onItemPress): React.Node` — fully custom row container.
 * - `onItemPress(item): void` — row press handler (guarded during swipe).
 * - `icon: string` — Ionicon name (default `'list-outline'`); `showIcon: boolean`.
 * - `theme: { text, card, border, primary }` — color tokens.
 * - `emptyText: string` — message when list is empty.
 * - `ListHeaderComponent: React.Node` — optional header.
 * - `swipeableRefs: React.MutableRefObject<Swipeable[]>` — access to row swipeables.
 *
 * Notes:
 * - Exposes the outer `FlatList` ref via `forwardRef` (supports `scrollToEnd`).
 * - The "Load More" auto-scroll uses a 300ms timeout to let new items mount first.
 * - `Swipeable` config: `friction=1`, `rightThreshold=20`, `overshootRight=false`.
 *
 * Author: Sunidhi Abhange
 */

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
                        {(() => {
                            const result = renderItemText(item);
                            if (typeof result === 'string') {
                                return (
                                    <Text
                                        style={{ color: theme.text || '#000' }}
                                    >
                                        {result}
                                    </Text>
                                );
                            }
                            if (React.isValidElement(result)) {
                                return result;
                            }
                            return null;
                        })()}
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
