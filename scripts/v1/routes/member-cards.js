import { getWikiDataAsync } from "../../common/getWikiDataAsync.js";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";
import { fetchAxelFile } from "../../scrape-axel-repo/fetchAxelFile.js";
import { processTextFields } from "../../scrape-axel-repo/utils.js";

function extractId(filePath) {
  const base = filePath.split("/").pop().split(".")[0];
  // Remove longer patterns first to avoid partial matches
  return base
    .replace("IconMiddleMember", "")
    .replace("IconLargeMember", "")
    .replace("MemberCardFull", "")
    .replace("IconMember", "")
    .replace(/[_-]+$/, "")
    .trim();
}

function parseCharacterId(id) {
  if (!id || id.length > 8) {
    return {
      base_id: null,
      rarity: null,
      event: null,
    };
  }

  return {
    base_id: id.substring(0, 3),
    character_id: id.substring(0, 3),
    rarity: parseInt(id.charAt(3)) || null,
    event: id.substring(4) || null,
  };
}

export default async function generateMemberCards() {
  console.log("🎴 Starting member cards data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Read and parse the metadata YAML for fallback names
  console.log("📚 Reading character metadata for fallback names...");
  const characterData = await getWikiDataAsync("member-characters");

  // Fetch and translate member data from Axel
  console.log("🔄 Fetching member data from Axel...");
  const axelMembers = await fetchAxelFile("member");
  const translatedMembers = await processTextFields(axelMembers);

  // Fetch SD data from Axel for battle model unlocks
  console.log("🎭 Fetching SD data for battle model unlocks...");
  const sdData = await fetchAxelFile("sd");
  // Create reverse lookup map: member_id -> battle_model_id
  const unlockToBattleModel = new Map(sdData.map(sd => [sd.unlock_member_id, sd.id]).filter(([unlock]) => unlock !== "0"));

  console.log("🔍 Filtering and categorizing card assets...");
  const fullCardPaths = fileList.filter((line) => line.includes("MemberCardFull"));
  const iconSmallPaths = fileList.filter(
    (line) => line.includes("IconMember") && !line.includes("IconMiddleMember") && !line.includes("IconLargeMember")
  );
  const iconMiddlePaths = fileList.filter((line) => line.includes("IconMiddleMember"));
  const iconLargePaths = fileList.filter((line) => line.includes("IconLargeMember"));

  // Collect all unique card IDs
  console.log("🎯 Extracting unique card IDs...");
  const idsSet = new Set();
  [...fullCardPaths, ...iconSmallPaths, ...iconMiddlePaths, ...iconLargePaths].forEach((fp) => {
    const id = extractId(fp);
    if (id) idsSet.add(id);
  });

  // Generate card data
  console.log("✨ Generating card data structures...");
  const cards = Array.from(idsSet).map((id) => {
    const parsedInfo = parseCharacterId(id);
    const axelMember = translatedMembers.find((member) => member.id === id);
    const characterInfo = parsedInfo.base_id ? characterData[parsedInfo.base_id] : null;

    // Clean up Axel data
    if (axelMember) {
      // Remove properties with "0" values
      ["notice_text", "display_start", "display_end", "graphics", "description", "name"].forEach((prop) => {
        if (axelMember[prop] === "0") {
          delete axelMember[prop];
        }
      });
    }

    const cardData = {
      id,
      ...parsedInfo,
      full_card: fullCardPaths.find((fp) => extractId(fp) === id) || null,
      icon_small: iconSmallPaths.find((fp) => extractId(fp) === id) || null,
      icon_middle: iconMiddlePaths.find((fp) => extractId(fp) === id) || null,
      icon_large: iconLargePaths.find((fp) => extractId(fp) === id) || null,
      ...axelMember,
      // Try to get name from: 1. Axel data, 2. Character YAML, 3. null
      name: axelMember?.name || characterInfo?.name || null,
      // If we got the name from YAML, also include character info
      ...(!axelMember?.name &&
        characterInfo?.name && {
          character_name: characterInfo.name,
          is_collab: characterInfo.is_collab ?? false,
        }),
    };

    // Add battle model unlock info if this card unlocks one
    const unlockedBattleModel = unlockToBattleModel.get(id);
    if (unlockedBattleModel) {
      cardData.unlocks_battle_model = unlockedBattleModel;
    }

    return cardData;
  });

  // Log some statistics
  const rarityStats = cards.reduce((acc, card) => {
    acc[card.rarity] = (acc[card.rarity] || 0) + 1;
    return acc;
  }, {});

  // Report cards without Axel data
  const missingAxelData = cards.filter((card) => !translatedMembers.find((member) => member.id === card.id));
  if (missingAxelData.length > 0) {
    console.log(
      `⚠️ ${missingAxelData.length} cards missing from Axel data:`,
      missingAxelData.map((card) => card.id).join(", ")
    );
  }

  // Report cards with no name from any source
  const missingNames = cards.filter((card) => !card.name);
  if (missingNames.length > 0) {
    console.log(
      `⚠️ ${missingNames.length} cards have no name from any source:`,
      missingNames.map((card) => card.id).join(", ")
    );
  }

  // Report battle model unlock statistics
  const cardsWithUnlocks = cards.filter(card => card.unlocks_battle_model).length;
  console.log(`🎭 Cards that unlock battle models: ${cardsWithUnlocks}`);

  console.log(`📊 Found ${cards.length} unique cards`);
  console.log("⭐ Rarity distribution:", rarityStats);

  return cards;
}
