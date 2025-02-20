import { fetchAxelFile } from "../../scrape-axel-repo/fetchAxelFile.js";
import { processTextFields } from "../../scrape-axel-repo/utils.js";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

function createCollectionMap(items, key = "event_id") {
  const map = new Map();
  items.forEach((item) => {
    if (!map.has(item[key])) {
      map.set(item[key], []);
    }
    map.get(item[key]).push(item);
  });
  return map;
}

function getMaxCount(events, field) {
  return Math.max(...events.map((e) => e[field]?.length || 0));
}

export default async function generateEvents() {
  console.log("🎉 Starting events data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const [
    fileList,
    eventConfig,
    eventMember,
    eventQuestStage,
    eventMission,
    eventMissionRecommend,
    eventBoxGachaInfinity,
    eventBoxGachaLimit,
    storyEvent,
    storyUnique,
  ] = await Promise.all([
    getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet"),
    fetchAxelFile("event_config").then(processTextFields),
    fetchAxelFile("event_member").then(processTextFields),
    fetchAxelFile("event_quest_stage").then(processTextFields),
    fetchAxelFile("event_mission").then(processTextFields),
    fetchAxelFile("event_mission_recommend").then(processTextFields),
    fetchAxelFile("event_box_gacha_infinity").then(processTextFields),
    fetchAxelFile("event_box_gacha_limit").then(processTextFields),
    fetchAxelFile("story_event").then(processTextFields),
    fetchAxelFile("story_unique").then(processTextFields),
  ]);

  // Create maps for efficient lookups
  console.log("🗺️ Creating data mappings...");
  const membersByEvent = createCollectionMap(eventMember);
  const stagesByEvent = createCollectionMap(eventQuestStage);
  const missionsByEvent = createCollectionMap(eventMission);
  const infinityGachaByEvent = createCollectionMap(eventBoxGachaInfinity);
  const limitGachaByEvent = createCollectionMap(eventBoxGachaLimit);
  const storyEventsByEvent = createCollectionMap(storyEvent);
  const storyUniqueByEvent = createCollectionMap(storyUnique);

  // Create mission recommendations map (keyed by mission_id)
  const recommendByMission = createCollectionMap(eventMissionRecommend, "mission_id");

  // Build final event objects with all related data
  console.log("✨ Building final event data structures...");
  const events = eventConfig.map((event) => {
    // Get all related data for this event
    const members = membersByEvent.get(event.event_id) || [];
    const stages = stagesByEvent.get(event.event_id) || [];
    const missions = missionsByEvent.get(event.event_id) || [];
    const infinityGacha = infinityGachaByEvent.get(event.event_id) || [];
    const limitGacha = limitGachaByEvent.get(event.event_id) || [];
    const storyEvents = storyEventsByEvent.get(event.event_id) || [];
    const storyUniques = storyUniqueByEvent.get(event.event_id) || [];

    // Add mission recommendations to each mission
    const missionsWithRecommends = missions.map((mission) => ({
      ...mission,
      recommendation: recommendByMission.get(mission.mission_id)?.[0] || null,
    }));

    // Sort arrays if they have an 'order' field
    stages.sort((a, b) => parseInt(a.order || 0) - parseInt(b.order || 0));
    missions.sort((a, b) => parseInt(a.mission_id) - parseInt(b.mission_id));

    // Find event images
    const images = {
      logo: fileList.find((path) => path.includes(`event_logo_${event.event_id}`)) || null,
      story_button: fileList.find((path) => path.includes(`btn_event_story_s_${event.event_id}`)) || null,
      quest_button: fileList.find((path) => path.includes(`btn_quest_${event.event_id}`)) || null,
      event_quest_button: fileList.find((path) => path.includes(`btn_event_quest_${event.event_id}`)) || null,
      boss_battle_button: fileList.find((path) => path.includes(`btn_event_boss_battle_${event.event_id}`)) || null,
      boss_battle_sp_button:
        fileList.find((path) => path.includes(`btn_event_boss_battle_sp_${event.event_id}`)) || null,
      emergency_boss_button:
        fileList.find((path) => path.includes(`btn_event_emergency_boss_battle_${event.event_id}`)) || null,
      scorechallenge_button:
        fileList.find((path) => path.includes(`btn_event_scorechallenge_${event.event_id}`)) || null,
    };

    delete event.info_url;
    delete event.info_url_boss;

    return {
      ...event,
      ...images,
      members,
      stages,
      missions: missionsWithRecommends,
      infinity_gacha: infinityGacha,
      limit_gacha: limitGacha,
      story_events: storyEvents,
      story_uniques: storyUniques,
    };
  });

  // Add image statistics
  console.log("\n🖼️ Event Image Statistics:");
  console.log(`📝 Events with logos: ${events.filter((e) => e.logo).length}`);
  console.log(`📖 Events with story buttons: ${events.filter((e) => e.story_button).length}`);
  console.log(`🎯 Events with quest buttons: ${events.filter((e) => e.quest_button).length}`);
  console.log(`🎮 Events with event quest buttons: ${events.filter((e) => e.event_quest_button).length}`);
  console.log(`⚔️ Events with boss battle buttons: ${events.filter((e) => e.boss_battle_button).length}`);
  console.log(`🌟 Events with special boss battle buttons: ${events.filter((e) => e.boss_battle_sp_button).length}`);
  console.log(`⚡ Events with emergency boss buttons: ${events.filter((e) => e.emergency_boss_button).length}`);
  console.log(`🏆 Events with score challenge buttons: ${events.filter((e) => e.scorechallenge_button).length}`);

  // Report statistics
  console.log("\n📊 Event Statistics:");
  console.log(`🎉 Total events: ${events.length}`);
  console.log(`👥 Events with members: ${events.filter((e) => e.members.length > 0).length}`);
  console.log(`🎯 Events with stages: ${events.filter((e) => e.stages.length > 0).length}`);
  console.log(`📋 Events with missions: ${events.filter((e) => e.missions.length > 0).length}`);
  console.log(`🎲 Events with infinity gacha: ${events.filter((e) => e.infinity_gacha.length > 0).length}`);
  console.log(`🎰 Events with limit gacha: ${events.filter((e) => e.limit_gacha.length > 0).length}`);
  console.log(`📖 Events with story events: ${events.filter((e) => e.story_events.length > 0).length}`);
  console.log(`📚 Events with story uniques: ${events.filter((e) => e.story_uniques.length > 0).length}`);

  // Report maximum counts
  console.log("\n📊 Maximum Counts Per Event:");
  console.log(`👥 Max members: ${getMaxCount(events, "members")}`);
  console.log(`🎯 Max stages: ${getMaxCount(events, "stages")}`);
  console.log(`📋 Max missions: ${getMaxCount(events, "missions")}`);
  console.log(`🎲 Max infinity gacha: ${getMaxCount(events, "infinity_gacha")}`);
  console.log(`🎰 Max limit gacha: ${getMaxCount(events, "limit_gacha")}`);
  console.log(`📖 Max story events: ${getMaxCount(events, "story_events")}`);
  console.log(`📚 Max story uniques: ${getMaxCount(events, "story_uniques")}`);

  // Sort events by start_at date for consistent output
  return events.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
}
