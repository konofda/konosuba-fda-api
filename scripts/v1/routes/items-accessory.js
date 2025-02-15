import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";
import { fetchAxelFile } from "../../scrape-axel-repo/fetchAxelFile.js";
import { processTextFields } from "../../scrape-axel-repo/utils.js";
import { removeZeroProps } from "../../axel/utils/removeZeroProps.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

function extractAccessoryId(filePath) {
  const match = filePath.match(/IconAccessory\/Source\/(\d+)\.png$/);
  return match ? match[1] : null;
}

export default async function generateAccessoryItems() {
  console.log("💍 Starting accessory items data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Get all accessory icon paths
  console.log("🔍 Filtering accessory icon assets...");
  const accessoryPaths = fileList.filter((line) => line.includes("/IconAccessory/Source/") && line.endsWith(".png"));

  // Fetch and translate accessory data from Axel
  console.log("🔄 Fetching accessory data from Axel...");
  const axelAccessories = await fetchAxelFile("equip_accessory");
  const translatedAccessories = removeZeroProps(await processTextFields(axelAccessories));

  // Fetch accessory details data
  console.log("📊 Fetching accessory details from Axel...");
  const accessoryDetails = removeZeroProps(await fetchAxelFile("equip_accessory_details"));

  // Create sets of IDs from both sources for comparison
  const iconIds = new Set(accessoryPaths.map((path) => extractAccessoryId(path)).filter(Boolean));
  const axelIds = new Set(translatedAccessories.map((accessory) => accessory.id));

  // Find mismatches
  const missingFromAxel = [...iconIds].filter((id) => !axelIds.has(id));
  const missingIcons = [...axelIds].filter((id) => !iconIds.has(id));

  // Report mismatches
  if (missingFromAxel.length > 0) {
    console.log("⚠️ Accessories with icons but missing from Axel data:", missingFromAxel);
  }
  if (missingIcons.length > 0) {
    console.log("⚠️ Accessories in Axel data but missing icons:", missingIcons);
  }

  // Create combined dataset
  const accessories = translatedAccessories.map((accessory) => {
    const iconPath = accessoryPaths.find((path) => extractAccessoryId(path) === accessory.id);
    const details = accessoryDetails
      .filter((detail) => detail.item_id === accessory.id)
      .sort((a, b) => parseInt(a.lv) - parseInt(b.lv));

    return {
      ...accessory,
      icon_path: iconPath || null,
      details: details.length > 0 ? details : null,
    };
  });

  // Add entries for accessories that only exist as icons
  missingFromAxel.forEach((id) => {
    const iconPath = accessoryPaths.find((path) => extractAccessoryId(path) === id);
    if (iconPath) {
      accessories.push({
        id,
        icon_path: iconPath,
        details: null,
      });
    }
  });

  // Log statistics about details
  const accessoriesWithDetails = accessories.filter((a) => a.details && a.details.length > 0).length;
  console.log(`\n📊 Accessory Details Statistics:`);
  console.log(`🎯 Found ${accessories.length} total accessories`);
  console.log(`🖼️ With icons: ${accessories.filter((a) => a.icon_path).length}`);
  console.log(`📝 With Axel data: ${translatedAccessories.length}`);
  console.log(`⚡ With upgrade details: ${accessoriesWithDetails}`);

  // Sort by ID for consistent output
  return accessories.sort((a, b) => parseInt(a.id) - parseInt(b.id));
} 
