/**
 * quizBank.js
 *
 * This file defines the `quizBank` array, which contains a collection of quizzes for the application. 
 * Each quiz has a unique `key`, a descriptive `label`, an `xpReward` (experience points) for completing the quiz, 
 * and an array of `questions`. Each question consists of a text prompt, a set of `options`, and the correct `answer`.
 *
 * Structure:
 * - `key`: A unique identifier for each quiz (e.g., 'safetyQuiz', 'fireQuiz').
 * - `label`: The name or title of the quiz, displayed to the user (e.g., 'Safety Basics', 'Fire Safety').
 * - `xpReward`: The amount of experience points a user will earn upon successfully completing the quiz.
 * - `questions`: An array of questions included in the quiz. Each question object contains:
 *   - `question`: The question text.
 *   - `options`: An array of possible answers.
 *   - `answer`: The correct answer, which must be one of the options.
 *
 * Purpose:
 * - The `quizBank` is used to display quizzes to users, track their progress, and reward experience points.
 * - It provides a mechanism to load, display, and evaluate quizzes in the application.
 * 
 * Author: [Your Name]
 */

export const quizBank = [
    {
        key: 'safetyQuiz',
        label: 'Safety Basics',
        xpReward: 20,
        questions: [
            {
                question: 'What should be in your emergency kit?',
                options: ['Water', 'Candy', 'Smartphone', 'All of the above'],
                answer: 'All of the above',
            },
            {
                question: 'Where is the safest place during an earthquake?',
                options: ['Outside', 'Next to windows', 'Under a sturdy table'],
                answer: 'Under a sturdy table',
            },
        ],
    },
    {
        key: 'fireQuiz',
        label: 'Fire Safety',
        xpReward: 25,
        questions: [
            {
                question: 'What is the first thing to do in a fire?',
                options: ['Grab belongings', 'Call 911', 'Get out immediately'],
                answer: 'Get out immediately',
            },
            {
                question: 'What should you do if your clothes catch fire?',
                options: ['Run', 'Jump in a pool', 'Stop, Drop, and Roll'],
                answer: 'Stop, Drop, and Roll',
            },
        ],
    },
];
