/**
 * TabExtractor.js
 * Handles logic for extracting data from the active browser tab.
 */

import { Readability, isProbablyReaderable } from "@mozilla/readability";
import { DOMParser } from "linkedom";

class TabExtractionError extends Error {
  constructor(message) {
    super(message);
    this.name = "TabExtractionError";
  }
}

/**
 * Extracts all relevant data from the current active tab.
 * Gets the current tab, validates it's a webpage (not browser internal pages),
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
    throw new TabExtractionError('No valid active tab found');
  }
  
  // Check if it's a browser internal page - send error if not a webpage
  // These are special browser-specific protocols that cannot be scraped
  const internalPagePrefixes = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'brave://',
    'arc://',
    'about:'
  ];
  
  if (internalPagePrefixes.some(prefix => tab.url.startsWith(prefix))) {
    throw new TabExtractionError('Page not readerable');
  }
  
  // Extract the DOM from the tab
  const tabDOM = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Check if the document is actually an HTML document
      if (document.contentType && !document.contentType.includes('html') && !document.contentType.includes('text')) {
        return null;
      }
      return document.documentElement.outerHTML;
    },
  });
  
  const domContent = tabDOM[0].result;
  
  // If we couldn't extract content (non-HTML document), throw error
  if (!domContent) {
    throw new TabExtractionError('Page not readerable');
  }
  
  // Parse the DOM
  const dom = new DOMParser().parseFromString(domContent, 'text/html');
  
  // Check if page is readerable
  if (!isProbablyReaderable(dom)) {
    throw new TabExtractionError('Page not readerable');
  }
  
  const favicon = tab.favIconUrl || null;
  
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
