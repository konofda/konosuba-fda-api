import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

function extractEnemyId(filePath) {
  // Try enemy image pattern first
  let match = filePath.match(/enemy_image_(\d+)\.png$/);
  if (match) return match[1];
  
  // Try icon pattern next
  match = filePath.match(/IconEnemy\/Source\/(\d+)\.png$/);
  return match ? match[1] : null;
}

export default async function generateEnemies() {
  console.log("👾 Starting enemies data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Get all enemy paths that could contain IDs
  console.log("🔍 Filtering enemy assets...");
  const enemyPaths = fileList.filter(line => 
    (line.includes("/EnemyImage/enemy_image_") || line.includes("/IconEnemy/Source/")) &&
    line.endsWith(".png")
  );

  // Get unique enemy IDs
  const enemyIds = new Set();
  enemyPaths.forEach(path => {
    const id = extractEnemyId(path);
    if (id) enemyIds.add(id);
  });

  console.log(`🎯 Found ${enemyIds.size} unique enemies`);

  // Process each enemy
  const enemies = Array.from(enemyIds).map(id => {
    return {
      id,
      // Main enemy image
      image: fileList.find(p => p.includes(`/EnemyImage/enemy_image_${id}.png`)) || null,
      // Enemy icon
      icon: fileList.find(p => p.includes(`/IconEnemy/Source/${id}.png`)) || null,
      // Enemy unit texture
      unitTexture: fileList.find(p => p.includes(`/EnemyUnit/enemy_id_${id}/`)) || null
    };
  });

  // Validate completeness and count missing assets
  console.log("\n📊 Asset Completeness Check:");
  const missingCounts = {
    image: 0,
    icon: 0,
    unitTexture: 0
  };

  enemies.forEach(enemy => {
    if (!enemy.image) missingCounts.image++;
    if (!enemy.icon) missingCounts.icon++;
    if (!enemy.unitTexture) missingCounts.unitTexture++;
  });

  // Report missing asset counts
  Object.entries(missingCounts).forEach(([prop, count]) => {
    if (count > 0) {
      console.log(`⚠️  Missing ${prop}: ${count} enemies`);
    }
  });

  // Sort by ID for consistent output
  return enemies.sort((a, b) => parseInt(a.id) - parseInt(b.id));
} 
