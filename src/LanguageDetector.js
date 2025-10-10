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
    console.log('Language detection response:', response);
    return response
        .sort((a, b) => b.confidence - a.confidence)?.[0]
        ?.detectedLanguage;
}

export { createLanguageDetector, detectLanguage };