import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

function extractStageId(filePath) {
  // Try to match stage info pattern first
  let match = filePath.match(/stage_info_([0-9_]+)\.png$/);
  if (match) return match[1];
  
  // Try to match icon source pattern
  match = filePath.match(/IconQuestStageBg\/Source\/([0-9_]+)\.png$/);
  return match ? match[1] : null;
}

export default async function generateQuestStages() {
  console.log("🗺️  Starting quest stages data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Get all relevant paths
  console.log("🔍 Filtering quest stage assets...");
  const stagePaths = fileList.filter(line => 
    (line.includes("/IconQuestStageBg/Source/") || line.includes("/QuestStageInfoBg/stage_info_")) &&
    line.endsWith(".png")
  );

  // Get unique stage IDs
  const stageIds = new Set();
  stagePaths.forEach(path => {
    const id = extractStageId(path);
    if (id) stageIds.add(id);
  });

  console.log(`🎯 Found ${stageIds.size} unique quest stages`);

  // Process each stage
  const stages = Array.from(stageIds).map(id => {
    return {
      id,
      // Stage background icon
      iconBg: fileList.find(p => p.includes(`/IconQuestStageBg/Source/${id}.png`)) || null,
      // Stage info background
      infoBg: fileList.find(p => p.includes(`/QuestStageInfoBg/stage_info_${id}.png`)) || null
    };
  });

  // Validate completeness
  console.log("\n📊 Asset Completeness Check:");
  stages.forEach(stage => {
    const missing = [];
    if (!stage.iconBg) missing.push("iconBg");
    if (!stage.infoBg) missing.push("infoBg");

    if (missing.length > 0) {
      console.log(`⚠️  Stage ${stage.id} is missing assets:`, missing.join(", "));
    }
  });

  // Sort by ID for consistent output
  return stages.sort((a, b) => {
    // Split IDs in case they're compound (e.g., "9103_05")
    const [aBase, aNum] = a.id.split("_").map(Number);
    const [bBase, bNum] = b.id.split("_").map(Number);
    
    // If either ID doesn't have a second part, treat it as a simple numeric comparison
    if (!aNum || !bNum) {
      return parseInt(a.id) - parseInt(b.id);
    }
    
    // Otherwise sort by base number first, then sub-number
    return aBase !== bBase ? aBase - bBase : aNum - bNum;
  });
} 
