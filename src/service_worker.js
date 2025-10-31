/**
 * Service Worker for Chrome Quizzer Extension
 * This file contains the logic for handling background tasks, including data extraction,
 * summarization, quiz generation, and suggestion generation. It also manages communication
 * between the extension's components and the Chrome browser.
 */

import { generateQuiz, generateSuggestions, generateWordGames, generateFlashCard } from "./LanguageModel.js";
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
    console.error('Error extracting tab data:', err);
    sendResponse({ success: false, error: err.message, errorType: 'tab-data-error' });
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
    sendResponse({ success: false, error: 'Failed to load summarization model', errorType: 'model-loading-error' });
    return;
  }

  let summary;
  try {
    summary = await summarizeText(summarizer, article.textContent);
    sendResponse({ success: true, summary });
    return summary;
  } catch (err) {
    sendResponse({ success: false, error: 'Failed to generate summary', errorType: 'summary-error' });
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
    sendResponse({ success: false, error: 'Failed to load language model', errorType: 'model-loading-error' });
    return;
  }

  let quiz;
  try {
    quiz = await generateQuiz(languageModel, article.textContent);
    sendResponse({ success: true, quiz });
    return quiz;
  } catch (err) {
    sendResponse({ success: false, error: 'Failed to generate quiz', errorType: 'quiz-error' });
    return;
  }
}

/**
 * Preloads suggestion data based on the user's answer history.
 * @param {Function} callback - Callback to send a response back to the sender.
 * @returns {Promise<Object|null>} - The preloaded suggestions or null in case of an error.
 */
async function preloadSuggestionsData(callback = () => {}) {
  let languageModel;
  try {
    languageModel = await acquireModel(LanguageModel, {}, 'suggestion-generator');
  } catch (err) {
    callback({ success: false, error: 'Failed to load language model', errorType: 'model-loading-error' });
    return;
  }
  const answers = (await chrome.storage.local.get('answerHistory')).answerHistory || [];

  let followupSuggestions;
  try {
    followupSuggestions = await generateSuggestions(languageModel, answers);
    console.log("Generated follow-up suggestions:", followupSuggestions);
    // Cache the generated suggestions
    await chrome.storage.local.set({ followupSuggestions });
    callback({ success: true, suggestions: followupSuggestions });
    return followupSuggestions;
  } catch (err) {
    callback({ success: false, error: 'Failed to generate suggestions', errorType: 'suggestions-error' });
    return;
  }
}

/**
 * Generates crossword data based on the given tab data.
 * @param {Object} tabData - The data extracted from the tab.
 * @param {Object} message - The message object sent to the service worker.
 * @param {Object} sender - The sender of the message.
 * @param {Function} sendResponse - Callback to send a response back to the sender.
 * @returns {Promise<Object|null>} - The generated crossword data or null in case of an error.
 */
async function generateCrosswordData(tabData, message, sender, sendResponse) {
  const { article } = tabData;
  let languageModel;
  try {
    languageModel = await acquireModel(LanguageModel, {}, 'crossword-generator');
  } catch (err) {
    sendResponse({ success: false, error: 'Failed to load language model', errorType: 'model-loading-error' });
    return;
  }
  let crosswordLayout;
  try {
    crosswordLayout = await generateWordGames(languageModel, article.textContent);
    sendResponse({ success: true, crosswordLayout });
    return crosswordLayout;
  } catch (err) {
    sendResponse({ success: false, error: 'Failed to generate crossword', errorType: 'crossword-error' });
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
    sendResponse?.({ success: true, suggestions: cachedData.followupSuggestions });
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

chrome.runtime.onInstalled.addListener(() => {
  // Create an alarm to periodically refresh suggestions based on answer history
  chrome.alarms.clear('refreshSuggestions');
  chrome.alarms.create('refreshSuggestions', { periodInMinutes: 60 });
  // Add context menu item to open the dashboard
  chrome.contextMenus.create({
    id: 'add-flashcard',
    title: 'Quizzer: Add Flashcard',
    contexts: ['selection'],
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'refreshSuggestions') {
    console.log("Refreshing suggestions based on updated answer history.");
    await preloadSuggestionsData();
    try {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/quizzer_icon_128x128.png'),
        title: 'Quizzer Suggestions Updated',
        message: 'Your quiz suggestions have been refreshed based on your latest answers.',
        requireInteraction: false,
        silent: true
      });
    } catch (err) {
      console.error("Failed to create notification:", err);
    }
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'add-flashcard') {
    const text = info.selectionText || '';
    let languageModel;
    try {
      languageModel = await acquireModel(LanguageModel, {}, 'flashcard-generator');
    } catch (err) {
      console.error('Failed to load language model for flashcard generation:', err);
      return;
    }
    try {
      const newFlashcard = await generateFlashCard(languageModel, text);
      console.log('Generated flashcard:', newFlashcard);
      // Store or display the flashcard as needed
      const existingFlashcards = (await chrome.storage.local.get('flashcards')).flashcards || [];
      existingFlashcards.push(newFlashcard);
      await chrome.storage.local.set({ flashcards: existingFlashcards });
      console.log('Flashcard saved to storage.', existingFlashcards);
    } catch (err) {
      console.error('Failed to generate flashcard:', err);
    }
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
  if (message?.type == 'generateCrossword') {
    console.log("Generating crossword for message:", message);
    const tabData = message.tabData;
    generateCrosswordData(tabData, message, sender, sendResponse).then((crosswordLayout) => {
      console.log("Crossword generated:", crosswordLayout);
    });
    return true; // Indicate that we will respond asynchronously
  }
  return false; // No asynchronous response
});