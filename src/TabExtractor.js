/**
 * TabExtractor.js
 * Handles logic for extracting data from the active browser tab.
 */

import { Readability, isProbablyReaderable } from "@mozilla/readability";
import { DOMParser } from "linkedom";

/**
 * Gets the current active tab and validates it's a web page.
 * @returns {Promise<Object|null>} Tab object with outerHTML, or null if invalid
 * @throws {Error} If tab is not a valid web page (chrome://, chrome-extension://, etc.)
 */
async function getCurrentTab() {
  let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  
  // Validate tab exists and has valid URL
  if (!tab || !tab.url || !tab.title) {
    return null;
  }
  
  // Check if it's a chrome internal page
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return null;
  }
  
  // Extract the DOM from the tab
  const tabDOM = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.documentElement.outerHTML,
  });

  return { ...tab, tabOuterHtml: tabDOM[0].result };
}

/**
 * Extracts the favicon from a parsed DOM.
 * @param {Document} dom - The parsed DOM document
 * @returns {string|null} The favicon URL or null if not found
 */
function extractFavicon(dom) {
  const iconLink = dom.querySelector('link[rel="icon"]');
  const shortcutIconLink = dom.querySelector('link[rel="shortcut icon"]');
  return iconLink?.href || shortcutIconLink?.href || null;
}

/**
 * Parses HTML string into a DOM document.
 * @param {string} html - The HTML string to parse
 * @returns {Document} The parsed DOM document
 */
function parseDOM(html) {
  return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * Checks if a page is readerable (can be processed by Readability).
 * @param {Document} dom - The parsed DOM document
 * @returns {boolean} True if the page is readerable
 */
function isPageReaderable(dom) {
  return isProbablyReaderable(dom);
}

/**
 * Extracts article content from a DOM using Readability.
 * @param {Document} dom - The parsed DOM document
 * @returns {Object} The parsed article object with title, content, etc.
 */
function extractArticle(dom) {
  return new Readability(dom).parse();
}

/**
 * Extracts all relevant data from the current active tab.
 * @returns {Promise<Object>} Object containing tab data, DOM, favicon, and article
 * @throws {Error} If no valid tab is found or page is not readerable
 */
async function extractTabData() {
  // Get the active tab
  const tab = await getCurrentTab();
  if (!tab) {
    throw new Error('No sender tab');
  }
  
  // Parse the DOM
  const dom = parseDOM(tab.tabOuterHtml);
  
  // Check if page is readerable
  if (!isPageReaderable(dom)) {
    throw new Error('Page not readerable');
  }
  
  // Extract data
  const favicon = extractFavicon(dom);
  const article = extractArticle(dom);
  
  return {
    tab,
    dom,
    favicon,
    article
  };
}

export {
  getCurrentTab,
  extractFavicon,
  parseDOM,
  isPageReaderable,
  extractArticle,
  extractTabData
};
