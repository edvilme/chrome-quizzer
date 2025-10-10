import { createLanguageModel, generateQuiz } from "./LanguageModel.js";
import { createSummarizer, summarizeText } from "./Summarizer.js";
import { createLanguageDetector, detectLanguage } from "./LanguageDetector.js";
import { extractTabData } from "./TabExtractor.js";

async function generateData(message, sender, sendResponse) {
  // Extract tab data
  let tabData;
  try {
    tabData = await extractTabData();
    console.log('Tab data extracted');
  } catch (err) {
    sendResponse({ success: false, error: err.message });
    return;
  }
  
  const { favicon, article } = tabData;

  // Get models
  const summarizer = await createSummarizer({
    type: "tldr",
    length: "long",
    format: "markdown"
  });
  const languageModel = await createLanguageModel();
  const languageDetector = await createLanguageDetector();
  console.log('Models loaded');

  // Summarize
  const summary = await summarizeText(summarizer, article.textContent);
  console.log('Article summarized');

  // Detect language
  const language = await detectLanguage(languageDetector, article.textContent) 

  let quiz;
  try {
    quiz = await generateQuiz(languageModel, article.textContent);
    console.log('Quiz generated');
  } catch (err) {
    console.error('Failed to parse quiz JSON:', err);
    sendResponse({
      success: false,
      error: 'Quiz generation failed: invalid JSON returned by language model'
    });
    return;
  }

  sendResponse({
    success: true,
    favicon,
    article,
    summary,
    quiz,
    language
  });
}


// Allows users to open the side panel by clicking on the action toolbar icon
// Prefer the declarative behavior, and also register an explicit click handler
// as a fallback for environments that don't open the panel automatically.
// Minimal service worker: enable opening the side panel on action click
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => { });
}

// Listen for messages from the side panel (or other extension pages)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type == 'getTabArticle') {
    generateData(message, sender, sendResponse);
    return true; // Indicate that we will respond asynchronously
  }
});