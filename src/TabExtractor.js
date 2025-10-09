/**
 * TabExtractor.js
 * Handles logic for extracting data from the active browser tab.
 */

import { Readability, isProbablyReaderable } from "@mozilla/readability";
import { DOMParser } from "linkedom";

/**
 * Extracts all relevant data from the current active tab.
 * Gets the current tab, validates it's a webpage (not chrome:// or chrome-extension://),
 * and returns a JSON object with title, domContent, article, favicon, etc.
 * 
 * @returns {Promise<Object>} Object containing title, domContent, favicon, and article
 * @throws {Error} If no valid tab is found or page is not readerable
 */
async function extractTabData() {
  // Get the current active tab
  let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  
  // Validate tab exists and has valid URL
  if (!tab || !tab.url || !tab.title) {
    throw new Error('No sender tab');
  }
  
  // Check if it's a chrome internal page - send error if not a webpage
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    throw new Error('Page not readerable');
  }
  
  // Extract the DOM from the tab
  const tabDOM = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.documentElement.outerHTML,
  });
  
  const domContent = tabDOM[0].result;
  
  // Parse the DOM
  const dom = new DOMParser().parseFromString(domContent, 'text/html');
  
  // Check if page is readerable
  if (!isProbablyReaderable(dom)) {
    throw new Error('Page not readerable');
  }
  
  // Extract favicon
  const iconLink = dom.querySelector('link[rel="icon"]');
  const shortcutIconLink = dom.querySelector('link[rel="shortcut icon"]');
  const favicon = iconLink?.href || shortcutIconLink?.href || null;
  
  // Extract article content
  const article = new Readability(dom).parse();
  
  return {
    title: tab.title,
    domContent,
    favicon,
    article
  };
}

export { extractTabData };
