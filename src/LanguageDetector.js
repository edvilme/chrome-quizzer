/** 
 * LanguageDetector.js
 * Handles language detection for given text.
 */

import { acquireModel } from './ModelAcquisition.js';

async function createLanguageDetector(options = {}) {
    return await acquireModel(
        LanguageDetector,
        options
    );
}

async function detectLanguage(languageDetector, text) {
    const response = await languageDetector.detect(text);
    return response[0]?.language;
}

export { createLanguageDetector, detectLanguage };