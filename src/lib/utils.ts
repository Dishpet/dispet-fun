import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Robustly cleans and parses JSON stored in WordPress content
 * WordPress often wraps content in tags or encodes quotes/entities
 */
export function cleanWordPressJson(renderedContent: string): any {
  if (!renderedContent) return null;

  try {
    // 1. Remove all HTML tags
    let clean = renderedContent.replace(/<[^>]*>?/gm, '').trim();

    // 2. Decode HTML entities (&quot; -> ", etc) using browser's DOM parser
    if (typeof window !== 'undefined') {
      const doc = new DOMParser().parseFromString(clean, "text/html");
      clean = doc.documentElement.textContent || clean;
    }

    // 3. Simple cleanup of common copy-paste artifacts if any
    // Some editors use "smart quotes" which break JSON
    clean = clean.replace(/[\u201C\u201D]/g, '"');

    return JSON.parse(clean);
  } catch (e) {
    console.error("cleanWordPressJson failed:", e);
    return null;
  }
}
