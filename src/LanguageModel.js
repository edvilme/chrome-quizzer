/**
 * LanguageModel.js
 * Handles tasks related to the language model, including prompts and context.
 */

import quizSchema from '../schemas/quiz-schema.json' assert { type: 'json' };
import dashboardCategorySchema from '../schemas/dashboard-category-schema.json' assert { type: 'json' };

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
  const initialPrompt = `
    I am an expert at generating helpful suggestions for you based on your previous answers to quizzes. 
    Given your past answers, I will provide a concise list of personalized suggestions to help you improve 
    your knowledge and skills. I will only address you in second person ("you"). I will avoid repeating questions and categories. Until you tell me "generate suggestions",
    I will not provide any suggestions and only wait for further input. 
  `;

  await languageModel.append({
    role: 'system',
    content: initialPrompt
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
