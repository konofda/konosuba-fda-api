import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

function parseLive2DPath(filePath) {
  // Only process .model3.json files
  if (!filePath.endsWith(".model3.json")) return null;

  const parts = filePath.split("/");

  // Case 1: Root paths with "<num> - <name>"
  if (parts[0].match(/^\d+\s-/)) {
    const [baseId, ...nameParts] = parts[0].split(" - ");
    const characterName = nameParts.join(" - ");
    const modelName = parts.length > 2 ? parts[1] : null;

    return {
      base_id: baseId.padStart(3, "0"),
      character_name: characterName,
      model_name: modelName,
      path: filePath,
    };
  }

  // Case 2: "Other" directory
  if (parts[0] === "Other") {
    return {
      base_id: null,
      character_name: null,
      model_name: parts[1] || null,
      path: filePath,
    };
  }

  // Case 3: Paths with numeric folder (second to last part)
  if (parts.length >= 2) {
    const secondToLastPart = parts[parts.length - 2];
    if (/^\d+$/.test(secondToLastPart)) {
      const numericId = secondToLastPart;
      const baseId = numericId.substring(0, 3);

      return {
        base_id: baseId,
        character_name: null, // We're not loading CHARACTER_DATA as specified
        model_name: numericId,
        path: filePath,
      };
    }
  }

  // If none of the cases match, return null
  return null;
}

export default async function generateLive2D() {
  console.log("🎭 Starting Live2D model data generation...");

  // Load the Live2D file listing
  console.log("📋 Reading Live2D file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-live2d");

  console.log("🔄 Processing Live2D model files...");
  const models = fileList.map((path) => parseLive2DPath(path)).filter((model) => model !== null);

  console.log(`✨ Generated data for ${models.length} Live2D models`);
  return models;
}
