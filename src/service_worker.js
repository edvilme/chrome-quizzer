import { createLanguageModel, generateQuiz } from "./LanguageModel.js";
import { createSummarizer, summarizeText } from "./Summarizer.js";
import { extractTabData } from "./TabExtractor.js";

async function getTabData(message, sender, sendResponse) {
  try {
    const tabData = await extractTabData();
    sendResponse({ success: true, tabData });
    return tabData;
  } catch (err) {
    sendResponse({ success: false, error: err.message });
    return null;
  }
}

async function generateSummary(tabData, message, sender, sendResponse) {
  const { article } = tabData;
  let summarizer;
  try {
    summarizer = await createSummarizer({
      type: "tldr",
      length: "long",
      format: "markdown"
    });
  } catch (err) {
    sendResponse({ success: false, error: 'Failed to load summarization model' });
    return;
  }

  let summary;
  try {
    summary = await summarizeText(summarizer, article.textContent);
    sendResponse({ success: true, summary });
    return summary;
  } catch (err) {
    sendResponse({ success: false, error: 'Failed to generate summary' });
    return;
  }
}

async function generateQuizData(tabData, message, sender, sendResponse) {
  const { article } = tabData;
  let languageModel;
  try {
    languageModel = await createLanguageModel();
  } catch (err) {
    sendResponse({ success: false, error: 'Failed to load language model' });
    return;
  }

  let quiz;
  try {
    quiz = await generateQuiz(languageModel, article.textContent);
    sendResponse({ success: true, quiz });
    return quiz;
  } catch (err) {
    sendResponse({ success: false, error: 'Failed to generate quiz' });
    return;
  }
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
  if (message?.type == 'getTab') {
    getTabData(message, sender, sendResponse).then(tabData => {
      console.log("Tab data requested:", tabData);
    });
    return true; // Indicate that we will respond asynchronously
  }
  if (message?.type == 'generateSummary') {
    console.log("Generating summary for message:", message);
    const tabData = message.tabData;
    generateSummary(tabData, message, sender, sendResponse).then((summary) => {
      console.log("Summary generated:", summary);
    });
    return true; // Indicate that we will respond asynchronously
  }
  if (message?.type == 'generateQuiz') {
    console.log("Generating quiz for message:", message);
    const tabData = message.tabData;
    generateQuizData(tabData, message, sender, sendResponse).then((quiz) => {
      console.log("Quiz generated:", quiz);
    });
    return true; // Indicate that we will respond asynchronously
  }
  return false; // No asynchronous response
});