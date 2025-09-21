// src/module/DocumentsScreen.js
/**
 * DocumentsScreen.js
 *
 * Displays a categorized, searchable, and swipe-actionable list of documents.
 * Fetches paginated documents from the store, filters them by category and search
 * text, and exposes per-item actions like open, mark as read, and mark as unread.
 *
 * Key functionalities:
 * - **Fetching & Pagination**
 *   - On mount / category change: dispatches `fetchDocuments(selectedCategory, 1)`.
 *   - Supports "load more" by incrementing `page` and fetching the next slice when `hasMore`.
 *
 * - **Filtering**
 *   - Text search: case-insensitive match on `doc.title`.
 *   - Category filter: `All`, `Flood`, `Earthquake`, `Fire`, `Tsunami`, `Storm`, `Local`.
 *
 * - **Swipe Actions**
 *   - Right actions rendered via `<SwipeActions/>`:
 *     - **Open Document** → `Linking.openURL(doc.file_url)`.
 *     - **Mark Read / Unread** → dispatches `markDocumentAsRead` / `markDocumentAsUnread`.
 *   - Keeps only one open swipeable item at a time (managed with `swipeableRefs`).
 *
 * - **UI Components**
 *   - `<SearchBar/>` for debounceable search input.
 *   - `<HorizontalSelector/>` for categories with icons.
 *   - `<SwipeableList/>` to render and paginate document rows.
 *   - `<ConfirmationModal/>` reserved for future destructive flows (wired via `modalProps`).
 *
 * - **Rendering**
 *   - Each row shows:
 *     - Unread dot (hidden when `doc.read` is true).
 *     - Title (truncated via `truncate`), with reduced opacity if read.
 *     - Relative time (via `formatTimeAgo(doc.uploaded_at)`).
 *
 * Data flow:
 * 1. Category is selected → resets `page` to 1 and fetches first page.
 * 2. Search query updates → list is filtered locally (no refetch).
 * 3. "Load more" → increments `page` and fetches subsequent page while `hasMore` is true.
 * 4. Swipe actions → dispatch the corresponding thunk and close the swipe item.
 *
 * Notes:
 * - `documents`, `loading`, and `hasMore` come from `state.documents`.
 * - Uses `Linking.openURL` to open document URLs; ensure these are https/file schemes.
 * - The component is themable—colors and surfaces come from the `theme` prop.
 *
 * Author: Sunidhi Abhange
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Text,
    View,
    StyleSheet,
    Linking,
    TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import HorizontalSelector from '../components/HorizontalSelector';
import SwipeableList from '../components/SwipeableList';
import SwipeActions from '../components/SwipeActions';
import SearchBar from '../components/SearchBar';
import ConfirmationModal from '../components/ConfirmationModal';

import {
    fetchDocuments,
    clearAllDocuments,
    markDocumentAsRead,
    markDocumentAsUnread,
} from '../store/actions/documentsActions';

import { truncate, formatTimeAgo } from '../utils/utils';

const DocumentsScreen = ({ theme }) => {
    const dispatch = useDispatch();
    const { documents, loading, hasMore } = useSelector(
        (state) => state.documents
    );

    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [modalProps, setModalProps] = useState(null);

    const swipeableRefs = useRef({});
    const currentlyOpenSwipeable = useRef(null);

    useEffect(() => {
        setPage(1);
        dispatch(fetchDocuments(selectedCategory, 1));
    }, [dispatch, selectedCategory]);

    const loadMoreDocuments = () => {
        if (loading || !hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        dispatch(fetchDocuments(selectedCategory, nextPage));
    };

    const handleAction = (type, document, index) => {
        if (type === 'open') {
            Linking.openURL(document.file_url);
        } else if (type === 'mark_read') {
            dispatch(markDocumentAsRead({ documentId: document.id }));
        } else if (type === 'mark_unread') {
            dispatch(markDocumentAsUnread({ documentId: document.id }));
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
        { label: 'All', icon: 'document-text-outline' },
        { label: 'Flood', icon: 'water' },
        { label: 'Earthquake', icon: 'pulse' },
        { label: 'Fire', icon: 'flame-outline' },
        { label: 'Tsunami', icon: 'boat-outline' },
        { label: 'Storm', icon: 'thunderstorm-outline' },
        { label: 'Local', icon: 'location-outline' },
    ];

    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch = doc.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesCategory =
            selectedCategory === 'All' ||
            doc.category?.toLowerCase() === selectedCategory.toLowerCase();

        return matchesSearch && matchesCategory;
    });


    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    shadowColor: theme.shadow,
                },
            ]}
        >
            <SearchBar
                query={searchQuery}
                onChange={setSearchQuery}
                theme={theme}
                placeholder='Search documents...'
                debounceTime={300}
            />

            <View style={styles.searchSortRow}>
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
            </View>

            <SwipeableList
                data={filteredDocuments}
                totalCount={filteredDocuments.length}
                loading={loading}
                hasMore={hasMore}
                disableLoadMore={loading}
                onLoadMore={loadMoreDocuments}
                theme={theme}
                swipeableRefs={swipeableRefs}
                handleSwipeStart={handleSwipeStart}
                renderRightActions={(item, index, progress, dragX) => (
                    <SwipeActions
                        dragX={dragX}
                        article={item}
                        index={index}
                        onAction={handleAction}
                        actions={[
                            {
                                type: 'open',
                                label: 'Open\nDocument',
                                icon: 'open-outline',
                                color: theme.primary,
                            },
                            {
                                type: item.read ? 'mark_unread' : 'mark_read',
                                label: item.read
                                    ? 'Mark\nUnread'
                                    : 'Mark\nRead',
                                icon: item.read
                                    ? 'eye-off-outline'
                                    : 'eye-outline',
                                color: item.read
                                    ? theme.warning || '#e67e22'
                                    : theme.success || '#2ecc71',
                            },
                        ]}
                        theme={theme}
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                icon='document-text-outline'
                renderItemText={(doc) => (
                    <View style={styles.textWrapper}>
                        <View style={styles.titleRow}>
                            {!doc.read && (
                                <View
                                    style={[
                                        styles.unreadDot,
                                        { backgroundColor: theme.primary },
                                    ]}
                                />
                            )}
                            <Text
                                style={[
                                    styles.articleTitle,
                                    {
                                        color: theme.title,
                                        opacity: doc.read ? 0.5 : 1,
                                    },
                                ]}
                                numberOfLines={2}
                            >
                                {truncate(doc.title)}
                            </Text>
                        </View>
                        <Text
                            style={[
                                styles.time,
                                {
                                    color: theme.text,
                                    opacity: doc.read ? 0.4 : 0.8,
                                },
                            ]}
                        >
                            {formatTimeAgo(doc.uploaded_at)}
                        </Text>
                    </View>
                )}
                onItemPress={(doc) => Linking.openURL(doc.file_url)}
            />

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
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        borderRadius: 12,
        padding: 15,
        elevation: 4,
        borderWidth: 1,
        flex: 1,
    },
    articleTitle: {
        fontSize: 14,
        fontFamily: 'Poppins',
        fontWeight: 'bold',
    },
    time: {
        fontSize: 12,
        fontFamily: 'Poppins',
        marginTop: 4,
    },
    searchSortRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    textWrapper: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
        marginTop: 2,
    },
});

export default DocumentsScreen;
