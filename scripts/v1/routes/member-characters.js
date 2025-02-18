import { getWikiDataAsync } from "../../common/getWikiDataAsync.js";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";
import { fetchAxelFile } from "../../scrape-axel-repo/fetchAxelFile.js";
import { processTextFields } from "../../scrape-axel-repo/utils.js";
import { removeZeroProps } from "../../axel/utils/removeZeroProps.js";

function extractCharacterIdsFromSprites(fileList) {
  console.log("🔍 Extracting character IDs from sprite paths...");
  const spriteIds = new Set();
  const spriteData = new Map(); // Store sprite paths for later use

  fileList
    .filter((path) => path.includes("/CharacterImage/character_") && path.endsWith(".png"))
    .forEach((path) => {
      const match = path.match(/character_(\d+)(?:_([^.]+))?\.png$/);
      if (!match) return;

      const [, id, altType] = match;
      spriteIds.add(id);

      // Store sprite paths for later use
      if (!spriteData.has(id)) {
        spriteData.set(id, { main: null, alt: [] });
      }
      const data = spriteData.get(id);
      if (altType) {
        data.alt.push(path);
      } else {
        data.main = path;
      }
    });

  return { spriteIds, spriteData };
}

function gatherAllUniqueIds(spriteIds, wikiData, axelData) {
  console.log("🎯 Gathering all unique character IDs from all sources...");
  const allIds = new Set(spriteIds);

  // Add IDs from Wiki data
  Object.keys(wikiData).forEach((id) => allIds.add(id));

  // Add IDs from Axel data
  axelData.forEach((char) => allIds.add(char.id));

  const sortedIds = Array.from(allIds).sort((a, b) => Number(a) - Number(b));
  console.log(`📊 Found ${sortedIds.length} unique character IDs across all sources`);

  return sortedIds;
}

export default async function generateMemberCharacters() {
  console.log("👥 Starting member characters generation...");

  // Load all data sources
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  console.log("📚 Reading member characters data...");
  const wikiData = await getWikiDataAsync("member-characters");

  console.log("🔄 Fetching character data from Axel...");
  const axelCharacters = await fetchAxelFile("character");
  const translatedAxelData = removeZeroProps(await processTextFields(axelCharacters));

  // Extract IDs and sprite data
  const { spriteIds, spriteData } = extractCharacterIdsFromSprites(fileList);
  console.log(`🖼️ Found ${spriteIds.size} characters with sprites`);

  // Gather all unique IDs from all sources
  const allCharacterIds = gatherAllUniqueIds(spriteIds, wikiData, translatedAxelData);

  // Build character objects using data from all sources
  console.log("🔄 Building character objects from all available sources...");
  const characters = allCharacterIds.map((id) => {
    const char = { base_id: id };

    // Add sprite data if available
    const sprites = spriteData.get(id);
    if (sprites) {
      char.image_sprite = sprites.main;
      if (sprites.alt.length > 0) {
        char.image_sprites_alt = sprites.alt;
      }
    }

    // Add Wiki data if available
    const wikiChar = wikiData[id];
    if (wikiChar) {
      Object.assign(char, wikiChar);
    }

    // Add Axel data if available
    const axelChar = translatedAxelData.find((c) => c.id === id);
    if (axelChar) {
      const cleanAxelData = { ...axelChar };
      delete cleanAxelData.costume;
      delete cleanAxelData.background;

      if (cleanAxelData.notice_text === "0") {
        delete cleanAxelData.notice_text;
      }
      if (cleanAxelData.birthday === "0") {
        delete cleanAxelData.birthday;
      }

      Object.assign(char, { name: cleanAxelData.name || char.name, ...cleanAxelData });
    }

    return char;
  });

  // Report statistics
  const missingSprites = characters.filter((char) => !char.image_sprite);
  console.log(`⚠️ ${missingSprites.length} characters are missing sprite images`);
  if (missingSprites.length > 0) {
    console.log("Missing sprites for:", missingSprites.map((char) => char.base_id).join(", "));
  }

  const missingAxelData = characters.filter((char) => !translatedAxelData.find((axel) => axel.id === char.base_id));
  if (missingAxelData.length > 0) {
    console.log(
      `⚠️ ${missingAxelData.length} characters missing from Axel data:`,
      missingAxelData.map((char) => char.base_id).join(", ")
    );
  }

  console.log(`✨ Generated data for ${characters.length} characters`);
  return characters;
}
