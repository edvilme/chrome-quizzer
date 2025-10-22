/**
 * LanguageModel.js
 * Handles tasks related to the language model, including prompts and context.
 */

import quizSchema from '../schemas/quiz-schema.json' assert { type: 'json' };
import dashboardSummarySchema from '../schemas/dashboard-summary-schema.json' assert { type: 'json' };

/**
 * Generates a quiz from article text using the language model.
 * @param {Object} languageModel - The language model instance
 * @param {string} articleText - The article content to generate quiz from
 * @returns {Promise<Object>} The generated quiz object
 * @throws {Error} If quiz generation or parsing fails
 */
async function generateQuiz(languageModel, articleText) {
  const initialPrompt = `
    I am an expert quiz generator. Given an article, I will create a quiz with 20 questions that test comprehension and critical thinking about the article's content.
    Each question will have 4 answer choices (A, B, C, D) with one correct answer.
  `;
  
  await languageModel.append({
    role: 'system',
    content: initialPrompt
  });
  await languageModel.append({
    role: 'user',
    content: articleText
  });

  const response = await languageModel.prompt(`    Quiz:`, {
    responseConstraint: quizSchema
  });
  
  return JSON.parse(response);
}

async function generateSuggestions(languageModel, answers) {
  const initialPrompt = `
    I am an expert at generating helpful suggestions for you based on your previous answers to quizzes. 
    Given your past answers, I will provide a concise list of personalized suggestions to help you improve 
    your knowledge and skills. I will address you in second person ("you").
  `;

  await languageModel.append({
    role: 'system',
    content: initialPrompt
  });
  await languageModel.append(
    answers
      .filter(answer => answer && answer.quizCategory)
      .map(answer => {
        console.log("Processing answer for suggestions:", answer);
        return {
          role: 'user',
          content: JSON.stringify(answer)
        };
      })
  );

  const response = await languageModel.prompt(`    Suggestions:`, {
    responseConstraint: dashboardSummarySchema
  });
  return JSON.parse(response);
}

export { generateQuiz, generateSuggestions };
