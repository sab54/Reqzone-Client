/**
 * QuizScreen.js
 *
 * This screen implements the interactive Disaster Quiz feature where users answer
 * multiple-choice questions, track their score, and earn XP rewards.
 *
 * Key functionalities:
 * - **Quiz Fetching**:
 *   - On mount, dispatches `getQuizById(quizId)` to load quiz content.
 *   - Uses Redux selectors to read `quiz`, `isLoadingQuiz`, and `theme`.
 *
 * - **Question Flow**:
 *   - Maintains `currentIndex` to track which question is being shown.
 *   - Supports both single-correct and multiple-correct questions.
 *   - Handles option selection via `handleSelect`, toggling state accordingly.
 *
 * - **Answer Submission**:
 *   - `handleNext` checks selected answers against the correct set.
 *   - Updates `answers` array, score counter, and shows feedback.
 *   - At the end of the quiz:
 *     - Dispatches `submitQuiz`, `fetchDashboard`, and `fetchUserBadges`.
 *     - Calculates XP earned and shows results screen.
 *
 * - **Result & Feedback**:
 *   - Displays personalized result titles and messages based on score %.
 *   - Shows XP earned and a retry option.
 *   - Triggers confetti animation and toast animation when finishing.
 *
 * - **UI & Theming**:
 *   - Uses `useSafeAreaInsets` to adjust spacing.
 *   - Applies colors, backgrounds, and borders from the Redux theme.
 *   - Provides header with back navigation, styled questions, and buttons.
 *
 * Notes:
 * - Uses `MotiView` for answer feedback animations.
 * - Uses `ConfettiCannon` for celebratory finish effect.
 * - All animations are wrapped with `Animated` to control toast visibility.
 *
 * Author: Sunidhi Abhange
 */

import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform,
    Dimensions,
    Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { MotiView } from 'moti';

import { getQuizById, submitQuiz } from '../../store/actions/quizActions';
import { fetchDashboard } from '../../store/actions/dashboardActions';
import { fetchUserBadges } from '../../store/actions/badgesActions';

const QuizScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const theme = useSelector((s) => s.theme.themeColors);
    const { quizId } = route.params || {};

    const userId = useSelector((s) => s.auth.user?.id);
    const quiz = useSelector((s) => s.quizzes.quiz);
    const isLoading = useSelector((s) => s.quizzes.isLoadingQuiz);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [earnedXP, setEarnedXP] = useState(0);

    const toastAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (quizId) {
            dispatch(getQuizById(quizId));
        }
    }, [quizId]);

    const currentQuestion = quiz?.questions?.[currentIndex];

    const isMultipleCorrect =
        currentQuestion?.options?.filter((opt) => opt.is_correct)?.length > 1;

    const handleSelect = (option) => {
        if (answered) return;
        if (isMultipleCorrect) {
            setSelectedOptions((prev) =>
                prev.includes(option)
                    ? prev.filter((opt) => opt !== option)
                    : [...prev, option]
            );
        } else {
            setSelectedOptions([option]);
        }
    };

    const handleNext = async () => {
        if (selectedOptions.length === 0) return;

        const correctOptions = currentQuestion.options
            .filter((opt) => opt.is_correct)
            .map((opt) => opt.option_text);

        const isCorrect =
            correctOptions.length === selectedOptions.length &&
            correctOptions.every((opt) => selectedOptions.includes(opt));

        setAnswers((prev) => [
            ...prev,
            {
                question_id: currentQuestion.id,
                selected_options: selectedOptions,
                is_correct: isCorrect,
            },
        ]);

        if (isCorrect) setScore((prev) => prev + 1);

        setFeedback(`Correct: ${correctOptions.join(', ')}`);
        setAnswered(true);

        setTimeout(() => {
            const nextIndex = currentIndex + 1;
            if (nextIndex < quiz.questions.length) {
                setCurrentIndex(nextIndex);
                setSelectedOptions([]);
                setFeedback(null);
                setAnswered(false);
            } else {
                (async () => {
                    try {
                        const submission = {
                            userId,
                            quizId,
                            answers,
                            score,
                            total_questions: quiz.questions.length,
                        };
                        const res = await dispatch(
                            submitQuiz(submission)
                        ).unwrap();
                        setEarnedXP(res?.xp_earned || 0);
                    } catch (err) {
                        console.warn('Quiz submission failed:', err);
                    }
                    dispatch(fetchDashboard(userId));
                    dispatch(fetchUserBadges(userId));
                    setShowResults(true);
                    setShowConfetti(true);
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
                        }, 2500);
                    });
                })();
            }
        }, 2500);
    };

    const restartQuiz = () => {
        setCurrentIndex(0);
        setSelectedOptions([]);
        setScore(0);
        setAnswers([]);
        setFeedback(null);
        setShowResults(false);
        setShowConfetti(false);
        setAnswered(false);
        setEarnedXP(0);
    };

    const styles = createStyles(theme, insets);

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons
                    name='arrow-back-outline'
                    size={24}
                    color={theme.link}
                />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Disaster Quiz</Text>
            <View style={{ width: 24 }} />
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                {renderHeader()}
                <View style={styles.content}>
                    <Text style={styles.title}>Loading quiz...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!quiz?.questions?.length) {
        return (
            <SafeAreaView style={styles.container}>
                {renderHeader()}
                <View style={styles.content}>
                    <Text style={styles.errorText}>Quiz not available</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (showResults) {
        const percentage = (score / quiz.questions.length) * 100;
        const resultTitle =
            percentage >= 90
                ? '🏆 You’re a Disaster Champ!'
                : percentage >= 80
                ? '🎉 Well done!'
                : percentage >= 70
                ? '👍 Good effort!'
                : percentage >= 50
                ? '🚧 Needs Improvement'
                : '😅 Keep Learning!';
        const resultMessage =
            percentage >= 90
                ? 'You crushed it! Your preparedness is top-tier.'
                : percentage >= 80
                ? 'Great job! You really know your safety stuff.'
                : percentage >= 70
                ? 'Nice work. A little more practice and you’ll be unstoppable.'
                : percentage >= 50
                ? 'You’re on the right path. Review and try again!'
                : 'Let’s go over the basics again. Try one more time!';

        return (
            <SafeAreaView style={styles.container}>
                {renderHeader()}
                <View style={styles.content}>
                    <Text style={[styles.title, { textAlign: 'center' }]}>
                        {resultTitle}
                    </Text>
                    <Text
                        style={[
                            styles.result,
                            {
                                color:
                                    percentage >= 80
                                        ? theme.success
                                        : percentage >= 50
                                        ? theme.warning
                                        : theme.error,
                            },
                        ]}
                    >
                        {score} / {quiz.questions.length} correct
                    </Text>
                    <Text style={styles.resultXP}>
                        🎯 XP Earned: {earnedXP}
                    </Text>
                    <Text
                        style={{
                            fontFamily: 'Poppins',
                            fontSize: 15,
                            textAlign: 'center',
                            color: theme.text,
                            marginBottom: 24,
                        }}
                    >
                        {resultMessage}
                    </Text>

                    <TouchableOpacity style={styles.btn} onPress={restartQuiz}>
                        <Text style={styles.btnText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: theme.border }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={[styles.btnText, { color: theme.text }]}>
                            Back to Chat
                        </Text>
                    </TouchableOpacity>

                    {showConfetti && (
                        <ConfettiCannon
                            count={100}
                            origin={{
                                x: Dimensions.get('window').width / 2,
                                y: 0,
                            }}
                            fadeOut
                            explosionSpeed={500}
                            fallSpeed={2700}
                        />
                    )}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                <Text style={styles.title}>
                    {quiz.title} ({currentIndex + 1}/{quiz.questions.length})
                </Text>
                <Text style={styles.question}>{currentQuestion.question}</Text>
                {currentQuestion.options.map((item, index) => {
                    const isSelected = selectedOptions.includes(
                        item.option_text
                    );
                    const isCorrect = item.is_correct;
                    const optionStyle = [
                        styles.option,
                        isSelected && styles.selectedOption,
                        answered && isCorrect && styles.correctOption,
                        answered &&
                            !isCorrect &&
                            isSelected &&
                            styles.incorrectOption,
                    ];
                    return (
                        <TouchableOpacity
                            key={index}
                            style={optionStyle}
                            onPress={() => handleSelect(item.option_text)}
                            disabled={answered}
                        >
                            <Ionicons
                                name={
                                    isMultipleCorrect
                                        ? isSelected
                                            ? 'checkbox'
                                            : 'square-outline'
                                        : isSelected
                                        ? 'radio-button-on'
                                        : 'radio-button-off'
                                }
                                size={20}
                                color={theme.icon}
                                style={{ marginRight: 8 }}
                            />
                            <Text style={styles.optionText}>
                                {item.option_text}
                            </Text>
                        </TouchableOpacity>
                    );
                })}

                {feedback && (
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        style={{ marginTop: 12 }}
                    >
                        <Text
                            style={{
                                color: theme.info,
                                fontFamily: 'PoppinsBold',
                                textAlign: 'center',
                                fontSize: 16,
                            }}
                        >
                            {feedback}
                        </Text>
                    </MotiView>
                )}

                <TouchableOpacity
                    style={[
                        styles.btn,
                        {
                            marginTop: 24,
                            opacity: selectedOptions.length > 0 ? 1 : 0.5,
                        },
                    ]}
                    onPress={handleNext}
                    disabled={selectedOptions.length === 0 || answered}
                >
                    <Text style={styles.btnText}>
                        {currentIndex === quiz.questions.length - 1
                            ? 'Finish Quiz'
                            : 'Next Question'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme, insets) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
            paddingBottom: Platform.OS === 'ios' ? 20 : insets.bottom + 10,
        },
        content: {
            flex: 1,
            paddingHorizontal: 16,
            paddingTop: 16,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 20,
            paddingBottom: 12,
            backgroundColor: theme.headerBackground,
        },
        headerTitle: {
            fontFamily: 'PoppinsBold',
            fontSize: 18,
            color: theme.title,
        },
        title: {
            fontSize: 22,
            fontFamily: 'PoppinsBold',
            marginBottom: 20,
            color: theme.title,
        },
        question: {
            fontSize: 17,
            fontFamily: 'Poppins',
            marginBottom: 20,
            color: theme.text,
        },
        option: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.card,
            padding: 14,
            marginBottom: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.border,
        },
        selectedOption: {
            borderColor: theme.primary,
            backgroundColor: theme.surface,
        },
        correctOption: {
            borderColor: theme.success,
            backgroundColor: theme.successBackground,
        },
        incorrectOption: {
            borderColor: theme.error,
            backgroundColor: theme.errorBackground,
        },
        optionText: {
            fontFamily: 'Poppins',
            fontSize: 15,
            color: theme.text,
        },
        btn: {
            backgroundColor: theme.buttonPrimaryBackground,
            padding: 14,
            borderRadius: 8,
            alignItems: 'center',
        },
        btnText: {
            color: theme.buttonPrimaryText,
            fontFamily: 'PoppinsBold',
            fontSize: 15,
        },
        result: {
            fontSize: 18,
            fontFamily: 'Poppins',
            textAlign: 'center',
            marginVertical: 10,
            color: theme.text,
        },
        resultXP: {
            fontSize: 16,
            textAlign: 'center',
            marginBottom: 16,
            color: theme.success,
            fontFamily: 'PoppinsBold',
        },
        errorText: {
            fontSize: 16,
            color: theme.error,
            textAlign: 'center',
            marginTop: 100,
        },
    });

export default QuizScreen;
