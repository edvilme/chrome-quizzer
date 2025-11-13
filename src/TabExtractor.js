/**
 * TabExtractor.js
 * Handles logic for extracting data from the active browser tab.
 */


import { Readability, isProbablyReaderable } from "@mozilla/readability";
import { DOMParser } from "linkedom";
import { acquireModel } from "./ModelAcquisition";
import { detectLanguage } from "./LanguageDetector";

// These are special browser-specific protocols that cannot be scraped
const internalPagePrefixes = [
  'chrome://',
  'chrome-extension://',
  'edge://',
  'brave://',
  'arc://',
  'about:'
];

class TabExtractionError extends Error {
  constructor(message) {
    super(message);
    this.name = "TabExtractionError";
  }
}

async function extractTabDom(){
  const contentType = document.contentType || '';
  // If HTML
  if (contentType.includes('html') || contentType.includes('text')) {
    return document.documentElement.outerHTML;
  }
  // If PDF - dynamically load PDF.js in the webpage context
  if (contentType.includes('pdf')){
    try {
      const fullText = await window.__extractPdfText();
      // Wrap in HTML structure for consistency
      return `<html><head><title>PDF Document</title></head><body><article><div class="pdf-content">${fullText.trim()}</div></article></body></html>`;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return `<html><body>Error parsing PDF: ${error.message}</body></html>`;
    }
  }
  return null;
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
  if (!tab || !tab.url || !tab.title || internalPagePrefixes.some(prefix => tab.url.startsWith(prefix))) {
    throw new TabExtractionError('No valid active tab found');
  }

  // Get favicon URL
  const favicon = tab.favIconUrl || null;

  // Extract the DOM from the tab
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['dist/pdf_extractor.js']
  });
  const tabDOM = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractTabDom
  });
  
  console.log('Extracted tab DOM:', tabDOM);

  const domContent = tabDOM[0].result;
  
  // If we couldn't extract content (unsupported document type), throw error
  if (!domContent) {
    throw new TabExtractionError('Page not readerable - content could not be extracted');
  }
  
  // Parse the DOM
  const dom = new DOMParser().parseFromString(domContent, 'text/html');
  
  // Check if page is readerable
  if (!isProbablyReaderable(dom)) {
    throw new TabExtractionError('Page not readerable');
  }
    
  // Extract article content
  const article = new Readability(dom).parse();

  // Detect language
  const languageDetector = await acquireModel(LanguageDetector, {}, 'language-detector');
  const detectedLanguage = await detectLanguage(languageDetector, article?.textContent || tab.title);
  console.log('Detected language:', detectedLanguage);

  // Translate to English if not already
  if (detectedLanguage !== 'en') {
    const translator = await acquireModel(Translator, {
      sourceLanguage: detectedLanguage,
      targetLanguage: 'en'
    }, `translator-${detectedLanguage}-en`);
    if (article?.textContent) {
      article.textContent = await translator.translate(article.textContent);
    }
    if (article?.title) {
      article.title = await translator.translate(article.title);
    }
    if (tab.title) {
      tab.title = await translator.translate(tab.title);
    }
  }

  // Return the extracted data
  
  return {
    title: tab.title,
    domContent,
    favicon,
    article,
    language: detectedLanguage
  };
}

export { extractTabData };
