/**
 * ErrorHandler - Centralized error handling utility for Chrome Quizzer UI
 * Provides consistent error messages and UI feedback across the extension
 */

/**
 * Error types with user-friendly messages
 */
export const ErrorTypes = {
  MODEL_LOAD_FAILED: {
    title: 'AI Model Loading Failed',
    message: 'Unable to load the AI model. Please ensure Chrome AI features are enabled and models are downloaded.',
    canRetry: true
  },
  SUMMARY_GENERATION_FAILED: {
    title: 'Summary Generation Failed',
    message: 'Unable to generate a summary for this article. The content might be too complex or the AI model may be unavailable.',
    canRetry: true
  },
  QUIZ_GENERATION_FAILED: {
    title: 'Quiz Generation Failed',
    message: 'Unable to generate quiz questions for this article. Please try again or visit a different page.',
    canRetry: true
  },
  CROSSWORD_GENERATION_FAILED: {
    title: 'Crossword Generation Failed',
    message: 'Unable to generate a crossword puzzle for this article. The content might not be suitable for crossword generation.',
    canRetry: true
  },
  SUGGESTIONS_FAILED: {
    title: 'Suggestions Unavailable',
    message: 'Unable to generate learning suggestions. Please try again later.',
    canRetry: true
  },
  TAB_EXTRACTION_FAILED: {
    title: 'Content Extraction Failed',
    message: 'Unable to extract content from this page. The page might not contain readable article content.',
    canRetry: false
  },
  PAGE_NOT_READABLE: {
    title: 'Page Not Readable',
    message: 'This page does not contain readable article content. Please navigate to a blog post, news article, or documentation page.',
    canRetry: false
  },
  UNKNOWN_ERROR: {
    title: 'An Error Occurred',
    message: 'Something went wrong. Please try again.',
    canRetry: true
  }
};

/**
 * Maps error messages from service worker to error types
 * @param {string} errorMessage - The error message from the service worker
 * @returns {Object} ErrorType object with title, message, and canRetry
 */
export function getErrorType(errorMessage) {
  if (!errorMessage) return ErrorTypes.UNKNOWN_ERROR;
  
  const message = errorMessage.toLowerCase();
  
  if (message.includes('load') && (message.includes('model') || message.includes('language'))) {
    return ErrorTypes.MODEL_LOAD_FAILED;
  }
  if (message.includes('summary')) {
    return ErrorTypes.SUMMARY_GENERATION_FAILED;
  }
  if (message.includes('quiz')) {
    return ErrorTypes.QUIZ_GENERATION_FAILED;
  }
  if (message.includes('crossword')) {
    return ErrorTypes.CROSSWORD_GENERATION_FAILED;
  }
  if (message.includes('suggestion')) {
    return ErrorTypes.SUGGESTIONS_FAILED;
  }
  if (message.includes('not readerable') || message.includes('page not readable')) {
    return ErrorTypes.PAGE_NOT_READABLE;
  }
  if (message.includes('tab') || message.includes('extract')) {
    return ErrorTypes.TAB_EXTRACTION_FAILED;
  }
  
  return ErrorTypes.UNKNOWN_ERROR;
}

/**
 * Creates an error message element for display in the UI
 * @param {Object} errorType - The error type object
 * @param {Function} onRetry - Optional callback for retry action
 * @returns {HTMLElement} The error message element
 */
export function createErrorElement(errorType, onRetry = null) {
  const errorContainer = document.createElement('div');
  errorContainer.className = 'error-container';
  
  const errorIcon = document.createElement('div');
  errorIcon.className = 'error-icon';
  errorIcon.textContent = '⚠️';
  
  const errorContent = document.createElement('div');
  errorContent.className = 'error-content';
  
  const errorTitle = document.createElement('h3');
  errorTitle.className = 'error-title';
  errorTitle.textContent = errorType.title;
  
  const errorMessage = document.createElement('p');
  errorMessage.className = 'error-message';
  errorMessage.textContent = errorType.message;
  
  errorContent.appendChild(errorTitle);
  errorContent.appendChild(errorMessage);
  
  errorContainer.appendChild(errorIcon);
  errorContainer.appendChild(errorContent);
  
  if (errorType.canRetry && onRetry) {
    const retryButton = document.createElement('button');
    retryButton.className = 'error-retry-button';
    retryButton.textContent = 'Retry';
    retryButton.addEventListener('click', onRetry);
    errorContainer.appendChild(retryButton);
  }
  
  return errorContainer;
}

/**
 * Displays an error in a container element
 * @param {HTMLElement} container - The container to display the error in
 * @param {string} errorMessage - The error message from the service worker
 * @param {Function} onRetry - Optional callback for retry action
 */
export function displayError(container, errorMessage, onRetry = null) {
  const errorType = getErrorType(errorMessage);
  const errorElement = createErrorElement(errorType, onRetry);
  
  container.innerHTML = '';
  container.appendChild(errorElement);
  container.setAttribute('data-status', 'error');
}

/**
 * Clears error state from a container element
 * @param {HTMLElement} container - The container to clear error state from
 */
export function clearError(container) {
  container.removeAttribute('data-status');
}

/**
 * Logs error to console with context
 * @param {string} context - The context where the error occurred
 * @param {Error|string} error - The error object or message
 */
export function logError(context, error) {
  console.error(`[${context}]`, error);
}
