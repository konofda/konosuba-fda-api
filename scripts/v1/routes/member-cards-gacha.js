import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

function extractCardId(filePath) {
  // Match pattern from gacha animation template folder name
  const match = filePath.match(/GachaAnim4Star_(\d+)\//);
  return match ? match[1] : null;
}

export default async function generateMemberCardsGacha() {
  console.log("🎰 Starting member cards gacha data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Get all gacha animation paths as primary identifiers
  console.log("🔍 Filtering member card gacha assets...");
  const gachaPaths = fileList.filter(line => 
    line.includes("/GachaAnim4StarTemplate/GachaAnim4Star_") &&
    line.endsWith(".png")
  );

  // Get unique card IDs
  const cardIds = new Set();
  gachaPaths.forEach(path => {
    const id = extractCardId(path);
    if (id) cardIds.add(id);
  });

  console.log(`🎯 Found ${cardIds.size} member card gacha entries`);

  // Process each card
  const cards = Array.from(cardIds).map(id => {
    return {
      id,
      // Icon assets
      iconSmall: fileList.find(p => p.includes(`/IconMember/Source/${id}.png`)) || null,
      iconMiddle: fileList.find(p => p.includes(`/IconMiddleMember/Source/${id}.png`)) || null,
      iconLarge: fileList.find(p => p.includes(`/IconLargeMember/Source/${id}.png`)) || null,
      iconBattle: fileList.find(p => p.includes(`/UnitIcon/thmb_in_${id}.png`)) || null,
      
      // Gacha specific assets
      gacha: fileList.find(p => p.includes(`/GachaAnim4Star_${id}/eyecatch`)) || null,
      gachaName: fileList.find(p => p.includes(`/GachaCharaName/gacha_chara_${id}.png`)) || null,
      
      // Story texture
      storyTexture: fileList.find(p => p.includes(`/Story/Prefab/Character/${id}/texture_00.png`)) || null
    };
  });

  // Validate completeness
  console.log("\n📊 Asset Completeness Check:");
  cards.forEach(card => {
    const missing = [];
    if (!card.iconSmall) missing.push("iconSmall");
    if (!card.iconMiddle) missing.push("iconMiddle");
    if (!card.iconLarge) missing.push("iconLarge");
    if (!card.iconBattle) missing.push("iconBattle");
    if (!card.gacha) missing.push("gacha");
    if (!card.gachaName) missing.push("gachaName");
    if (!card.storyTexture) missing.push("storyTexture");

    if (missing.length > 0) {
      console.log(`⚠️  Card ${card.id} is missing assets:`, missing.join(", "));
    }
  });

  // Sort by ID for consistent output
  return cards.sort((a, b) => parseInt(a.id) - parseInt(b.id));
} 
