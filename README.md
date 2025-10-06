Chrome Quizzer — Development notes

Load this unpacked extension in Chrome to test the side panel.

Steps:

1. Open chrome://extensions in Chrome.
2. Enable "Developer mode" (top-right).
3. Click "Load unpacked" and choose this repository folder.
4. The extension icon will appear in the toolbar. Click it to open the side panel.

Notes:
- This extension uses Manifest V3 and the side panel API. Ensure your Chrome supports the side panel APIs.
- If the side panel doesn't open, check DevTools for the service worker (chrome://serviceworker-internals or from the extensions page) for console logs.
