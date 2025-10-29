/**
 * ModelAcquisition.js
 * Handles logic to acquire AI models and check their availability.
 */

/**
 * Cache for acquired models to avoid redundant downloads.
 */
const modelsCache = {}

class ModelAcquisitionError extends Error {
  constructor(message) {
    super(message);
    this.name = "ModelAcquisitionError";
  }
}

/**
 * Acquires a model (LanguageModel or Summarizer) from the Chrome AI API.
 * @param {Object} ModelClass - The model class (window.ai.languageModel or window.ai.summarizer)
 * @param {Object} options - Options to pass to the model constructor
 * @param {string} [name] - Optional name for the model instance
 * @returns {Promise<Object|null>} The created model instance, or null if unavailable
 */
async function acquireModel(ModelClass, options = {}, name = ModelClass.name) {
  // Check in cache
  if (modelsCache[name]) return modelsCache[name]

  const modelAvailability = ModelClass == Translator 
    ? await ModelClass.availability({ targetLanguage: options.targetLanguage, sourceLanguage: options.sourceLanguage })
    : await ModelClass.availability();

  if (modelAvailability !== "downloadable" && 
      modelAvailability !== "downloading" && 
      modelAvailability !== "available") {
    // Throw error
    throw new ModelAcquisitionError(`${ModelClass} not available: ${modelAvailability}`);
  }

  // Create the model with download progress monitoring
  modelsCache[name] = await ModelClass.create({
    ...options,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`${ModelClass} (${name}) downloaded ${e.loaded * 100}%`);
      });
    }
  });

  await modelsCache[name].ready;

  console.log(modelsCache)

  return modelsCache[name]
}

export { acquireModel };
