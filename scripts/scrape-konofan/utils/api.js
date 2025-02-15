import { KONOFAN_API_BASE } from "./config.js";

/**
 * Makes a request to the KonoFan Fandom API
 * @param {string} page - The page to fetch
 * @param {Object} params - Additional API parameters
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function fetchWikiPage(page, params = {}) {
  const queryParams = new URLSearchParams({
    action: "parse",
    page,
    format: "json",
    ...params,
  });

  const response = await fetch(`${KONOFAN_API_BASE}?${queryParams}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${page}: ${response.status}`);
  }

  return response.json();
}

/**
 * Decodes HTML entities and cleans up wiki text
 * @param {string} html - Raw HTML string from wiki
 * @returns {string} Cleaned HTML string
 */
export function cleanWikiHtml(html) {
  return html
    .replace(/\\u003C/g, "<")
    .replace(/\\u003E/g, ">")
    .replace(/\\u002F/g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/\\u0027/g, "'")
    .replace(/\\u0022/g, '"')
    .replace(/\\n/g, "")
    .replace(/\\t/g, "");
}
