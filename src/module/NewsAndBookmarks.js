import React, { useEffect, useRef, useState } from 'react';
import {
    Text,
    View,
    StyleSheet,
    Linking,
    TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import Tabs from '../components/Tabs';
import HorizontalSelector from '../components/HorizontalSelector';
import SwipeActions from '../components/SwipeActions';
import SwipeableList from '../components/SwipeableList';
import ArticleList from '../components/ArticleList';
import SearchBar from '../components/SearchBar';
import ConfirmationModal from '../components/ConfirmationModal';

import { fetchNewsData } from '../store/actions/newsActions';
import {
    loadBookmarks,
    addBookmark,
    removeBookmark,
    clearBookmarksAndPersist,
} from '../store/actions/bookmarksActions';

import { truncate, formatTimeAgo } from '../utils/utils';

const NewsAndBookmarks = ({ theme }) => {
    const dispatch = useDispatch();
    const { articles, loading, hasMore, totalCount } = useSelector(
        (state) => state.news
    );
    const { bookmarks } = useSelector((state) => state.bookmarks);

    const [selectedTab, setSelectedTab] = useState('news');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [bookmarkCategory, setBookmarkCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [newsSearchQuery, setNewsSearchQuery] = useState('');
    const [sortMode, setSortMode] = useState('recent');
    const [page, setPage] = useState(1);
    const [modalProps, setModalProps] = useState(null);

    const swipeableRefs = useRef({});
    const currentlyOpenSwipeable = useRef(null);

    useEffect(() => {
        dispatch(loadBookmarks());
    }, [dispatch]);

    useEffect(() => {
        if (selectedTab === 'news') {
            setPage(1);
            dispatch(fetchNewsData(selectedCategory, 1));
        }
    }, [dispatch, selectedCategory, selectedTab]);

    const loadMoreArticles = () => {
        if (loading || !hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        dispatch(fetchNewsData(selectedCategory, nextPage));
    };

    const isBookmarked = (url) => bookmarks.some((item) => item.url === url);

    const handleAction = async (type, article, index) => {
        const enrichedArticle = {
            ...article,
            category: article.category || selectedCategory || 'General',
        };

        if (type === 'bookmark') {
            if (isBookmarked(article.url)) {
                await dispatch(removeBookmark(article));
            } else {
                await dispatch(addBookmark(enrichedArticle));
            }
        } else if (type === 'open') {
            Linking.openURL(article.url);
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
        { label: 'All', icon: 'apps-outline' },
        { label: 'Flood', icon: 'water' },
        { label: 'Earthquake', icon: 'pulse' },
        { label: 'Fire', icon: 'flame-outline' },
        { label: 'Tsunami', icon: 'boat-outline' },
        { label: 'Storm', icon: 'thunderstorm-outline' },
        { label: 'Local', icon: 'location-outline' },
    ];

    const filteredArticles = articles.filter((article) =>
        article.title.toLowerCase().includes(newsSearchQuery.toLowerCase())
    );

    const newsTabContent = () => (
        <SwipeableList
            data={filteredArticles}
            loading={loading}
            hasMore={hasMore}
            totalCount={totalCount}
            disableLoadMore={loading}
            onLoadMore={loadMoreArticles}
            theme={theme}
            swipeableRefs={swipeableRefs}
            handleSwipeStart={handleSwipeStart}
            renderRightActions={(item, index, progress, dragX) => (
                <SwipeActions
                    dragX={dragX}
                    article={item}
                    index={index}
                    isBookmarked={isBookmarked(item.url)}
                    onAction={handleAction}
                />
            )}
            keyExtractor={(item) => item.url}
            icon='newspaper-outline'
            renderItemText={(article) => (
                <>
                    <Text
                        style={[styles.articleTitle, { color: theme.title }]}
                        numberOfLines={2}
                    >
                        {truncate(article.title)}
                    </Text>
                    {article.description && (
                        <Text
                            style={[styles.summary, { color: theme.text }]}
                            numberOfLines={2}
                        >
                            {truncate(article.description)}
                        </Text>
                    )}
                    <View style={styles.row}>
                        <Text
                            style={[
                                styles.time,
                                { color: theme.text, opacity: 0.6 },
                            ]}
                        >
                            {formatTimeAgo(article.publishedAt)}
                        </Text>
                        {isBookmarked(article.url) && (
                            <Ionicons
                                name='bookmark'
                                size={18}
                                color={theme.primary}
                            />
                        )}
                    </View>
                </>
            )}
            onItemPress={(article) => Linking.openURL(article.url)}
            ListHeaderComponent={
                <>
                    <SearchBar
                        query={newsSearchQuery}
                        onChange={setNewsSearchQuery}
                        theme={theme}
                        placeholder='Search news...'
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

    const bookmarksTabContent = () => (
        <View>
            <SearchBar
                query={searchQuery}
                onChange={setSearchQuery}
                theme={theme}
                placeholder='Search bookmarks...'
                debounceTime={300}
            />

            <View style={styles.searchSortRow}>
                <HorizontalSelector
                    data={categories}
                    selected={categories.find(
                        (item) => item.label === bookmarkCategory
                    )}
                    onSelect={(item) => setBookmarkCategory(item.label)}
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
                <TouchableOpacity
                    onPress={() =>
                        setSortMode((prev) =>
                            prev === 'recent' ? 'az' : 'recent'
                        )
                    }
                    style={{ marginLeft: 12 }}
                >
                    <Ionicons
                        name={sortMode === 'az' ? 'text' : 'time-outline'}
                        size={20}
                        color={theme.text}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        setModalProps({
                            visible: true,
                            title: 'Clear all bookmarks?',
                            description:
                                'This will remove all your saved articles. This action cannot be undone.',
                            icon: 'trash-bin-outline',
                            confirmLabel: 'Clear All',
                            cancelLabel: 'Cancel',
                            onConfirm: () => {
                                dispatch(clearBookmarksAndPersist());
                                setModalProps(null);
                            },
                            onCancel: () => setModalProps(null),
                        });
                    }}
                    style={{ marginLeft: 12 }}
                >
                    <Ionicons
                        name='trash-outline'
                        size={20}
                        color={theme.error}
                    />
                </TouchableOpacity>
            </View>

            <ArticleList
                articles={bookmarks}
                theme={theme}
                icon='bookmark'
                emptyText='You haven’t saved any articles yet.'
                onPrimaryAction={(article) => Linking.openURL(article.url)}
                onSecondaryAction={(article) => {
                    setModalProps({
                        visible: true,
                        title: 'Remove Bookmark?',
                        description:
                            'Are you sure you want to remove this bookmark?',
                        icon: 'trash-outline',
                        confirmLabel: 'Remove',
                        cancelLabel: 'Cancel',
                        onConfirm: () => {
                            dispatch(removeBookmark(article));
                            setModalProps(null);
                        },
                        onCancel: () => setModalProps(null),
                    });
                }}
                secondaryLabel='Remove'
                secondaryIcon='trash-bin-outline'
                filterCategory={bookmarkCategory}
                searchQuery={searchQuery}
                sortMode={sortMode}
                onSuggestBookmark={() => setSelectedTab('news')}
            />
        </View>
    );

    const tabs = [
        {
            key: 'news',
            label: '📰 News',
            content: newsTabContent,
        },
        {
            key: 'bookmarks',
            label: '🔖 Bookmarks',
            content: bookmarksTabContent,
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
    articleTitle: {
        fontSize: 14,
        fontFamily: 'Poppins',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    summary: {
        fontSize: 13,
        fontFamily: 'Poppins',
        marginBottom: 4,
    },
    time: {
        fontSize: 12,
        fontFamily: 'Poppins',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    searchSortRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
});

export default NewsAndBookmarks;
