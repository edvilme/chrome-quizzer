// Type definitions for Chrome's experimental AI APIs
// These are not yet included in @types/chrome

interface AIModelDownloadProgressEvent extends Event {
  loaded: number;
  total: number;
}

interface AIModelMonitor extends EventTarget {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: AIModelDownloadProgressEvent) => void
  ): void;
}

interface AIModelCreateOptions {
  monitor?: (monitor: AIModelMonitor) => void;
  signal?: AbortSignal;
}

interface LanguageModelCreateOptions extends AIModelCreateOptions {
  type?: 'tldr' | 'key-points' | 'teaser' | 'headline';
  length?: 'short' | 'medium' | 'long';
  format?: 'plain-text' | 'markdown';
}

interface LanguageModelPromptOptions {
  responseConstraint?: object;
  signal?: AbortSignal;
}

interface LanguageModelInterface {
  prompt(input: string, options?: LanguageModelPromptOptions): Promise<string>;
  destroy(): void;
}

interface SummarizerInterface {
  summarize(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  destroy(): void;
}

type AIModelAvailability = 'no' | 'readily' | 'after-download' | 'downloadable' | 'downloading' | 'available';

interface LanguageModelClass {
  availability(): Promise<AIModelAvailability>;
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelInterface>;
}

interface SummarizerClass {
  availability(): Promise<AIModelAvailability>;
  create(options?: AIModelCreateOptions): Promise<SummarizerInterface>;
}

declare const LanguageModel: LanguageModelClass;
declare const Summarizer: SummarizerClass;
