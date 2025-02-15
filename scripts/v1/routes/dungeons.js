import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

function extractDungeonId(filePath) {
  // Match pattern like "bg_dungeon_9101_01" from the thumbnail path
  const match = filePath.match(/bg_dungeon_(\d+_\d+)_s\.png$/);
  return match ? match[1] : null;
}

export default async function generateDungeons() {
  console.log("🏰 Starting dungeons data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // First get all dungeon thumbnail paths as they are our primary identifiers
  console.log("🔍 Filtering dungeon assets...");
  const thumbnailFiles = fileList.filter(line => 
    line.includes("/DungeonStageThumbnail/") && 
    line.includes("bg_dungeon_") &&
    line.endsWith("_s.png")
  );

  // Get unique dungeon IDs from thumbnails
  const dungeonIds = new Set();
  thumbnailFiles.forEach(path => {
    const id = extractDungeonId(path);
    if (id) dungeonIds.add(id);
  });

  console.log(`🎯 Found ${dungeonIds.size} unique dungeons`);

  // Process each dungeon
  const dungeons = Array.from(dungeonIds).map(id => {
    // Create dungeon object with all possible assets
    return {
      id,
      // Thumbnail
      thumbnail: fileList.find(p => p.includes(`bg_dungeon_${id}_s`)) || null,
      // Battle background
      battleBg: fileList.find(p => p.includes(`${id}/bg_dungeon_battle`)) || null,
      // Battle foreground
      battleFg: fileList.find(p => p.includes(`${id}/bg_battle_foreground_`)) || null
    };
  });

  // Validate completeness
  console.log("\n📊 Asset Completeness Check:");
  dungeons.forEach(dungeon => {
    const missing = [];
    if (!dungeon.thumbnail) missing.push("thumbnail");
    if (!dungeon.battleBg) missing.push("battleBg");
    if (!dungeon.battleFg) missing.push("battleFg");

    if (missing.length > 0) {
      console.log(`⚠️  Dungeon ${dungeon.id} is missing assets:`, missing.join(", "));
    }
  });

  // Sort by ID for consistent output
  return dungeons.sort((a, b) => {
    const [aBase, aNum] = a.id.split("_").map(Number);
    const [bBase, bNum] = b.id.split("_").map(Number);
    return aBase !== bBase ? aBase - bBase : aNum - bNum;
  });
} 
