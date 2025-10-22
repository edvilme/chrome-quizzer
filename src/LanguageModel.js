/**
 * LanguageModel.js
 * Handles tasks related to the language model, including prompts and context.
 */

import quizSchema from '../schemas/quiz-schema.json' assert { type: 'json' };
import dashboardCategorySchema from '../schemas/dashboard-category-schema.json' assert { type: 'json' };

const SUGGESTIONS_INITIAL_PROMPT = `
You are an expert at generating helpful suggestions for users based on their previous answers to quizzes.
Given their past answers, provide a concise list of personalized suggestions to help them improve their knowledge and skills.
Address the user in second person ("you").
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

export { generateQuiz, generateSuggestions };
