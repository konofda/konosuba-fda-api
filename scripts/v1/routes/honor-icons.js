import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

// Known invalid honor ID that should be excluded
const INVALID_HONOR_ID = "12214100";

function extractHonorId(filePath) {
  const match = filePath.match(/Honor_(\d+)\.png$/);
  return match ? match[1] : null;
}

export default async function generateHonorIcons() {
  console.log("🎖️ Starting honor icons data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Get all honor icon paths
  console.log("🔍 Filtering honor icon assets...");
  const honorPaths = fileList.filter(line => 
    line.includes("/IconHonor/Source/Honor_") &&
    line.endsWith(".png") &&
    !line.includes(`Honor_${INVALID_HONOR_ID}`)
  );

  // Process each honor icon
  const icons = honorPaths.map(path => {
    const id = extractHonorId(path);
    if (!id) return null;

    return {
      id,
      icon: path
    };
  }).filter(Boolean);

  console.log(`🎯 Found ${icons.length} honor icons`);

  // Sort by ID for consistent output
  return icons.sort((a, b) => parseInt(a.id) - parseInt(b.id));
} 
