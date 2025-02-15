import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

const ASSET_TYPES = ["bg", "btn", "frame", "logo", "occurrence"];

function extractEventId(filePath) {
  // Look for the event ID in the path structure
  const match = filePath.match(/SurpriseEventUI\/Menu\/(\d+)\//);
  // For top guide images, try alternate pattern if first one fails
  if (!match) {
    const guideMatch = filePath.match(/surprise_mini_event_top_guide_(\d+)_/);
    return guideMatch ? guideMatch[1] : null;
  }
  return match[1];
}

function validateEventPath(filePath, expectedId) {
  // Only validate our specific asset types
  const assetTypePattern = ASSET_TYPES.join("|");
  const filenameMatch = filePath.match(new RegExp(`surprise_mini_event_(${assetTypePattern})_${expectedId}\\.png$`));
  return !!filenameMatch;
}

export default async function generateSurpriseMiniEvents() {
  console.log("🎉 Starting surprise mini events data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // First get all core asset paths
  console.log("🔍 Filtering core event assets...");
  const coreEventPaths = fileList.filter(line => 
    line.endsWith(".png") &&
    line.includes("/SurpriseEventUI/Menu/") && 
    ASSET_TYPES.some(type => line.includes(`surprise_mini_event_${type}_`))
  );

  // Get all top guide paths separately
  const topGuidePaths = fileList.filter(line => 
    line.endsWith(".png") && 
    line.includes("surprise_mini_event_top_guide_")
  );

  // Get unique event IDs from core assets only
  const eventIds = new Set();
  coreEventPaths.forEach(path => {
    const id = extractEventId(path);
    if (id) eventIds.add(id);
  });

  console.log(`🎯 Found ${eventIds.size} unique surprise mini events`);

  // Process each event
  const events = Array.from(eventIds).map(id => {
    const eventFiles = coreEventPaths.filter(path => {
      const pathId = extractEventId(path);
      return pathId === id;
    });

    // Find matching top guide if it exists
    const topGuide = topGuidePaths.find(path => {
      const pathId = extractEventId(path);
      return pathId === id;
    }) || null;
    
    // Create event object with all assets
    return {
      id,
      bg: eventFiles.find(p => p.includes("_bg_")) || null,
      btn: eventFiles.find(p => p.includes("_btn_")) || null,
      frame: eventFiles.find(p => p.includes("_frame_")) || null,
      logo: eventFiles.find(p => p.includes("_logo_")) || null,
      occurrence: eventFiles.find(p => p.includes("_occurrence_")) || null,
      topGuide
    };
  });

  // Validate completeness
  console.log("\n📊 Asset Completeness Check:");
  events.forEach(event => {
    const missing = [];
    if (!event.bg) missing.push("bg");
    if (!event.btn) missing.push("btn");
    if (!event.frame) missing.push("frame");
    if (!event.logo) missing.push("logo");
    if (!event.occurrence) missing.push("occurrence");
    // Don't report missing topGuide as it might be optional

    if (missing.length > 0) {
      console.log(`⚠️  Event ${event.id} is missing assets:`, missing.join(", "));
    }
  });

  // Sort by ID for consistent output
  return events.sort((a, b) => parseInt(a.id) - parseInt(b.id));
} 
