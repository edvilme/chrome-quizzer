# Chrome Quizzer

A Chrome extension that automatically generates comprehension quizzes from any article using on-device AI. No internet required for AI processing—everything runs locally in your browser!

<p align="center">
  <img src="./assets/screenshot.png" alt="Chrome Quizzer Light Mode" width="400"/>
  <img src="./assets/screenshot-dark.png" alt="Chrome Quizzer Dark Mode" width="400"/>
</p>
<p align="center"><em>Light and Dark mode support</em></p>

## ✨ Features

- **📖 Smart Article Extraction** - Automatically extracts main content from web pages using Mozilla's Readability library
- **🤖 On-Device AI** - Leverages Chrome's built-in AI APIs (no external API keys or internet required for AI)
  - AI Summarizer for concise article summaries
  - Language Model for quiz generation
- **📝 Interactive Quizzes** - Generates 20 multiple-choice questions based on article content
- **✅ Instant Feedback** - Click answers to see if you're correct with visual feedback
- **🌓 Dark Mode Support** - Automatic theme switching based on system preferences
- **🎨 Modern UI** - Clean, GitHub-inspired design with smooth animations
- **🔒 Privacy-First** - All AI processing happens on your device

## 🚀 Requirements

- **Chrome 129+** with AI features enabled
- Enable Chrome's AI features:
  1. Navigate to `chrome://flags/#optimization-guide-on-device-model`
  2. Set to "Enabled BypassPerfRequirement"
  3. Navigate to `chrome://flags/#prompt-api-for-gemini-nano`
  4. Set to "Enabled"
  5. Restart Chrome
  6. Confirm AI models are available at `chrome://components/` (look for "Optimization Guide On Device Model")

## 📥 Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/edvilme/chrome-quizzer.git
   cd chrome-quizzer
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

3. Load the extension in Chrome:
   - Open `chrome://extensions` in Chrome
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the `chrome-quizzer` folder

4. The extension icon will appear in your toolbar. Click it to open the side panel!

## 🎯 Usage

1. **Navigate to any article** on the web (blog posts, news articles, documentation, etc.)
2. **Click the Chrome Quizzer icon** in your toolbar to open the side panel
3. **Wait for processing** - The extension will:
   - Extract the article content
   - Generate a summary
   - Create 20 quiz questions
4. **Take the quiz** - Click on answers to test your comprehension
5. **Get instant feedback** - Correct answers turn green, incorrect ones turn red

## 🛠️ Development

### Project Structure

```
chrome-quizzer/
├── assets/           # Extension icons and screenshots
├── schemas/          # JSON schemas for AI responses
├── src/              # Source code
│   └── service_worker.js  # Background script (AI processing)
├── static/           # Side panel UI
│   ├── sidepanel.html
│   ├── sidepanel.js
│   └── sidepanel.css
├── manifest.json     # Extension configuration
└── package.json      # Dependencies
```

### Building

```bash
npm run build
```

This bundles the service worker with esbuild, including all dependencies.

### Debugging

- **Service Worker**: Check `chrome://serviceworker-internals` or the extensions page for console logs
- **Side Panel**: Right-click the side panel → "Inspect" to open DevTools

## 🔧 Technologies Used

- **Chrome Extension APIs**: Manifest V3, Side Panel API, Scripting API
- **Chrome AI APIs**: Built-in Language Model and Summarizer
- **Mozilla Readability**: Article content extraction
- **linkedom**: Server-side DOM parsing
- **esbuild**: Fast bundling

## 📄 License

[Add your license here]

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## ⚠️ Known Limitations

- Only works on pages with readable article content
- Requires Chrome's experimental AI features to be enabled
- AI models need to be downloaded on first use (may take a few minutes)
- Quiz quality depends on article content and AI model capabilities
