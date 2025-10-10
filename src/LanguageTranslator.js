/**
 * LanguageTranslator.js
 * Handles language translation for given text.
 */
import { acquireModel } from './ModelAcquisition.js';

async function createLanguageModel(options = {}) {
    const availability = await Translator.availability({
        sourceLanguage: options.sourceLanguage, 
        targetLanguage: options.targetLanguage
    });
    if (availability !== 'available') {
        throw new Error(`Translation from ${options.sourceLanguage} to ${options.targetLanguage} is not available.`);
    }
    return await acquireModel(
        Translator,
        {
            sourceLanguage: options.sourceLanguage,
            targetLanguage: options.targetLanguage,
            ...options
        }
    );
}

async function translateText(translator, text) {
    return await translator.translate(text);
}