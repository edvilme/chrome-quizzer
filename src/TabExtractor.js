/**
 * TabExtractor.js
 * Handles logic for extracting data from the active browser tab.
 */

import { Readability, isProbablyReaderable } from "@mozilla/readability";
import { DOMParser } from "linkedom";

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
    throw new Error('No sender tab');
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
    throw new Error('Page not readerable');
  }
  
  // Check if the URL points to a non-HTML file (images, PDFs, SVG, etc.)
  // These file types cannot be processed as readable articles
  const nonHtmlExtensions = [
    '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg',
    '.ico', '.mp4', '.mp3', '.avi', '.mov', '.wav', '.zip', '.tar',
    '.gz', '.rar', '.7z', '.doc', '.docx', '.xls', '.xlsx', '.ppt',
    '.pptx', '.xml', '.json', '.css', '.js'
  ];
  
  const urlPath = new URL(tab.url).pathname.toLowerCase();
  if (nonHtmlExtensions.some(ext => urlPath.endsWith(ext))) {
    throw new Error('Page not readerable');
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
    throw new Error('Page not readerable');
  }
  
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
