import { Readability, isProbablyReaderable } from "@mozilla/readability";
import { DOMParser } from "linkedom";
import quizSchema from "../schemas/quiz-schema.json" assert { type: "json" };

async function getSummarizer() {
  const summarizerAvailability = await Summarizer.availability();
  if (summarizerAvailability != "downloadable" && summarizerAvailability != "downloading" && summarizerAvailability != "available") {
    console.error('Summarizer not available:', summarizerAvailability);
    return null;
  }

  return await Summarizer.create({
    type: "tldr",
    length: "long",
    format: "markdown",
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Summarizer downloaded ${e.loaded * 100}%`);
      });
    }
  });
}

async function getLanguageModel() {
  const modelAvailability = await LanguageModel.availability();
  if (modelAvailability != "downloadable" && modelAvailability != "downloading" && modelAvailability != "available") {
    console.error('Language model not available:', modelAvailability);
    return null;
  }

  return await LanguageModel.create({
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Language model downloaded ${e.loaded * 100}%`);
      });
    }
  });

}

async function getCurrentTab() {
  let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.url || !tab.title || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return null;
  }

  const tabDOM = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.documentElement.outerHTML,
  });

  return { ...tab, document: tabDOM[0].result };
}

async function generateData(message, sender, sendResponse) {
  // Get tab and its content
  const tab = await getCurrentTab();
  if (!tab) {
    sendResponse({ success: false, error: 'No sender tab' });
    return;
  }
  const tabDOM = new DOMParser().parseFromString(tab.document, 'text/html');
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
  const summarizer = await getSummarizer();
  const languageModel = await getLanguageModel();
  console.log('Models loaded');

  // Summarize
  const summary = await summarizer.summarize(article.textContent);
  console.log('Article summarized');

  const quiz = JSON.parse(await languageModel.prompt("Generate a quiz of 20 questions based on the following article:\n\n" + article.textContent + "\n\nQuiz:",
    {
      responseConstraint: quizSchema
    }
  ));
  console.log('Quiz generated');

  // For now return a placeholder quiz; replace with real generation if needed
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