/**
 * pdf_extractor.js
 * Standalone PDF text extraction using PDF.js
 * This file is bundled separately and injected as a content script
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for PDF.js
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38';
pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.mjs`;

/**
 * Extracts text from a PDF document
 */
async function extractPdfText() {
  try {
    const contentType = document.contentType || '';
    
    if (!contentType.includes('pdf')) return null;
    
    // Load the PDF document from current page
    const loadingTask = pdfjsLib.getDocument(document.location.href);
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items from the page
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return `Error parsing PDF: ${error.message}`;
  }
}

// Make it available globally for the injected script
window.__extractPdfText = extractPdfText;
