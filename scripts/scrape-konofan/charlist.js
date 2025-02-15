import { cleanWikiHtml, fetchWikiPage } from "./utils/api.js";
import { OUTPUT_FILES } from "./utils/config.js";
import { saveJsonToFile } from "./utils/fs.js";
import { isMainModule } from "./utils/runtime.js";

/**
 * Filters and formats character links from wiki data
 * @param {Array} links - Raw links from wiki API
 * @returns {Array<string>} Filtered character names
 */
function extractCharacterNames(links) {
  return links
    .map((link) => link["*"])
    .filter((link) => link && !link.startsWith("Category:") && !link.startsWith("Template:"))
    .map((link) => link.replace("Character:", ""));
}

/**
 * Validates that we have matching images for all characters
 * @param {Array<string>} names - Character names
 * @param {Array<string>} images - Character images
 * @throws {Error} If counts don't match
 */
function validateImageCount(names, images) {
  if (names.length !== images.length) {
    console.warn(
      `⚠️  Warning: Number of characters (${names.length}) doesn't match number of images (${images.length})`
    );
  }
}

/**
 * Creates character objects with name, image, and URL
 * @param {Array<string>} names - Character names
 * @param {Array<string>} images - Character images
 * @returns {Array<Object>} Character objects
 */
function createCharacterObjects(names, images) {
  validateImageCount(names, images);
  return names.map((name, index) => ({
    name,
    image: images[index] || null,
    fandomUrl: `https://konofan.fandom.com/wiki/Character:${name}`,
  }));
}

/**
 * Fetches and processes KonoFan character data
 * @param {Object} options - Options for fetching characters
 * @param {boolean} [options.includeWikiHtml=false] - Whether to include the wiki HTML in the output
 */
async function getKonoFanCharacters({ includeWikiHtml = false } = {}) {
  try {
    const data = await fetchWikiPage("List_of_Characters");
    const { links, images } = data.parse;

    const characterNames = extractCharacterNames(links);
    const characters = createCharacterObjects(characterNames, images);

    const output = { characters };
    if (includeWikiHtml) {
      output.wikiHtml = cleanWikiHtml(data.parse.text["*"]);
    }

    await saveJsonToFile(OUTPUT_FILES.CHARLIST, output);
    return output;
  } catch (error) {
    console.error("❌ Error fetching character data:", error);
    throw error;
  }
}

// Run if called directly
if (isMainModule(import.meta.url)) {
  getKonoFanCharacters();
}

export { getKonoFanCharacters };
