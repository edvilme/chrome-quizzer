/**
 * ModelAcquisition.js
 * Handles logic to acquire AI models and check their availability.
 */

const modelsCache = {}

/**
 * Acquires a model (LanguageModel or Summarizer) from the Chrome AI API.
 * @param {Object} ModelClass - The model class (window.ai.languageModel or window.ai.summarizer)
 * @param {Object} options - Options to pass to the model constructor
 * @returns {Promise<Object|null>} The created model instance, or null if unavailable
 */
async function acquireModel(ModelClass, options = {}) {
  // Check in cache
  if (modelsCache[ModelClass]) return modelsCache[ModelClass]

  // Check model availability
  const modelAvailability = await ModelClass.availability();
  
  if (modelAvailability !== "downloadable" && 
      modelAvailability !== "downloading" && 
      modelAvailability !== "available") {
    console.error(`${ModelClass} not available:`, modelAvailability);
    return null;
  }

  // Create the model with download progress monitoring
  modelsCache[ModelClass] = await ModelClass.create({
    ...options,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`${ModelClass} downloaded ${e.loaded * 100}%`);
      });
    }
  });

  return modelsCache[ModelClass]
}

export { acquireModel };
