/**
 * LanguageModel.js
 * Handles tasks related to the language model, including prompts and context.
 */

import quizSchema from '../schemas/quiz-schema.json' assert { type: 'json' };
import dashboardCategorySchema from '../schemas/dashboard-category-schema.json' assert { type: 'json' };
import wordGameSchema from '../schemas/word-game-schema.json' assert { type: 'json' };

import { generateLayout } from 'crossword-layout-generator';

const SUGGESTIONS_INITIAL_PROMPT = `
You are an expert at generating helpful learning suggestions based on quiz performance.
When analyzing past answers, you will:
1. Only reference topics and categories that appear in the provided quiz data
2. Generate concise, personalized suggestions to improve knowledge gaps
3. Base all recommendations solely on the information in the user's quiz history
4. Address the user in second person (you/your) throughout

Consider all of the past answers I provide to you, and generate suggestions accordingly.
`;

/**
 * Generates a quiz from article text using the language model.
 * @param {Object} languageModel - The language model instance
 * @param {string} articleText - The article content to generate quiz from
 * @returns {Promise<Object>} The generated quiz object
 * @throws {Error} If quiz generation or parsing fails
 */
async function generateQuiz(languageModel, articleText) {
  // Clone the language model to avoid interfering with other tasks
  const session = await languageModel.clone();
  const promptText = `
    Generate a quiz based on this article.
    ${articleText}
  `;

  const response = await session.prompt(promptText, {
    responseConstraint: quizSchema
  });

  await session.destroy();
  return JSON.parse(response);
}

/**
 * Generates personalized suggestions based on past quiz answers.
 * @param {Object} languageModel - The language model instance
 * @param {Array} answers - Array of past quiz answers
 * @returns {Promise<Object>} The generated suggestions object
 * @throws {Error} If suggestion generation or parsing fails
 */
async function generateSuggestions(languageModel, answers) {
  // Clone the language model to avoid interfering with other tasks
  const session = await languageModel.clone();
  await session.append({
    role: 'system',
    content: SUGGESTIONS_INITIAL_PROMPT
  });
  await session.append(
    answers
      .filter(answer => answer && answer.quizCategory)
      .map(({correctAnswer, question, selectedAnswer, isCorrect}) => {
        return {
          role: 'user',
          content: JSON.stringify({correctAnswer, question, selectedAnswer, isCorrect})
        };
      })
  );

  const response = await session.prompt("Generate suggestions based on the provided quiz data.", {
    responseConstraint: dashboardCategorySchema
  });
  await session.destroy();
  return JSON.parse(response);
}

/**
 * Generates a crossword puzzle layout from article text using the language model.
 * @param {Object} languageModel - The language model instance
 * @param {string} articleText - The article content to generate crossword from
 * @returns {Promise<Object>} The generated crossword layout
 * @throws {Error} If crossword generation or parsing fails
 */
async function generateWordGames(languageModel, articleText) {
  // Clone the language model to avoid interfering with other tasks
  const session = await languageModel.clone();
  const promptText = `
    Give me some words and their hints based off this article to create a crossword puzzle. 
    Hints should be concise and informative, and the words should be relevant to the article's content.
    ${articleText}
  `;

  const response = await session.prompt(promptText, {
    responseConstraint: wordGameSchema
  });

  await session.destroy();
  const crosswordData = JSON.parse(response);
  console.log("Crossword data:", crosswordData);
  const layout = generateLayout(crosswordData);
  return layout;
}


export { generateQuiz, generateSuggestions, generateWordGames };
