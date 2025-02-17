import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

/**
 * Extracts the still ID from a file path
 */
function extractStillId(filePath) {
  if (filePath.includes("Story/Prefab/Sprite/Still/")) {
    // Extract the folder name before the filename
    const parts = filePath.split("/");
    const stillFolderIndex = parts.findIndex((p) => p === "Still") + 1;
    const id = parts[stillFolderIndex];
    // Only accept IDs containing digits, underscores, and hyphens
    return /^[\d_-]+$/.test(id) ? id : null;
  } else if (filePath.includes("IconStill")) {
    // For icon stills, take the filename without extension
    const filename = filePath.split("/").pop();
    const id = filename.replace(".png", "");
    // Only accept IDs containing digits, underscores, and hyphens
    return /^[\d_-]+$/.test(id) ? id : null;
  }
  return null;
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

  // Create maps to store stills and icons by their IDs
  const stillsMap = new Map();
  const iconsMap = new Map();

  // Process still paths
  stillPaths.forEach((path) => {
    const id = extractStillId(path);
    if (id) {
      stillsMap.set(id, path);
    }
  });

  // Process icon paths
  iconStillPaths.forEach((path) => {
    const id = extractStillId(path);
    if (id) {
      iconsMap.set(id, path);
    }
  });

  // Collect all unique IDs
  const allIds = new Set([...stillsMap.keys(), ...iconsMap.keys()]);

  // Generate the final data structure
  const stills = Array.from(allIds).map((id) => ({
    id,
    still: stillsMap.get(id) || null,
    icon_still: iconsMap.get(id) || null,
  }));

  // Report missing assets
  console.log("\n🔍 Still Asset Analysis Report:");

  const missingStills = stills.filter((s) => !s.still).map((s) => s.id);
  const missingIcons = stills.filter((s) => !s.icon_still).map((s) => s.id);

  console.log("\n❌ Missing Assets:");

  if (missingStills.length) {
    console.log("🎭 IDs with missing still images:", missingStills);
  } else {
    console.log("✅ All entries have still images");
  }

  if (missingIcons.length) {
    console.log("🖼️  IDs with missing icon stills:", missingIcons);
  } else {
    console.log("✅ All entries have icon stills");
  }

  // Additional statistics
  console.log("\n📊 Still Statistics:");
  console.log(`📚 Total unique IDs: ${stills.length}`);
  console.log(`🎭 Total still images: ${stillsMap.size}`);
  console.log(`🖼️  Total icon stills: ${iconsMap.size}`);

  // Sort stills by ID for consistent output
  return stills.sort((a, b) => a.id.localeCompare(b.id));
}
