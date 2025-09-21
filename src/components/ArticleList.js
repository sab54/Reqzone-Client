/**
 * ArticleList.js
 *
 * A paginated, filterable, and sortable list for article cards with primary/secondary actions.
 * Designed for lightweight feeds (default page size = 6) and theming via a provided `theme` object.
 *
 * Key functionalities:
 * - Filtering: by `filterCategory` (string match, case-insensitive) and `searchQuery` (title + description).
 * - Sorting: by `sortMode`:
 *    - 'recent' (default): descending by `bookmarkedAt` (if present) then `publishedAt`.
 *    - 'az': ascending by article `title`.
 * - Pagination: shows `PAGE_SIZE` items, with "Load More" to append the next page and auto-scroll to bottom.
 * - Actions: per-item primary/secondary buttons (icons + labels). Primary defaults to `Linking.openURL(item.url)`.
 * - Empty State: customizable empty text, with optional "Explore Articles" suggestion callback.
 * - Footer: shows "Showing X of Y" counter and either a loader or a "Load More" button when more items exist.
 *
 * Props:
 * - articles: Array<{ title, description?, url, category?, publishedAt?, bookmarkedAt? }>
 * - theme: {
 *     card, border, icon, title, text, mutedText, link,
 *     buttonPrimaryText, buttonSecondaryText
 *   }  // used for colors/visuals only
 * - icon: Ionicon name for each row (default 'newspaper-outline')
 * - iconColor: overrides `theme.icon` if provided
 * - emptyText: string shown when list is empty (default 'No articles found.')
 * - onPrimaryAction(item): optional handler; falls back to `Linking.openURL(item.url)`
 * - onSecondaryAction(item): optional handler to show secondary CTA when present
 * - primaryLabel / secondaryLabel: button labels (default 'Open' / 'Action')
 * - primaryIcon / secondaryIcon: Ionicon names for the buttons
 * - primaryColor / secondaryColor: optional overrides for button text/icon color
 * - filterCategory: string category filter (default 'All' - no filter)
 * - searchQuery: free text search across title + description
 * - sortMode: 'recent' | 'az' (default 'recent')
 * - onSuggestBookmark: optional callback rendered in empty state as "Explore Articles"
 *
 * Rendering flow:
 * 1) useMemo -> filter by category/search, then sort by chosen `sortMode`.
 * 2) Derive visible slice (`visibleCount`) and render via FlatList.
 * 3) Footer shows count + "Load More" or loading spinner (while simulating async with setTimeout).
 * 4) Row actions render Ionicons + labels; press handlers call the provided callbacks (or open URL).
 *
 * Performance notes:
 * - Filtering/sorting is memoized on [articles, filterCategory, searchQuery, sortMode].
 * - Pagination avoids rendering very long lists up front.
 *
 * Accessibility:
 * - Buttons are touch targets with icon + text.
 * - Footer counter indicates current/total items.
 *
 * Author: Sunidhi Abhange
 */

import React, { useRef, useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { truncate, formatTimeAgo } from '../utils/utils';

const PAGE_SIZE = 6;

const ArticleList = ({
    articles = [],
    theme,
    icon = 'newspaper-outline',
    iconColor,
    emptyText = 'No articles found.',
    onPrimaryAction,
    onSecondaryAction,
    primaryLabel = 'Open',
    secondaryLabel = 'Action',
    secondaryIcon = 'bookmark-outline',
    primaryIcon = 'open-outline',
    primaryColor = '#1976D2',
    secondaryColor = '#e74c3c',
    filterCategory = 'All',
    searchQuery = '',
    sortMode = 'recent',
    onSuggestBookmark = null,
}) => {
    const listRef = useRef(null);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [loadingMore, setLoadingMore] = useState(false);

    const scrollToBottom = () => {
        listRef.current?.scrollToEnd({ animated: true });
    };

    const filteredSortedArticles = useMemo(() => {
        let filtered = [...articles];

        if (filterCategory !== 'All') {
            filtered = filtered.filter((a) =>
                a.category?.toLowerCase().includes(filterCategory.toLowerCase())
            );
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter((a) =>
                `${a.title} ${a.description}`.toLowerCase().includes(q)
            );
        }

        if (sortMode === 'az') {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
        } else {
            filtered.sort(
                (a, b) =>
                    new Date(b.bookmarkedAt || b.publishedAt || 0) -
                    new Date(a.bookmarkedAt || a.publishedAt || 0)
            );
        }

        return filtered;
    }, [articles, filterCategory, searchQuery, sortMode]);

    const visibleArticles = filteredSortedArticles.slice(0, visibleCount);
    const hasMore = visibleCount < filteredSortedArticles.length;

    const handleLoadMore = () => {
        if (!hasMore) return;
        setLoadingMore(true);
        setTimeout(() => {
            setVisibleCount((prev) => prev + PAGE_SIZE);
            setLoadingMore(false);
            scrollToBottom();
        }, 200);
    };

    const renderItem = ({ item }) => (
        <View
            style={[
                styles.item,
                {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                },
            ]}
        >
            <Ionicons
                name={icon}
                size={22}
                color={iconColor || theme.icon}
                style={styles.icon}
            />
            <View style={styles.textWrapper}>
                <Text style={[styles.articleTitle, { color: theme.title }]}>
                    {truncate(item.title)}
                </Text>
                {item.description && (
                    <Text style={[styles.summary, { color: theme.text }]}>
                        {truncate(item.description)}
                    </Text>
                )}
                {item.bookmarkedAt && (
                    <Text style={[styles.meta, { color: theme.mutedText }]}>
                        Bookmarked {formatTimeAgo(item.bookmarkedAt)}
                    </Text>
                )}
                <View style={styles.row}>
                    <TouchableOpacity
                        onPress={() =>
                            onPrimaryAction
                                ? onPrimaryAction(item)
                                : Linking.openURL(item.url)
                        }
                        style={styles.rowBtn}
                    >
                        <Ionicons
                            name={primaryIcon}
                            size={16}
                            color={primaryColor || theme.buttonPrimaryText}
                        />
                        <Text
                            style={[
                                styles.rowBtnText,
                                {
                                    color:
                                        primaryColor || theme.buttonPrimaryText,
                                },
                            ]}
                        >
                            {primaryLabel}
                        </Text>
                    </TouchableOpacity>

                    {onSecondaryAction && (
                        <TouchableOpacity
                            onPress={() => onSecondaryAction(item)}
                            style={styles.rowBtn}
                        >
                            <Ionicons
                                name={secondaryIcon}
                                size={16}
                                color={
                                    secondaryColor || theme.buttonSecondaryText
                                }
                            />
                            <Text
                                style={[
                                    styles.rowBtnText,
                                    {
                                        color:
                                            secondaryColor ||
                                            theme.buttonSecondaryText,
                                    },
                                ]}
                            >
                                {secondaryLabel}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    const renderFooter = () => {
        if (!articles.length) return null;
        return (
            <View style={styles.footer}>
                <Text style={[styles.meta, { color: theme.mutedText }]}>
                    Showing {visibleArticles.length} of{' '}
                    {filteredSortedArticles.length}
                </Text>

                {hasMore &&
                    (loadingMore ? (
                        <ActivityIndicator
                            size='small'
                            color={theme.text}
                            style={{ marginTop: 10 }}
                        />
                    ) : (
                        <TouchableOpacity
                            onPress={handleLoadMore}
                            style={[
                                styles.loadMoreBtn,
                                { borderColor: theme.link },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.loadMoreText,
                                    { color: theme.link },
                                ]}
                            >
                                Load More
                            </Text>
                        </TouchableOpacity>
                    ))}
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={[styles.text, { color: theme.text }]}>
                {emptyText}
            </Text>
            {onSuggestBookmark && (
                <TouchableOpacity onPress={onSuggestBookmark}>
                    <Text style={[styles.suggestText, { color: theme.link }]}>
                        Explore Articles
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <FlatList
            ref={listRef}
            data={visibleArticles}
            keyExtractor={(item, index) => item.url || index.toString()}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            contentContainerStyle={{ paddingBottom: 20 }}
        />
    );
};

const styles = StyleSheet.create({
    text: {
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
    },
    suggestText: {
        fontSize: 14,
        marginTop: 8,
        fontWeight: '600',
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
    articleTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    summary: {
        fontSize: 14,
        marginBottom: 6,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    rowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    rowBtnText: {
        fontSize: 14,
        fontWeight: '500',
    },
    meta: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 12,
    },
    footer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    loadMoreBtn: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ArticleList;
