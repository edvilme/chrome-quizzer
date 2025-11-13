/**
 * Summarizer.js
 * Handles tasks related to summarizing content.
 */

import { acquireModel } from "./ModelAcquisition";


/**
 * Summarizes the given text by splitting into paragraphs.
 * @param {string} text - The text to summarize
 * @returns {Promise<string>} The summary text
 */
async function summarizeText(text) {
  const summarizer = await acquireModel(Summarizer, {
      type: "tldr",
      length: "long",
      format: "markdown"
    }, 'summarizer');
  return await summarizer.summarize(text);
}

export { summarizeText };
