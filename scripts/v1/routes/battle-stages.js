import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

function extractStageId(filePath) {
  // Match pattern like "/BG01/1010/bg_battle_" to get the stage ID
  const match = filePath.match(/\/BG01\/([0-9_]+)\/bg_battle_/);
  return match ? match[1] : null;
}

function extractBgId(filePath) {
  // Extract the background part ID from the full path
  const match = filePath.match(/bg_battle_(?:foreground_)?([^\.]+)\.png$/);
  return match ? match[1] : null;
}

export default async function generateBattleStages() {
  console.log("⚔️ Starting battle stages data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Get all battle background paths
  console.log("🔍 Filtering battle stage assets...");
  const battlePaths = fileList.filter(line => 
    line.includes("/Battle/BackGround/BG01/") &&
    line.endsWith(".png")
  );

  // Get unique stage IDs from battle backgrounds
  const stageIds = new Set();
  battlePaths.forEach(path => {
    const id = extractStageId(path);
    if (id) stageIds.add(id);
  });

  console.log(`🎯 Found ${stageIds.size} unique battle stages`);

  // Process each stage
  const stages = Array.from(stageIds).map(id => {
    // Get all files for this stage
    const stageFiles = battlePaths.filter(p => p.includes(`/BG01/${id}/`));
    
    // Get background parts
    const bgFiles = stageFiles.filter(p => p.includes("bg_battle_"));
    const parts = [];
    
    // Group background and foreground pairs
    bgFiles.forEach(bgPath => {
      if (bgPath.includes("_foreground_")) return; // Skip foreground files here
      
      const bgId = extractBgId(bgPath);
      if (!bgId) return;
      
      // Find matching foreground
      const fgPath = stageFiles.find(p => p.includes(`bg_battle_foreground_${bgId}.png`));
      
      parts.push({
        background: bgPath,
        foreground: fgPath || null
      });
    });

    // Get effect files
    const effects = stageFiles
      .filter(p => p.includes("/eft_"))
      .sort();

    // Find the stage info background and banner
    const infoBg = fileList.find(p => p.includes(`/QuestStageInfoBg/stage_info_${id}.png`)) || null;
    const iconBg = fileList.find(p => p.includes(`/IconQuestStageBg/Source/${id}.png`)) || null;

    return {
      id,
      stage_id: id,
      iconBg,
      infoBg,
      parts,
      effects
    };
  });

  // Validate completeness
  console.log("\n📊 Asset Completeness Check:");
  stages.forEach(stage => {
    const issues = [];
    if (!stage.iconBg) issues.push("missing iconBg");
    if (!stage.infoBg) issues.push("missing info background");
    if (stage.parts.length === 0) issues.push("no background parts");
    stage.parts.forEach((part, idx) => {
      if (!part.foreground) issues.push(`missing foreground for part ${idx + 1}`);
    });

    if (issues.length > 0) {
      console.log(`⚠️  Stage ${stage.id} has issues:`, issues.join(", "));
    }
  });

  // Sort by ID for consistent output
  return stages.sort((a, b) => {
    // Split IDs in case they're compound (e.g., "1010_1")
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
