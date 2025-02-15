import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

function parseSpinePath(filePath) {
  // Only process spine json/txt files
  if (!filePath.match(/\.(json|txt)$/)) return null;

  const filename = filePath.split("/").pop();
  // Ignore files that are just .json or .txt with no name
  if (filename.match(/^\.?(json|txt)$/)) return null;

  const name = filename.replace(/\.(json|txt)$/, "").split("-")[0];
  // Ignore if name is empty after processing
  if (!name) return null;

  // Determine category based on path
  const category = filePath.includes("/AllyUnit/") ? "ally" : filePath.includes("/EnemyUnit/") ? "enemy" : "assist";

  // For allies, try to extract character base id from filename
  let base_id = null;

  if (category === "ally") {
    const possibleId = name.substring(0, 3);
    if (/^\d{3}$/.test(possibleId)) {
      base_id = possibleId;
    }
  }

  return {
    id: name,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    base_id,
    category,
    path: filePath,
  };
}

export default async function generateMemberSpineModels() {
  console.log("🦴 Starting spine models data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Filter and parse spine files
  console.log("🔍 Filtering and parsing spine model files...");
  const spines = fileList
    // .filter((line) => line.match(/\.(json|txt)$/))
    .filter((line) => line.match(/\.(txt)$/))
    .map(parseSpinePath)
    .filter(Boolean);

  // Generate statistics
  const totalSpines = spines.length;
  const allySpines = spines.filter((s) => s.category === "ally").length;
  const enemySpines = spines.filter((s) => s.category === "enemy").length;
  const assistSpines = spines.filter((s) => s.category === "assist").length;
  const spinesWithCharId = spines.filter((s) => s.base_id).length;

  // Group by character base_id for logging
  const characterGroups = spines.reduce((acc, spine) => {
    if (spine.base_id) {
      acc[spine.base_id] = acc[spine.base_id] || [];
      acc[spine.base_id].push(spine);
    }
    return acc;
  }, {});

  // Log statistics
  console.log("\n📊 Spine Asset Statistics:");
  console.log(`🎭 Total spine assets: ${totalSpines}`);
  console.log(`👥 Ally units: ${allySpines}`);
  console.log(`👾 Enemy units: ${enemySpines}`);
  console.log(`🤝 Assist units: ${assistSpines}`);
  console.log(`🆔 Spines with character ID: ${spinesWithCharId}`);

  console.log("\n👥 Character Spine Distribution:");
  Object.entries(characterGroups).forEach(([charId, charSpines]) => {
    console.log(`🎨 Character ${charId}: ${charSpines.length} spine assets`);
  });

  return spines;
}
