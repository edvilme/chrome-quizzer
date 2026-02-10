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
 * @param {Object} ModelClass - The model class (e.g. LanguageModel, Summarizer, LanguageDetector, Translator)
 * @param {Object} options - Options to pass to the model constructor
 * @param {string} [name] - Optional name for the model instance
 * @returns {Promise<Object|null>} The created model instance, or null if unavailable
 */
async function acquireModel(ModelClass, options = {}, name = ModelClass.name) {
  // Check in cache
  if (modelsCache[name]) return modelsCache[name]

  let availabilityOptions;
  if (ModelClass == Translator) {
    availabilityOptions = { targetLanguage: options.targetLanguage, sourceLanguage: options.sourceLanguage };
  } else {
    // Pass through relevant options for availability checks (e.g. expectedInputs, type, length, format)
    const { monitor, ...availabilityRelevantOptions } = options;
    availabilityOptions = availabilityRelevantOptions;
  }
  const modelAvailability = await ModelClass.availability(availabilityOptions);

  if (modelAvailability === "unavailable") {
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

  console.log(modelsCache)

  return modelsCache[name]
}

export { acquireModel };
