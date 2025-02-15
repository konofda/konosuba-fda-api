import { fetchWikiPage } from "./utils/api.js";
import { saveJsonToFile, readJsonFile } from "./utils/fs.js";
import { OUTPUT_FILES } from "./utils/config.js";
import { isMainModule } from "./utils/runtime.js";

/**
 * Extracts character-specific templates from wiki data
 * @param {Object} data - Wiki page data
 * @param {string} character - Character name
 * @returns {Array<string>} List of template names
 */
function extractCharacterMemberCardTemplates(data, character) {
  const prefix = `Character:${character}/`;
  return (
    data?.parse?.templates
      ?.map((template) => template["*"])
      .filter((templateName) => templateName.startsWith(prefix))
      .map((templateName) => templateName.replace(prefix, "")) || []
  );
}

/**
 * Extracts PNG image URLs from wiki HTML content
 * @param {string} html - Wiki page HTML content
 * @returns {Array<string>} List of PNG image URLs
 */
function extractImageUrls(html) {
  const urls = [];
  const regex = /src="([^"]+\.png)[^"]*"/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  return [...new Set(urls)]; // Remove duplicates
}

/**
 * Fetches data for a specific character
 * @param {string} character - Character name
 * @returns {Promise<Object|null>} Character data or null if failed
 */
async function fetchCharacterData(character) {
  try {
    const data = await fetchWikiPage(`Character:${character}`);
    console.log(`✅ Fetched data for ${character}`);
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch data for ${character}:`, error);
    return null;
  }
}

/**
 * Processes character data and extracts templates
 * @param {string} character - Character name
 * @returns {Promise<Object|null>} Processed character data
 */
async function processCharacter(character) {
  const data = await fetchCharacterData(character);
  if (!data) return null;

  const memberCardNames = extractCharacterMemberCardTemplates(data, character);
  const htmlImages = extractImageUrls(data.parse.text["*"]);

  return { character, memberCardNames, htmlImages };
}

/**
 * Fetches and processes member card data for all characters
 */
async function getKonoFanMemberCards(customCharacterNames = null) {
  try {
    const { characters } = await readJsonFile(OUTPUT_FILES.CHARLIST);
    const characterNames = customCharacterNames || characters.map((char) => char.name);

    const allCharacterData = [];
    for (const character of characterNames) {
      const data = await processCharacter(character);
      if (data) {
        allCharacterData.push(data);
      }
    }

    await saveJsonToFile(OUTPUT_FILES.MEMBERCARDS, allCharacterData);
    return allCharacterData;
  } catch (error) {
    console.error("❌ Error processing member cards:", error);
    throw error;
  }
}

// Run if called directly
if (isMainModule(import.meta.url)) {
  // getKonoFanMemberCards(["Rin"]);
  getKonoFanMemberCards([
    "Kazuma",
    "Aqua",
    "Megumin",
    "Darkness",
    "Wiz",
    "Yunyun",
    "Arue",
    "Chris",
    "Iris",
    "Cecily",
    "Mitsurugi",
    "Dust",
    "Rin",
    "Lia",
    "Cielo",
    "Erika",
    "Melissa",
    "Mia",
    "Amy",
    "Komekko",
    "Vanir",
    "Mel",
    "Lolisa",
    "Claire",
    "Funifura & Dodonko",
    "Zesta",
    "Rain",
    "Sherry",
    "Emilia",
    "Rem",
    "Eris",
    "Chomusuke",
    "Luna",
    "Ruffian",
    "Kajiya",
    "Sena",
    "Succubus Receptionist",
    "Aldarp",
    "Walter",
    "Veldia",
    "Hans",
    "Daniel",
    "Charlie",
    "Squall",
    "Carla",
    "Hiropon",
    "Pucchin",
    "Bukkororii",
  ]);
}

export { getKonoFanMemberCards };
