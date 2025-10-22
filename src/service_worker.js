/**
 * Service Worker for Chrome Quizzer Extension
 * This file contains the logic for handling background tasks, including data extraction,
 * summarization, quiz generation, and suggestion generation. It also manages communication
 * between the extension's components and the Chrome browser.
 */

import { generateQuiz, generateSuggestions } from "./LanguageModel.js";
import { summarizeText } from "./Summarizer.js";
import { extractTabData } from "./TabExtractor.js";
import { acquireModel } from "./ModelAcquisition.js";

/**
 * Extracts data from the current browser tab.
 * @param {Object} message - The message object sent to the service worker.
 * @param {Object} sender - The sender of the message.
 * @param {Function} sendResponse - Callback to send a response back to the sender.
 * @returns {Promise<Object|null>} - The extracted tab data or null in case of an error.
 */
async function getTabData(message, sender, sendResponse) {
  try {
    const tabData = await extractTabData();
    sendResponse({ success: true, tabData });
    return tabData;
  } catch (err) {
    sendResponse({ success: false, error: err.message });
    return null;
  }
}

/**
 * Generates a summary for the given tab data.
 * @param {Object} tabData - The data extracted from the tab.
 * @param {Object} message - The message object sent to the service worker.
 * @param {Object} sender - The sender of the message.
 * @param {Function} sendResponse - Callback to send a response back to the sender.
 * @returns {Promise<string|null>} - The generated summary or null in case of an error.
 */
async function generateSummary(tabData, message, sender, sendResponse) {
  const { article } = tabData;
  let summarizer;
  try {
    summarizer = await acquireModel(Summarizer, {
      type: "tldr",
      length: "long",
      format: "markdown"
    }, 'summarizer');
  } catch (err) {
    sendResponse({ success: false, error: 'Failed to load summarization model' });
    return;
  }

  let summary;
  try {
    summary = await summarizeText(summarizer, article.textContent);
    sendResponse({ success: true, summary });
    return summary;
  } catch (err) {
    sendResponse({ success: false, error: 'Failed to generate summary' });
    return;
  }
}

/**
 * Generates quiz data based on the given tab data.
 * @param {Object} tabData - The data extracted from the tab.
 * @param {Object} message - The message object sent to the service worker.
 * @param {Object} sender - The sender of the message.
 * @param {Function} sendResponse - Callback to send a response back to the sender.
 * @returns {Promise<Object|null>} - The generated quiz data or null in case of an error.
 */
async function generateQuizData(tabData, message, sender, sendResponse) {
  const { article } = tabData;
  let languageModel;
  try {
    languageModel = await acquireModel(LanguageModel, {}, 'quiz-generator');
  } catch (err) {
    sendResponse({ success: false, error: 'Failed to load language model' });
    return;
  }

  let quiz;
  try {
    quiz = await generateQuiz(languageModel, article.textContent);
    sendResponse({ success: true, quiz });
    return quiz;
  } catch (err) {
    sendResponse({ success: false, error: 'Failed to generate quiz' });
    return;
  }
}

/**
 * Preloads suggestion data based on the user's answer history.
 * @param {Function} callback - Callback to send a response back to the sender.
 * @returns {Promise<Object|null>} - The preloaded suggestions or null in case of an error.
 */
async function preloadSuggestionsData(callback) {
  let languageModel;
  try {
    languageModel = await acquireModel(LanguageModel, {}, 'suggestion-generator');
  } catch (err) {
    callback({ success: false, error: 'Failed to load language model' });
    return;
  }
  const answers = (await chrome.storage.local.get('answerHistory')).answerHistory || [];

  let followupSuggestions;
  try {
    followupSuggestions = await generateSuggestions(languageModel, answers);
    // Cache the generated suggestions
    await chrome.storage.local.set({ followupSuggestions });
    callback({ success: true, suggestions: followupSuggestions });
    return followupSuggestions;
  } catch (err) {
    callback({ success: false, error: 'Failed to generate suggestions', err });
    return;
  }
}

/**
 * Generates suggestions based on cached or newly preloaded data.
 * @param {Object} message - The message object sent to the service worker.
 * @param {Object} sender - The sender of the message.
 * @param {Function} sendResponse - Callback to send a response back to the sender.
 * @returns {Promise<Object|null>} - The generated suggestions or null in case of an error.
 */
async function generateSuggestionsData(message, sender, sendResponse) {
  // Check for cached suggestions
  const cachedData = await chrome.storage.local.get('followupSuggestions');
  if (cachedData.followupSuggestions) {
    sendResponse({ success: true, suggestions: cachedData.followupSuggestions });
    return cachedData.followupSuggestions;
  }
  return await preloadSuggestionsData(sendResponse);
}

// Allows users to open the side panel by clicking on the action toolbar icon
// Prefer the declarative behavior, and also register an explicit click handler
// as a fallback for environments that don't open the panel automatically.
// Minimal service worker: enable opening the side panel on action click
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => { });
}

// Open the dashboard when the user enters a keyword in the omnibox
chrome.omnibox.onInputEntered.addListener(() => {
  const dashboardUrl = chrome.runtime.getURL('static/dashboard/dashboard.html');
  chrome.tabs.create({ url: dashboardUrl });
});

// Listen for changes in chrome storage to clear cached suggestions
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.answerHistory) {
    generateSuggestionsData();
  }
});

// Listen for messages from the side panel (or other extension pages)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type == 'getTab') {
    getTabData(message, sender, sendResponse).then(tabData => {
      console.log("Tab data requested:", tabData);
    });
    return true; // Indicate that we will respond asynchronously
  }
  if (message?.type == 'generateSummary') {
    console.log("Generating summary for message:", message);
    const tabData = message.tabData;
    generateSummary(tabData, message, sender, sendResponse).then((summary) => {
      console.log("Summary generated:", summary);
    });
    return true; // Indicate that we will respond asynchronously
  }
  if (message?.type == 'generateQuiz') {
    console.log("Generating quiz for message:", message);
    const tabData = message.tabData;
    generateQuizData(tabData, message, sender, sendResponse).then((quiz) => {
      console.log("Quiz generated:", quiz);
    });
    return true; // Indicate that we will respond asynchronously
  }
  if (message?.type == 'generateSuggestions') {
    console.log("Generating suggestions for message:", message);
    generateSuggestionsData(message, sender, sendResponse).then((suggestions) => {
      console.log("Suggestions generated:", suggestions);
    });
    return true; // Indicate that we will respond asynchronously
  }
  return false; // No asynchronous response
});