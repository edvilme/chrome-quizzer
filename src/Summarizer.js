/**
 * Summarizer.js
 * Handles tasks related to summarizing content.
 */


/**
 * Summarizes the given text.
 * @param {Object} summarizer - The summarizer instance
 * @param {string} text - The text to summarize
 * @returns {Promise<string>} The summary text
 */
async function summarizeText(summarizer, text) {
  return await summarizer.summarize(text);
}

export { summarizeText };
