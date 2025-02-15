import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";
import { fetchAxelFile } from "../../scrape-axel-repo/fetchAxelFile.js";
import { processTextFields } from "../../scrape-axel-repo/utils.js";
import { removeZeroProps } from "../../axel/utils/removeZeroProps.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

// Map material categories to their corresponding item types
const MATERIAL_TYPES = {
  wa: "15",      // Weapon/Accessory materials
  limit: "16",   // Limited materials
  lv: "18",      // Level up materials
  skill: "17",   // Skill up materials
  love: "19"     // Affinity materials
};

function extractItemInfo(filePath) {
  const match = filePath.match(/IconMaterial_(\w+)\/Source\/(\d+)\.png$/);
  if (!match) return null;
  const category = match[1];
  return {
    category,
    id: match[2],
    type: MATERIAL_TYPES[category]
  };
}

function findIconPath(paths, id, category) {
  return paths.find(path => path.includes(`/IconMaterial_${category}/Source/${id}.png`));
}

export default async function generateOtherItems() {
  console.log("🎒 Starting other items data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Get all material icon paths
  console.log("🔍 Filtering material icon assets...");
  const itemPaths = fileList.filter((line) => 
    Object.keys(MATERIAL_TYPES).some(category => 
      line.includes(`/IconMaterial_${category}/Source/`)
    ) && 
    line.endsWith(".png")
  );

  // Fetch and translate item data from Axel
  console.log("🔄 Fetching item data from Axel...");
  const axelItems = await fetchAxelFile("item");
  const translatedItems = removeZeroProps(await processTextFields(axelItems));

  // Filter for all material type items
  const validTypes = new Set(Object.values(MATERIAL_TYPES));
  const materialItems = translatedItems.filter(item => validTypes.has(item.type));

  // Create sets of IDs from both sources for comparison, respecting types
  const iconInfos = itemPaths.map(path => extractItemInfo(path)).filter(Boolean);
  
  // Group items by type for easier matching
  const itemsByType = {};
  validTypes.forEach(type => {
    const typeItems = materialItems.filter(item => item.type === type);
    const typeIcons = iconInfos.filter(info => info.type === type);
    
    const iconIds = new Set(typeIcons.map(info => info.id));
    const axelIds = new Set(typeItems.map(item => item.id));

    // Find mismatches for this type
    const missingFromAxel = [...iconIds].filter(id => !axelIds.has(id));
    const missingIcons = [...axelIds].filter(id => !iconIds.has(id));

    if (missingFromAxel.length > 0) {
      console.log(`⚠️ Type ${type} items with icons but missing from Axel data:`, missingFromAxel);
    }
    if (missingIcons.length > 0) {
      console.log(`⚠️ Type ${type} items in Axel data but missing icons:`, missingIcons);
    }

    itemsByType[type] = { typeItems, typeIcons, missingFromAxel, missingIcons };
  });

  // Create combined dataset
  const items = materialItems.map((item) => {
    const iconInfo = iconInfos.find(info => info.id === item.id && info.type === item.type);
    return {
      ...item,
      icon_path: iconInfo ? findIconPath(itemPaths, item.id, iconInfo.category) : null,
      category: iconInfo?.category || null
    };
  });

  // Add entries for items that only exist as icons
  Object.entries(itemsByType).forEach(([type, { missingFromAxel, typeIcons }]) => {
    missingFromAxel.forEach((id) => {
      const iconInfo = typeIcons.find(info => info.id === id);
      if (iconInfo) {
        items.push({
          id,
          type,
          icon_path: findIconPath(itemPaths, id, iconInfo.category),
          category: iconInfo.category
        });
      }
    });
  });

  // Log statistics
  console.log(`\n📊 Material Item Statistics:`);
  console.log(`🎯 Found ${items.length} total items`);
  console.log(`🖼️ With icons: ${items.filter((i) => i.icon_path).length}`);
  console.log(`📝 With Axel data: ${materialItems.length}`);

  // Group items by type/category for stats
  const typeStats = items.reduce((acc, item) => {
    const category = item.category || 'unknown';
    const type = item.type;
    const key = `${type}/${category}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  if (Object.keys(typeStats).length > 0) {
    console.log("\n📑 Items by type/category:");
    Object.entries(typeStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([typeCategory, count]) => {
        console.log(`  ${typeCategory}: ${count} items`);
      });
  }

  // Group items by rarity for additional stats
  const rarityStats = items.reduce((acc, item) => {
    if (item.rarity) {
      acc[item.rarity] = (acc[item.rarity] || 0) + 1;
    }
    return acc;
  }, {});

  if (Object.keys(rarityStats).length > 0) {
    console.log("\n⭐ Items by rarity:");
    Object.entries(rarityStats)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([rarity, count]) => {
        console.log(`  ${rarity}★: ${count} items`);
      });
  }

  // Sort by ID for consistent output
  return items.sort((a, b) => parseInt(a.id) - parseInt(b.id));
} 
