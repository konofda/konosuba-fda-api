import { getWikiDataAsync } from "../../common/getWikiDataAsync.js";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";
import { fetchAxelFile } from "../../scrape-axel-repo/fetchAxelFile.js";
import { processTextFields } from "../../scrape-axel-repo/utils.js";

export default async function generateMemberCharacters() {
  console.log("👥 Starting member characters generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Read and parse the metadata YAML
  console.log("📚 Reading member characters data...");
  const rawData = await getWikiDataAsync("member-characters");

  // Fetch and translate character data from Axel
  console.log("🔄 Fetching character data from Axel...");
  const axelCharacters = await fetchAxelFile('character');
  const translatedCharacters = await processTextFields(axelCharacters);

  console.log("🔄 Processing and applying defaults...");
  const characters = Object.entries(rawData).reduce((acc, [id, data]) => {
    // Skip comment entries that start with #
    if (id.startsWith("#")) return acc;

    // Look for character sprite
    const spritePath = fileList.find(path => 
      path.includes(`Assets/AddressableAssetsStore/UnityAssets/Battle/Sprite/CharacterImage/character_${id}`)
    ) || null;

    // Find matching Axel character data
    const axelChar = translatedCharacters.find(char => char.id === id);
    delete axelChar?.costume;
    delete axelChar?.background;

    if (axelChar?.notice_text === "0") {
      delete axelChar?.notice_text;
    }

    if (axelChar?.birthday === "0") {
      delete axelChar?.birthday;
    }

    // Add character object to array instead of using id as key
    acc.push({
      base_id: id,
      name: axelChar?.name || data.name,
      is_collab: axelChar ? axelChar.is_collabo === "1" : (data.is_collab ?? false),
      image_sprite: spritePath,
      ...axelChar
    });
    return acc;
  }, []);

  // Report missing sprites
  const missingSprites = characters.filter(char => !char.image_sprite);
  console.log(`⚠️ ${missingSprites.length} characters are missing sprite images`);
  if (missingSprites.length > 0) {
    console.log("Missing sprites for:", missingSprites.map(char => char.base_id).join(", "));
  }

  // Report characters without Axel data
  const missingAxelData = characters.filter(char => !translatedCharacters.find(axel => axel.id === char.base_id));
  if (missingAxelData.length > 0) {
    console.log(`⚠️ ${missingAxelData.length} characters missing from Axel data:`, missingAxelData.map(char => char.base_id).join(", "));
  }

  console.log(`✨ Generated data for ${characters.length} characters`);
  return characters;
}
