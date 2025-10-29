/** 
 * LanguageDetector.js
 * Handles language detection for given text.
 */

async function detectLanguage(languageDetector, text) {
    const response = await languageDetector.detect(text);
    return response
        .sort((a, b) => b.confidence - a.confidence)[0]
        ?.detectedLanguage;
}

export { detectLanguage };