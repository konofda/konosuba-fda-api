import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";
import { fetchAxelFile } from "../../scrape-axel-repo/fetchAxelFile.js";
import { processTextFields } from "../../scrape-axel-repo/utils.js";

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

  // Fetch honor data from Axel
  console.log("🔄 Fetching honor data from Axel...");
  const axelHonors = await fetchAxelFile("honor");
  const translatedHonors = await processTextFields(axelHonors);
  const honorMap = new Map(translatedHonors.map(honor => [honor.id, honor]));

  // Get all honor icon paths
  console.log("🔍 Filtering honor icon assets...");
  const honorPaths = fileList.filter(
    (line) =>
      line.includes("/IconHonor/Source/Honor_") && line.endsWith(".png") && !line.includes(`Honor_${INVALID_HONOR_ID}`)
  );

  // Process each honor icon
  const icons = honorPaths
    .map((path) => {
      const id = extractHonorId(path);
      if (!id) return null;

      // Get Axel data if available
      const axelData = honorMap.get(id) || {};

      return {
        id,
        icon: path,
        ...axelData
      };
    })
    .filter(Boolean);

  // Report statistics
  const withAxelData = icons.filter(icon => Object.keys(icon).length > 2).length;
  console.log(`🎯 Found ${icons.length} honor icons (${withAxelData} with Axel data)`);

  // Sort by ID for consistent output
  return icons.sort((a, b) => parseInt(a.id) - parseInt(b.id));
}
