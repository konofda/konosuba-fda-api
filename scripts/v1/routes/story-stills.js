import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

/**
 * Extracts the still ID from a file path by taking the first 4 digits
 */
function extractStillId(filePath) {
  const match = filePath
    .split("/")
    .pop()
    .match(/^(\d{4})/);
  return match ? match[1] : null;
}

export default async function generateStoryStills() {
  console.log("🎭 Starting story stills data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Filter paths into relevant categories
  console.log("🔍 Filtering still assets...");
  const stillPaths = fileList.filter((line) => line.includes("Story/Prefab/Sprite/Still"));
  const iconStillPaths = fileList.filter((line) => line.includes("IconStill"));

  // Collect all unique still IDs
  console.log("🎯 Extracting unique still IDs...");
  const idsSet = new Set();
  [...stillPaths, ...iconStillPaths].forEach((fp) => {
    const id = extractStillId(fp);
    if (id) idsSet.add(id);
  });

  // Create still objects
  console.log("✨ Generating still data structures...");
  const stills = Array.from(idsSet).map((id) => {
    // Get all matching stills
    const matchingStills = stillPaths.filter((fp) => extractStillId(fp) === id);
    const matchingIconStills = iconStillPaths.filter((fp) => extractStillId(fp) === id);

    if (matchingIconStills.length > 1) {
      console.log(`⚠️  Multiple icon_still matches for still ${id}:`, matchingIconStills);
    }

    return {
      id,
      stills: matchingStills,
      icon_still: matchingIconStills[0] || null,
    };
  });

  // Report missing assets
  console.log("\n🔍 Still Asset Analysis Report:");

  const missingStills = stills.filter((s) => s.stills.length === 0).map((s) => s.id);
  const missingIconStill = stills.filter((s) => !s.icon_still).map((s) => s.id);

  console.log("\n❌ Missing Assets:");

  if (missingStills.length) {
    console.log("🎭 Entries with no stills:", missingStills);
  } else {
    console.log("✅ All entries have stills");
  }

  if (missingIconStill.length) {
    console.log("🖼️  Entries with no icon still:", missingIconStill);
  } else {
    console.log("✅ All entries have icon stills");
  }

  // Additional statistics
  console.log("\n📊 Still Statistics:");
  console.log(`📚 Total number of still entries: ${stills.length}`);

  const totalStills = stills.reduce((sum, s) => sum + s.stills.length, 0);
  console.log(`🎭 Total still assets: ${totalStills}`);
  console.log(`🖼️  Total icon stills: ${stills.filter((s) => s.icon_still).length}`);

  // Sort stills by ID for consistent output
  return stills.sort((a, b) => a.id.localeCompare(b.id));
}
