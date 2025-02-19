import { fetchAxelFile } from "../../scrape-axel-repo/fetchAxelFile.js";
import { processTextFields } from "../../scrape-axel-repo/utils.js";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

function findAssetPath(fileList, pathPattern, fallback = null) {
  return fileList.find((path) => path.includes(pathPattern)) ?? fallback;
}

function normalizeGraphicId(graphic) {
  // Split by underscore, remove leading zeros after underscore, rejoin
  const [base, suffix] = graphic.split("_");
  return `${base}_${parseInt(suffix)}`;
}

export default async function generateDungeons() {
  console.log("🏰 Starting dungeons data generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Fetch all required data from Axel
  console.log("🔄 Fetching dungeon data from Axel...");
  const [dungeonData, areaData, stageData] = await Promise.all([
    fetchAxelFile("dungeon").then(processTextFields),
    fetchAxelFile("dungeon_area").then(processTextFields),
    fetchAxelFile("dungeon_stage").then(processTextFields),
  ]);

  // Create maps for efficient lookups
  console.log("🗺️ Creating area and stage mappings...");
  const areasByDungeon = new Map();
  const stagesByArea = new Map();

  // Create a map of area backgrounds for stage processing
  const areaBackgrounds = new Map(areaData.map((area) => [area.id, area.background]));

  // Group stages by area_id
  stageData.forEach((stage) => {
    if (!stagesByArea.has(stage.area_id)) {
      stagesByArea.set(stage.area_id, []);
    }

    // Add asset paths if they exist
    if (stage.graphic) {
      const normalizedGraphic = normalizeGraphicId(stage.graphic);

      stage.thumbnail = findAssetPath(fileList, `/DungeonStageThumbnail/bg_dungeon_${stage.graphic}_s.png`);
      stage.infobg = findAssetPath(fileList, `/QuestStageInfoBg/stage_info_${stage.graphic}.png`);
      stage.battlebg = findAssetPath(fileList, `${stage.graphic}/bg_dungeon_battle_${normalizedGraphic}`);
      // stage.battlefg = findAssetPath(fileList, `${stage.graphic}/bg_battle_foreground_${normalizedGraphic}`);
    }

    stagesByArea.get(stage.area_id).push(stage);
  });

  // Group areas by dungeon_id and attach their stages
  areaData.forEach((area) => {
    if (!areasByDungeon.has(area.dungeon_id)) {
      areasByDungeon.set(area.dungeon_id, []);
    }

    // Add button image if it exists
    if (area.button_image) {
      area.button_image = findAssetPath(
        fileList,
        `/DungeonButton/DungeonTop/${area.button_image}.png`,
        area.button_image
      );
    }

    // Attach stages to this area
    const areaWithStages = {
      ...area,
      stages: stagesByArea.get(area.id) || [],
    };

    // Sort stages by their order if available
    if (areaWithStages.stages.length > 0) {
      areaWithStages.stages.sort((a, b) => parseInt(a.order) - parseInt(b.order));
    }

    areasByDungeon.get(area.dungeon_id).push(areaWithStages);
  });

  // Build final dungeon objects with their areas
  console.log("✨ Building final dungeon data structures...");
  const dungeons = dungeonData.map((dungeon) => {
    // Get areas for this dungeon and sort them by order if available
    const areas = areasByDungeon.get(dungeon.id) || [];
    areas.sort((a, b) => parseInt(a.order) - parseInt(b.order));

    return {
      ...dungeon,
      areas,
    };
  });

  // Report statistics
  const totalAreas = dungeons.reduce((sum, d) => sum + d.areas.length, 0);
  const totalStages = dungeons.reduce(
    (sum, d) => sum + d.areas.reduce((areaSum, a) => areaSum + a.stages.length, 0),
    0
  );

  // Count assets found
  const stagesWithThumbnail = dungeons.reduce(
    (sum, d) => sum + d.areas.reduce((areaSum, a) => areaSum + a.stages.filter((s) => s.thumbnail).length, 0),
    0
  );
  const stagesWithInfobg = dungeons.reduce(
    (sum, d) => sum + d.areas.reduce((areaSum, a) => areaSum + a.stages.filter((s) => s.infobg).length, 0),
    0
  );
  const stagesWithBattlebg = dungeons.reduce(
    (sum, d) => sum + d.areas.reduce((areaSum, a) => areaSum + a.stages.filter((s) => s.battlebg).length, 0),
    0
  );
  // const stagesWithBattlefg = dungeons.reduce(
  //   (sum, d) => sum + d.areas.reduce((areaSum, a) => areaSum + a.stages.filter((s) => s.battlefg).length, 0),
  //   0
  // );
  const areasWithButton = dungeons.reduce(
    (sum, d) => sum + d.areas.filter((a) => typeof a.button_image === "string").length,
    0
  );

  console.log("\n📊 Dungeon Statistics:");
  console.log(`🏰 Total dungeons: ${dungeons.length}`);
  console.log(`🗺️ Total areas: ${totalAreas}`);
  console.log(`⭐ Total stages: ${totalStages}`);
  console.log("\n🖼️ Asset Coverage:");
  console.log(`🎯 Stages with thumbnail: ${stagesWithThumbnail}/${totalStages}`);
  console.log(`ℹ️ Stages with info background: ${stagesWithInfobg}/${totalStages}`);
  console.log(`⚔️ Stages with battle background: ${stagesWithBattlebg}/${totalStages}`);
  // console.log(`🎨 Stages with battle foreground: ${stagesWithBattlefg}/${totalStages}`);
  console.log(`🔘 Areas with button image: ${areasWithButton}/${totalAreas}`);

  // Sort dungeons by their order if available
  dungeons.sort((a, b) => parseInt(a.order) - parseInt(b.order));

  return dungeons;
}
