/**
 * ModelAcquisition.js
 * Handles logic to acquire AI models and check their availability.
 */

/**
 * Acquires a model (LanguageModel or Summarizer) from the Chrome AI API.
 * @param {Object} ModelClass - The model class (window.ai.languageModel or window.ai.summarizer)
 * @param {Object} options - Options to pass to the model constructor
 * @param {string} modelName - Name of the model for logging purposes
 * @returns {Promise<Object|null>} The created model instance, or null if unavailable
 */
async function acquireModel(ModelClass, options = {}, modelName = 'Model') {
  // Check model availability
  const modelAvailability = await ModelClass.availability();
  
  if (modelAvailability !== "downloadable" && 
      modelAvailability !== "downloading" && 
      modelAvailability !== "available") {
    console.error(`${modelName} not available:`, modelAvailability);
    return null;
  }

  // Create the model with download progress monitoring
  return await ModelClass.create({
    ...options,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`${modelName} downloaded ${e.loaded * 100}%`);
      });
    }
  });
}

export { acquireModel };
