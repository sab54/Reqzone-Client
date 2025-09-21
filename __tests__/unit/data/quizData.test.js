/**
 * Quiz Bank Tests
 *
 * This test suite verifies the structure and functionality of the `quizBank` array,
 * which contains quiz objects, each with a set of questions, options, and answers.
 * 
 * 1. **Structure Verification**: Ensures that each quiz and its questions follow the expected structure.
 * 2. **Content Validation**: Validates that each question's answer exists within its options.
 * 3. **XP Calculation**: Tests that the total XP reward from all quizzes is correctly calculated.
 * 4. **Uniqueness of Quiz Keys**: Ensures no two quizzes share the same `key` value.
 */
import { quizBank } from '../../../src/data/quizData';  

describe('Quiz Bank', () => {

  test('should have the correct structure', () => {
    // Verify each quiz has the expected properties
    quizBank.forEach((quiz) => {
      expect(quiz).toHaveProperty('key');
      expect(quiz).toHaveProperty('label');
      expect(quiz).toHaveProperty('xpReward');
      expect(quiz).toHaveProperty('questions');
      expect(Array.isArray(quiz.questions)).toBe(true);
      
      // Verify each question structure
      quiz.questions.forEach((question) => {
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('options');
        expect(question).toHaveProperty('answer');
        expect(Array.isArray(question.options)).toBe(true);
        expect(question.options).toContain(question.answer);
      });
    });
  });

  test('should contain at least one quiz', () => {
    expect(quizBank.length).toBeGreaterThan(0);
  });

  test('should return the correct answer for each question', () => {
    quizBank.forEach((quiz) => {
      quiz.questions.forEach((question) => {
        expect(question.options).toContain(question.answer);
      });
    });
  });

  test('should correctly calculate total XP reward', () => {
    const totalXP = quizBank.reduce((total, quiz) => total + quiz.xpReward, 0);
    expect(totalXP).toBe(45);  // 20 + 25 from the example quiz bank
  });

  test('should not have duplicate keys for quizzes', () => {
    const keys = quizBank.map(quiz => quiz.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);  // Ensures no duplicate keys
  });

});
