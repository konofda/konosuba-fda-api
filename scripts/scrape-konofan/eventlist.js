import { fetchWikiPage, cleanWikiHtml } from "./utils/api.js";
import { saveJsonToFile } from "./utils/fs.js";
import { OUTPUT_FILES } from "./utils/config.js";
import { isMainModule } from "./utils/runtime.js";

/**
 * Filters and formats event links from wiki data
 * @param {Array} links - Raw links from wiki API
 * @returns {Array<string>} Filtered event names
 */
function extractEventNames(links) {
  return links
    .map((link) => link["*"])
    .filter((link) => link && !link.startsWith("Category:") && !link.startsWith("Template:"))
    .map((link) => link.replace("Event:", ""));
}

/**
 * Validates that we have matching images for all events
 * @param {Array<string>} names - Event names
 * @param {Array<string>} images - Event images
 */
function validateImageCount(names, images) {
  if (names.length !== images.length) {
    console.warn(`⚠️  Warning: Number of events (${names.length}) doesn't match number of images (${images.length})`);
  }
}

/**
 * Creates event objects with name, image, and URL
 * @param {Array<string>} names - Event names
 * @param {Array<string>} images - Event images
 * @returns {Array<Object>} Event objects
 */
function createEventObjects(names, images) {
  validateImageCount(names, images);
  return names.map((name, index) => ({
    name,
    image: images[index] || null,
    fandomUrl: `https://konofan.fandom.com/wiki/Event:${name}`,
  }));
}

/**
 * Fetches and processes KonoFan event data
 * @param {Object} options - Options for fetching events
 * @param {boolean} [options.includeWikiHtml=false] - Whether to include the wiki HTML in the output
 */
async function getKonoFanEvents({ includeWikiHtml = false } = {}) {
  try {
    const data = await fetchWikiPage("Events");
    const { links, images } = data.parse;

    const eventNames = extractEventNames(links);
    const events = createEventObjects(eventNames, images);

    const output = { events };
    if (includeWikiHtml) {
      output.wikiHtml = cleanWikiHtml(data.parse.text["*"]);
    }

    await saveJsonToFile(OUTPUT_FILES.EVENTS, output);
    return output;
  } catch (error) {
    console.error("❌ Error fetching event data:", error);
    throw error;
  }
}

// Run if called directly
if (isMainModule(import.meta.url)) {
  getKonoFanEvents();
}

export { getKonoFanEvents };
