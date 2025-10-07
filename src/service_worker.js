import { Readability, isProbablyReaderable } from "@mozilla/readability";
import { DOMParser } from "linkedom";
import quizSchema from "../schemas/quiz-schema.json" assert { type: "json" };

async function getModel(type = 'language', options = {}) {
  const isLanguageModel = type === 'language';
  const ModelClass = isLanguageModel ? LanguageModel : Summarizer;

  const modelAvailability = await ModelClass.availability();
  if (modelAvailability != "downloadable" && modelAvailability != "downloading" && modelAvailability != "available") {
    console.error(`${isLanguageModel ? 'Language model' : 'Summarizer'} not available:`, modelAvailability);
    return null;
  }

  return await ModelClass.create({
    ...options,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`${isLanguageModel ? 'Language model' : 'Summarizer'} downloaded ${e.loaded * 100}%`);
      });
    }
  });
}

async function getCurrentTab() {
  let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.url || !tab.title || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))
    return null;
  const tabDOM = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.documentElement.outerHTML,
  });

  return { ...tab, tabOuterHtml: tabDOM[0].result };
}

async function generateData(message, sender, sendResponse) {
  // Get tab and its content
  const tab = await getCurrentTab();
  if (!tab) {
    sendResponse({ success: false, error: 'No sender tab' });
    return;
  }
  const tabDOM = new DOMParser().parseFromString(tab.tabOuterHtml, 'text/html');
  console.log('Tab DOM parsed');

  // Extract main article content using Readability
  if (!isProbablyReaderable(tabDOM)) {
    sendResponse({ success: false, error: 'Page not readerable' });
    return;
  }
  const favicon = tabDOM.querySelector('link[rel="icon"]')?.href || tabDOM.querySelector('link[rel="shortcut icon"]')?.href || null;
  const article = new Readability(tabDOM).parse();

  console.log('Article extracted');

  // Get models
  const summarizer = await getModel('summarizer');
  const languageModel = await getModel('language', {
    type: "tldr",
    length: "long",
    format: "markdown"
  });
  console.log('Models loaded');

  // Summarize
  const summary = await summarizer.summarize(article.textContent);
  console.log('Article summarized');

  let quiz;
  try {
    quiz = JSON.parse(await languageModel.prompt("Generate a quiz of 20 questions based on the following article:\n\n" + article.textContent + "\n\nQuiz:",
      {
        responseConstraint: quizSchema
      }
    ));
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
    quiz
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