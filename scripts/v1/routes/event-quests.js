import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

function extractEventId(filePath) {
  // Look for event quest logo pattern first as it's our primary identifier
  const match = filePath.match(/event_quest_logo_(\d+)\.png$/);
  if (match) return match[1];
  
  // Try other patterns if the first one fails
  const otherMatches = filePath.match(/(?:event_quest|event_story_s|event_boss_battle|panel_(?:bg|mission_(?:large|small)_banner))_(\d+)\.png$/);
  return otherMatches ? otherMatches[1] : null;
}

export default async function generateEventQuests() {
  console.log("🎮 Starting event quests data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // First get all event quest logo paths as they are our primary identifiers
  console.log("🔍 Filtering event quest assets...");
  const logoFiles = fileList.filter(line => 
    line.includes("/AllParticipationEventLogo/") && 
    line.includes("event_quest_logo_") &&
    line.endsWith(".png")
  );

  // Get unique event IDs from logos
  const eventIds = new Set();
  logoFiles.forEach(path => {
    const id = extractEventId(path);
    if (id) eventIds.add(id);
  });

  console.log(`🎯 Found ${eventIds.size} unique event quests`);

  // Process each event
  const events = Array.from(eventIds).map(id => {
    // Create event object with all possible assets
    return {
      id,
      // Main event assets
      logo: fileList.find(p => p.includes(`event_quest_logo_${id}.png`)) || null,
      topBg: fileList.find(p => p.includes(`event_quest_top_bg_${id}.png`)) || null,
      btnQuest: fileList.find(p => p.includes(`btn_event_quest_${id}.png`)) || null,
      
      // Story and boss battle buttons
      btnStory: fileList.find(p => p.includes(`btn_event_story_s_${id}.png`)) || null,
      btnBoss: fileList.find(p => p.includes(`btn_event_boss_battle_${id}.png`)) || null,
      
      // Panel mission assets
      panelBg: fileList.find(p => p.includes(`/PanelMissionUI/panel_bg_${id}.png`)) || null,
      panelLargeBanner: fileList.find(p => p.includes(`panel_mission_large_banner_${id}.png`)) || null,
      panelSmallBanner: fileList.find(p => p.includes(`panel_mission_small_banner_${id}.png`)) || null,
      
      // Additional logo in different location
      participationLogo: fileList.find(p => 
        p.includes(`/AllParticipationEventLogo/all_participation_event_logo_${id}.png`) && 
        !p.includes("event_quest_logo_")
      ) || null
    };
  });

  // Validate completeness
  console.log("\n📊 Asset Completeness Check:");
  events.forEach(event => {
    const missing = [];
    if (!event.logo) missing.push("logo");
    if (!event.topBg) missing.push("topBg");
    if (!event.btnQuest) missing.push("btnQuest");
    if (!event.btnStory) missing.push("btnStory");
    if (!event.btnBoss) missing.push("btnBoss");
    if (!event.panelBg) missing.push("panelBg");
    if (!event.panelLargeBanner) missing.push("panelLargeBanner");
    if (!event.panelSmallBanner) missing.push("panelSmallBanner");
    // Don't report missing participationLogo as it might be optional

    if (missing.length > 0) {
      console.log(`⚠️  Event ${event.id} is missing assets:`, missing.join(", "));
    }
  });

  // Sort by ID for consistent output
  return events.sort((a, b) => parseInt(a.id) - parseInt(b.id));
} 
