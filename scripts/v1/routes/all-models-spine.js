import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";
import { fetchAxelFile } from "../../scrape-axel-repo/fetchAxelFile.js";

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
  let character_id = null;

  if (category === "ally") {
    const possibleId = name.substring(0, 3);
    if (/^\d{3}$/.test(possibleId)) {
      character_id = possibleId;
    }
  }

  const folder = filePath.split("/").slice(-2, -1)[0];

  return {
    id: name,
    base_id: character_id,
    character_id,
    category,
    path: filePath,
    folder,
    filename: filename.replace(/\.(json|txt)$/, ""),
  };
}

export default async function generateMemberSpineModels() {
  console.log("🦴 Starting spine models data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Fetch SD data from Axel
  console.log("🎭 Fetching SD data from Axel...");
  const sdData = await fetchAxelFile("sd");
  const sdMap = new Map(sdData.map(sd => [sd.id, sd.unlock_member_id]));

  // Filter and parse spine files
  console.log("🔍 Filtering and parsing spine model files...");
  const spines = fileList
    .filter((line) => line.match(/\.(txt)$/))
    .map(parseSpinePath)
    .filter(Boolean)
    .map(spine => {
      // Check if this spine has matching SD data with non-zero unlock_member_id
      const unlockMemberId = sdMap.get(spine.id);
      if (unlockMemberId && unlockMemberId !== "0") {
        spine.unlock_member_id = unlockMemberId;
      }
      return spine;
    });

  // Generate statistics
  const totalSpines = spines.length;
  const allySpines = spines.filter((s) => s.category === "ally");
  const enemySpines = spines.filter((s) => s.category === "enemy").length;
  const assistSpines = spines.filter((s) => s.category === "assist").length;

  // Detailed ally statistics
  const allyCount = allySpines.length;
  const allyWithCharId = allySpines.filter((s) => s.character_id).length;
  const allyWithoutCharId = allyCount - allyWithCharId;
  const allyWithUnlock = allySpines.filter((s) => s.unlock_member_id).length;
  const allyWithoutUnlock = allyCount - allyWithUnlock;

  // Log statistics
  console.log("\n📊 Spine Asset Statistics:");
  console.log(`🎭 Total spine assets: ${totalSpines}`);
  console.log(`👥 Ally units: ${allyCount}`);
  console.log(`👾 Enemy units: ${enemySpines}`);
  console.log(`🤝 Assist units: ${assistSpines}`);
  
  console.log("\n👥 Ally Unit Details:");
  console.log(`🆔 With character ID: ${allyWithCharId} / Without: ${allyWithoutCharId}`);
  console.log(`🔓 With unlock requirement: ${allyWithUnlock} / Without: ${allyWithoutUnlock}`);

  return spines;
}
