export interface QuizQuestion {
  title: string;
  options: string[];
  answer: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface Article {
  title: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  byline: string;
  dir: string;
  siteName: string;
  lang: string;
}

export interface TabInfo extends chrome.tabs.Tab {
  tabOuterHtml: string;
}

export interface GenerateDataResponse {
  success: boolean;
  favicon?: string | null;
  article?: Article;
  summary?: string;
  quiz?: Quiz;
  error?: string;
}

export interface PageElements {
  btn: HTMLButtonElement;
  summary: HTMLElement;
  summaryTitle: HTMLElement;
  quiz: HTMLElement;
  favicon: HTMLImageElement;
  title: HTMLElement;
}
