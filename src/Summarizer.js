/**
 * Summarizer.js
 * Handles tasks related to summarizing content.
 */

import { acquireModel } from './ModelAcquisition.js';

/**
 * Creates and configures a summarizer instance.
 * @param {Object} options - Options for the summarizer
 * @returns {Promise<Object|null>} The summarizer instance, or null if unavailable
 */
async function createSummarizer(options = {}) {
  const defaultOptions = {
    type: "tldr",
    length: "long",
    format: "markdown"
  };
  
  return await acquireModel(
    Summarizer,
    { ...defaultOptions, ...options }
  );
}

/**
 * Summarizes the given text.
 * @param {Object} summarizer - The summarizer instance
 * @param {string} text - The text to summarize
 * @returns {Promise<string>} The summary text
 */
async function summarizeText(summarizer, text) {
  return await summarizer.summarize(text);
}

export { createSummarizer, summarizeText };
