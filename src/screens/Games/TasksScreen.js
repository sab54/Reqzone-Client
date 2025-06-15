import React, {
    useEffect,
    useState,
    useCallback,
    useRef,
    useMemo,
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Pressable,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';

import SwipeableList from '../../components/SwipeableList';
import SearchBar from '../../components/SearchBar';
import Tabs from '../../components/Tabs';
import Footer from '../../components/Footer';
import ProgressBar from '../../components/ProgressBar';
import TipBanner from '../../components/TipBanner';
import LevelUpToast from '../../components/LevelUpToast';

import {
    fetchTasks,
    fetchTaskProgress,
    completeTask,
    uncompleteTask,
} from '../../store/actions/tasksActions';
import {
    fetchQuizzes,
    fetchQuizHistory,
} from '../../store/actions/quizActions';
import { fetchDashboard } from '../../store/actions/dashboardActions';
import { fetchUserBadges } from '../../store/actions/badgesActions';

const TasksScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const userId = useSelector((state) => state.auth.user?.id, shallowEqual);
    const { tasks = [], completedTaskIds = [] } = useSelector(
        (state) => state.tasks,
        shallowEqual
    );
    const { quizzes = [], quizHistory = [] } = useSelector(
        (state) => state.quizzes,
        shallowEqual
    );
    const { xp = 0, level = 1 } = useSelector(
        (state) => state.dashboard.stats || {},
        shallowEqual
    );
    const earnedBadges = useSelector(
        (state) => state.badges.userBadges || [],
        shallowEqual
    );
    const theme = useSelector((state) => state.theme.themeColors, shallowEqual);

    const [selectedTab, setSelectedTab] = useState('all');
    const [query, setQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [showConfetti, setShowConfetti] = useState(false);
    const [prevLevel, setPrevLevel] = useState(level);
    const PAGE_SIZE = 20;

    const toastAnim = useRef(new Animated.Value(0)).current;
    const swipeableRefs = useRef({});
    const currentlyOpenSwipeable = useRef(null);

    const styles = createStyles(theme, insets);

    const loadData = useCallback(() => {
        if (!userId) return;
        dispatch(fetchTasks(userId));
        dispatch(fetchTaskProgress(userId));
        dispatch(fetchQuizzes(userId));
        dispatch(fetchQuizHistory(userId));
        dispatch(fetchDashboard(userId));
        dispatch(fetchUserBadges(userId));
    }, [dispatch, userId]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const completedQuizIds = useMemo(
        () => quizHistory.map((q) => q.quiz_id),
        [quizHistory]
    );

    const allItems = useMemo(() => {
        return [
            ...tasks.map((task) => ({ ...task, type: 'task' })),
            ...quizzes.map((quiz) => ({ ...quiz, type: 'quiz' })),
        ];
    }, [tasks, quizzes]);

    const filteredItems = useMemo(() => {
        const base = allItems.filter((item) => {
            if (selectedTab === 'checklist' && item.type !== 'task')
                return false;
            if (selectedTab === 'quiz' && item.type !== 'quiz') return false;
            return item.title?.toLowerCase().includes(query.toLowerCase());
        });

        return base.sort((a, b) => {
            const aCompleted =
                a.type === 'task'
                    ? completedTaskIds.includes(a.id)
                    : completedQuizIds.includes(a.id);
            const bCompleted =
                b.type === 'task'
                    ? completedTaskIds.includes(b.id)
                    : completedQuizIds.includes(b.id);
            if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
            const aTime = new Date(a.due_date || a.created_at).getTime();
            const bTime = new Date(b.due_date || b.created_at).getTime();
            return bTime - aTime;
        });
    }, [allItems, selectedTab, query, completedTaskIds, completedQuizIds]);

    const paginated = filteredItems.slice(0, page * PAGE_SIZE);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleLoadMore = () => {
        if (paginated.length < filteredItems.length) {
            setPage((p) => p + 1);
        }
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

    const handleQuizNavigation = (quizId) => {
        const isCompleted = completedQuizIds.includes(quizId);
        if (!isCompleted) {
            navigation.navigate('Quiz', { quizId });
        }
    };

    const renderItemText = (item) => {
        const isCompleted =
            item.type === 'task'
                ? completedTaskIds.includes(item.id)
                : completedQuizIds.includes(item.id);

        return (
            <View style={styles.row}>
                <View
                    style={[
                        styles.bullet,
                        {
                            backgroundColor: isCompleted
                                ? theme.success
                                : theme.warning,
                        },
                    ]}
                />
                <View>
                    <Text style={[styles.taskTitle, { color: theme.title }]}>
                        {item.title}
                    </Text>
                    {item.description && (
                        <Text style={[styles.taskDesc, { color: theme.text }]}>
                            {item.description}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const completed =
        tasks.filter((t) => completedTaskIds.includes(t.id)).length +
        quizzes.filter((q) => completedQuizIds.includes(q.id)).length;
    const total = allItems.length;
    const progress = total > 0 ? completed / total : 0;

    useEffect(() => {
        if (level > prevLevel) {
            setShowConfetti(true);
            setPrevLevel(level);
            Animated.timing(toastAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                setTimeout(() => {
                    Animated.timing(toastAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }).start();
                }, 2000);
            });
        }
    }, [level]);

    return (
        <View style={styles.container}>
            <SearchBar
                query={query}
                onChange={setQuery}
                theme={theme}
                placeholder='Search tasks or quizzes...'
                debounceTime={300}
            />
            <TipBanner tip='Keep completing to earn more XP!' theme={theme} />
            <ProgressBar
                progress={progress}
                level={level}
                xp={xp}
                theme={theme}
            />
            <Text style={styles.stats}>
                ✅ {completed} / {total} complete · 🎖 {earnedBadges.length}{' '}
                badges
            </Text>
            <Tabs
                tabs={[
                    { key: 'all', label: '📋 All' },
                    { key: 'checklist', label: '✅ Checklist' },
                    { key: 'quiz', label: '📘 Quizzes' },
                ]}
                selectedTab={selectedTab}
                onTabSelect={(key) => {
                    setSelectedTab(key);
                    setPage(1);
                }}
                theme={theme}
            />
            <SwipeableList
                ref={null}
                data={paginated}
                refreshing={refreshing}
                onRefresh={onRefresh}
                hasMore={paginated.length < filteredItems.length}
                onLoadMore={handleLoadMore}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                swipeableRefs={swipeableRefs}
                handleSwipeStart={handleSwipeStart}
                onItemPress={(item) => {
                    if (item.type === 'quiz') {
                        handleQuizNavigation(item.id);
                    } else {
                        dispatch(completeTask({ userId, taskId: item.id }));
                    }
                }}
                renderItemText={renderItemText}
                renderItemContainer={(item, content, onPress) => (
                    <Pressable
                        onPress={() => onPress(item)}
                        style={({ pressed }) => [
                            styles.itemContainer,
                            {
                                backgroundColor: pressed
                                    ? theme.cardPressed
                                    : theme.surface,
                            },
                        ]}
                    >
                        {content}
                    </Pressable>
                )}
                renderRightActions={(item, index) => {
                    const isCompleted =
                        item.type === 'task'
                            ? completedTaskIds.includes(item.id)
                            : completedQuizIds.includes(item.id);
                    const isTask = item.type === 'task';

                    if (!isTask && isCompleted) return null;

                    const handleAction = () => {
                        if (isTask) {
                            const action = isCompleted
                                ? uncompleteTask
                                : completeTask;
                            dispatch(action({ userId, taskId: item.id })).then(
                                () => {
                                    swipeableRefs.current[index]?.close();
                                }
                            );
                        } else {
                            handleQuizNavigation(item.id);
                        }
                    };

                    return (
                        <View style={styles.swipeActionsWrapper}>
                            <TouchableOpacity
                                style={[
                                    styles.swipeActionOpen,
                                    {
                                        backgroundColor: isTask
                                            ? isCompleted
                                                ? theme.danger || 'tomato'
                                                : theme.success || 'green'
                                            : '#0078D4',
                                    },
                                ]}
                                onPress={handleAction}
                            >
                                <Ionicons
                                    name={
                                        isTask
                                            ? isCompleted
                                                ? 'close-circle-outline'
                                                : 'checkmark-done-outline'
                                            : 'open-outline'
                                    }
                                    size={24}
                                    color='#fff'
                                />
                            </TouchableOpacity>
                        </View>
                    );
                }}
                theme={theme}
                showIcon={false}
            />
            <Footer theme={theme} />
            <LevelUpToast
                animatedValue={toastAnim}
                level={level}
                theme={theme}
            />
            {showConfetti && (
                <ConfettiCannon
                    count={100}
                    origin={{ x: Dimensions.get('window').width / 2, y: 0 }}
                    fadeOut
                    explosionSpeed={450}
                    fallSpeed={2600}
                />
            )}
        </View>
    );
};

const createStyles = (theme, insets) =>
    StyleSheet.create({
        container: {
            flex: 1,
            paddingTop: 20,
            paddingHorizontal: 16,
            paddingBottom: 10 + insets.bottom,
            backgroundColor: theme.background,
        },
        stats: {
            fontSize: 14,
            fontFamily: 'Poppins',
            color: theme.text,
            marginBottom: 12,
        },
        itemContainer: {
            paddingVertical: 14,
            paddingHorizontal: 12,
            borderRadius: 12,
            marginBottom: 0,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        bullet: {
            width: 10,
            height: 10,
            borderRadius: 5,
            marginRight: 12,
        },
        taskTitle: {
            fontSize: 15,
            fontFamily: 'PoppinsBold',
        },
        taskDesc: {
            fontSize: 13,
            fontFamily: 'Poppins',
            marginTop: 2,
        },
        swipeActionsWrapper: {
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            paddingRight: 4,
        },
        swipeActionOpen: {
            justifyContent: 'center',
            alignItems: 'center',
            width: 70,
            height: '90%',
            borderRadius: 12,
            marginVertical: 4,
        },
    });

export default TasksScreen;
