/**
 * LanguageModel.js
 * Handles tasks related to the language model, including prompts and context.
 */

import { acquireModel } from './ModelAcquisition.js';
import quizSchema from '../schemas/quiz-schema.json' assert { type: 'json' };

/**
 * Creates and configures a language model instance.
 * @param {Object} options - Options for the language model (type, length, format, etc.)
 * @returns {Promise<Object|null>} The language model instance, or null if unavailable
 */
async function createLanguageModel(options = {}) {
  return await acquireModel(
    LanguageModel,
    options
  );
}

/**
 * Generates a quiz from article text using the language model.
 * @param {Object} languageModel - The language model instance
 * @param {string} articleText - The article content to generate quiz from
 * @returns {Promise<Object>} The generated quiz object
 * @throws {Error} If quiz generation or parsing fails
 */
async function generateQuiz(languageModel, articleText) {
  const prompt = `Generate a quiz of 20 questions based on the following article:\n\n${articleText}\n\nQuiz:`;
  
  const response = await languageModel.prompt(prompt, {
    responseConstraint: quizSchema
  });
  
  return JSON.parse(response);
}

export { createLanguageModel, generateQuiz };
