import { Readability } from "@mozilla/readability";
import { DOMParser } from "linkedom";

async function getSummarizer() {
  const summarizerAvailability = await Summarizer.availability();
  if (summarizerAvailability != "downloadable" && summarizerAvailability != "downloading") {
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
  if (modelAvailability != "downloadable" && modelAvailability != "downloading") {
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

async function generateQuiz(message, sender, sendResponse) {
  // Get tab and its content
  const tab = await getCurrentTab();
  if (!tab) {
    sendResponse({ success: false, error: 'No sender tab' });
    return;
  }
  const tabDOM = new DOMParser().parseFromString(tab.document, 'text/html');

  // Extract main article content using Readability
  const article = new Readability(tabDOM).parse();

  // Summarize
  const summarizer = await getSummarizer();
  const summary = await summarizer.summarize(article.textContent);

  // Language model
  const languageModel = await getLanguageModel();
  const quiz = languageModel.prompt("Generate a quiz based on the following article:\n\n" + article.textContent + "\n\nQuiz:");

  // For now return a placeholder quiz; replace with real generation if needed
  sendResponse({ success: true, article: article.textContent });
  console.log('Service worker: quiz response sent');
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
    generateQuiz(message, sender, sendResponse);
    return true; // Indicate that we will respond asynchronously
  }
});