import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";
import { fetchAxelFile } from "../../scrape-axel-repo/fetchAxelFile.js";
import { processTextFields } from "../../scrape-axel-repo/utils.js";
import { removeZeroProps } from "../../axel/utils/removeZeroProps.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

function extractWeaponId(filePath) {
  const match = filePath.match(/IconWeapon\/Source\/(\d+)\.png$/);
  return match ? match[1] : null;
}

export default async function generateWeaponIcons() {
  console.log("⚔️ Starting weapon icons data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Get all weapon icon paths
  console.log("🔍 Filtering weapon icon assets...");
  const weaponPaths = fileList.filter((line) => line.includes("/IconWeapon/Source/") && line.endsWith(".png"));

  // Fetch and translate weapon data from Axel
  console.log("🔄 Fetching weapon data from Axel...");
  const axelWeapons = await fetchAxelFile("equip_weapon");
  const translatedWeapons = removeZeroProps(await processTextFields(axelWeapons));

  // Fetch weapon details data
  console.log("📊 Fetching weapon details from Axel...");
  const weaponDetails = removeZeroProps(await fetchAxelFile("equip_weapon_details"));

  // Create sets of IDs from both sources for comparison
  const iconIds = new Set(weaponPaths.map((path) => extractWeaponId(path)).filter(Boolean));
  const axelIds = new Set(translatedWeapons.map((weapon) => weapon.id));

  // Find mismatches
  const missingFromAxel = [...iconIds].filter((id) => !axelIds.has(id));
  const missingIcons = [...axelIds].filter((id) => !iconIds.has(id));

  // Report mismatches
  if (missingFromAxel.length > 0) {
    console.log("⚠️ Weapons with icons but missing from Axel data:", missingFromAxel);
  }
  if (missingIcons.length > 0) {
    console.log("⚠️ Weapons in Axel data but missing icons:", missingIcons);
  }

  // Create combined dataset
  const weapons = translatedWeapons.map((weapon) => {
    const iconPath = weaponPaths.find((path) => extractWeaponId(path) === weapon.id);
    const details = weaponDetails
      .filter((detail) => detail.item_id === weapon.id)
      .sort((a, b) => parseInt(a.lv) - parseInt(b.lv));

    return {
      ...weapon,
      icon_path: iconPath || null,
      details: details.length > 0 ? details : null,
    };
  });

  // Add entries for weapons that only exist as icons
  missingFromAxel.forEach((id) => {
    const iconPath = weaponPaths.find((path) => extractWeaponId(path) === id);
    if (iconPath) {
      weapons.push({
        id,
        icon_path: iconPath,
        details: null,
      });
    }
  });

  // Log statistics about details
  const weaponsWithDetails = weapons.filter((w) => w.details && w.details.length > 0).length;
  console.log(`\n📊 Weapon Details Statistics:`);
  console.log(`🎯 Found ${weapons.length} total weapons`);
  console.log(`🖼️ With icons: ${weapons.filter((w) => w.icon_path).length}`);
  console.log(`📝 With Axel data: ${translatedWeapons.length}`);
  console.log(`⚡ With upgrade details: ${weaponsWithDetails}`);

  // Sort by ID for consistent output
  return weapons.sort((a, b) => parseInt(a.id) - parseInt(b.id));
}
