import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

/**
 * Extracts the story ID from a file path by taking the first 4 digits
 */
function extractStoryId(filePath) {
  const match = filePath
    .split("/")
    .pop()
    .match(/^(\d{4})/);
  return match ? match[1] : null;
}

export default async function generateStoryBackgrounds() {
  console.log("🎬 Starting story backgrounds data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Filter paths into relevant categories
  console.log("🔍 Filtering background assets...");
  const bgPaths = fileList.filter((line) => line.includes("Story/Prefab/Background"));
  const iconBgPaths = fileList.filter((line) => line.includes("IconBackground"));

  // Collect all unique story IDs
  console.log("🎯 Extracting unique story IDs...");
  const idsSet = new Set();
  [...bgPaths, ...iconBgPaths].forEach((fp) => {
    const id = extractStoryId(fp);
    if (id) idsSet.add(id);
  });

  // Create story objects
  console.log("✨ Generating story data structures...");
  const stories = Array.from(idsSet).map((id) => {
    // Get all matching backgrounds
    const matchingBgs = bgPaths.filter((fp) => extractStoryId(fp) === id);
    const matchingIconBgs = iconBgPaths.filter((fp) => extractStoryId(fp) === id);

    // Log warnings for multiple background matches
    if (matchingBgs.length > 1) {
      console.log(`⚠️  Multiple background matches for story ${id}:`, matchingBgs);
    }

    return {
      id,
      background: matchingBgs[0] || null,
      icon_background: matchingIconBgs[0] || null,
    };
  });

  // Report missing assets
  console.log("\n🔍 Story Asset Analysis Report:");

  const missingBg = stories.filter((s) => !s.background).map((s) => s.id);
  const missingIconBg = stories.filter((s) => !s.icon_background).map((s) => s.id);

  console.log("\n❌ Missing Assets:");

  if (missingBg.length) {
    console.log("🖼️  Stories with no backgrounds:", missingBg);
  } else {
    console.log("✅ All stories have backgrounds");
  }

  if (missingIconBg.length) {
    console.log("🏞️  Stories with no icon background:", missingIconBg);
  } else {
    console.log("✅ All stories have icon backgrounds");
  }

  // Additional statistics
  console.log("\n📊 Story Statistics:");
  console.log(`📚 Total number of stories: ${stories.length}`);

  const totalBgs = stories.filter((s) => s.background).length;
  console.log(`🖼️  Total background assets: ${totalBgs}`);
  console.log(`🏞️  Total icon backgrounds: ${stories.filter((s) => s.icon_background).length}`);

  return stories;
}
