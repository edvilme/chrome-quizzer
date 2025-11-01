/**
 * LanguageModel.js
 * Handles tasks related to the language model, including prompts and context.
 */

import quizSchema from '../schemas/quiz-schema.json' assert { type: 'json' };
import dashboardCategorySchema from '../schemas/dashboard-category-schema.json' assert { type: 'json' };
import wordGameSchema from '../schemas/word-game-schema.json' assert { type: 'json' };
import flashcardSchema from '../schemas/flashcard-schema.json' assert { type: 'json' };

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
 * @returns {Promise<Object>} The generated word game layout
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


/**
 * Generates a flashcard based on a given text selection using a language model.
 *
 * Clones the provided language model to create an isolated session, prompts it to create a flashcard,
 * and returns the generated flashcard object. Ensures the session is destroyed after use.
 *
 * @async
 * @param {Object} languageModel - The language model instance to use for generating the flashcard.
 * @param {string} textSelection - The text selection from which to generate the flashcard.
 * @returns {Promise<Object>} A promise that resolves to the generated flashcard object.
 */
async function generateFlashCard(languageModel, textSelection) {
  // Clone the language model to avoid interfering with other tasks
  const session = await languageModel.clone();
  const promptText = `
    Create a flashcard based on the following text selection.
    ${textSelection}
  `;

  const response = await session.prompt(promptText, {
    responseConstraint: flashcardSchema
  });

  await session.destroy();
  return JSON.parse(response);
}

async function getPictionaryScore(languageModel, image, description) {
  // Clone the language model to avoid interfering with other tasks
  const session = await languageModel.clone();
  
  const promptText = `
    Evaluate how well the provided description matches the content of the image.
    Consider the accuracy, relevance, and completeness of the description in relation to the image.
    Provide a score from 0 to 100, where 0 means the description does not match the image at all,
    and 100 means the description perfectly matches the image.
  `;

  await session.append([
    {
      role: 'user',
      content: [
        { type: 'image', data: image },
        { type: 'text', data: `The prompt for the image was: ${description}` }
      ]
    }
  ]);

  const response = await session.prompt(promptText, {
    responseConstraint: {
      type: 'object',
      properties: {
        score: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        reasoning: {
          type: 'string'
        }
      },
      required: ['score', 'reasoning']
    }
  });

  await session.destroy();
  return response;
}

export { generateQuiz, generateSuggestions, generateWordGames, generateFlashCard, getPictionaryScore };
