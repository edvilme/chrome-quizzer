/**
 * LanguageModel.js
 * Handles tasks related to the language model, including prompts and context.
 */

import quizSchema from '../schemas/quiz-schema.json' assert { type: 'json' };
import dashboardCategorySchema from '../schemas/dashboard-category-schema.json' assert { type: 'json' };
import crosswordSchema from '../schemas/crossword-schema.json' assert { type: 'json' };

import { generateLayout } from 'crossword-layout-generator';

const SUGGESTIONS_INITIAL_PROMPT = `
I am an expert at generating helpful learning suggestions based on quiz performance.
When analyzing past answers, I will:
1. Only reference topics and categories that appear in the provided quiz data
2. Generate concise, personalized suggestions to improve knowledge gaps
3. Base all recommendations solely on the information in the user's quiz history
4. Address the user in second person (you/your) throughout
`;

/**
 * Generates a quiz from article text using the language model.
 * @param {Object} languageModel - The language model instance
 * @param {string} articleText - The article content to generate quiz from
 * @returns {Promise<Object>} The generated quiz object
 * @throws {Error} If quiz generation or parsing fails
 */
async function generateQuiz(languageModel, articleText) {
  const promptText = `
    Generate a quiz based on this article.
    ${articleText}
  `;

  const response = await languageModel.prompt(promptText, {
    responseConstraint: quizSchema
  });
  
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
  await languageModel.append({
    role: 'system',
    content: SUGGESTIONS_INITIAL_PROMPT
  });
  await languageModel.append(
    answers
      .filter(answer => answer && answer.quizCategory)
      .map(({correctAnswer, question, selectedAnswer, isCorrect}) => {
        return {
          role: 'user',
          content: `
          Consider this past answer I gave in a quiz:
          \`\`\`json
            ${JSON.stringify({correctAnswer, question, selectedAnswer, isCorrect})}
          \`\`\`
          `
        };
      })
  );

  const response = await languageModel.prompt("Generate suggestions.", {
    responseConstraint: dashboardCategorySchema
  });
  return JSON.parse(response);
}

/**
 * Generates a crossword puzzle layout from article text using the language model.
 * @param {Object} languageModel - The language model instance
 * @param {string} articleText - The article content to generate crossword from
 * @returns {Promise<Object>} The generated crossword layout
 * @throws {Error} If crossword generation or parsing fails
 */
async function generateCrossword(languageModel, articleText) {
  const promptText = `
    Give me some words and their hints based off this article to create a crossword puzzle.
    ${articleText}
  `;

  const response = await languageModel.prompt(promptText, {
    responseConstraint: crosswordSchema
  });

  const crosswordData = JSON.parse(response);
  console.log("Crossword data:", crosswordData);
  const layout = generateLayout(crosswordData);
  return layout;
}


export { generateQuiz, generateSuggestions, generateCrossword };
