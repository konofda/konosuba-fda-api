import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { fetchAxelFile } from './scrape-axel-repo/fetchAxelFile.js';
import { processTextFields } from './scrape-axel-repo/utils.js';
import { DIST_DIR_API_AXEL } from './common/constants.js';
import { TaskQueue } from './common/TaskQueue.js';
import { removeZeroProps } from './axel/utils/removeZeroProps.js';
const AXEL_FILES = [
  "assist",
  "assist_details",
  "background",
  "banner",
  "battle_enemy",
  "battle_enemy_voice",
  "bgm",
  "campaign",
  "character",
  "character_enhance",
  "character_intimacy_details",
  "character_piece_board_reward",
  "character_piece_board_stage",
  "character_piece_board",
  "character_piece",
  "costume",
  "dungeon",
  "dungeon_area",
  "dungeon_benefit_level",
  "dungeon_benefit",
  "dungeon_stage",
  "equip_accessory",
  "equip_accessory_details",
  "equip_weapon",
  "equip_weapon_details",
  "event_boss_count",
  "event_config",
  "event_member",
  "event_mission",
  "event_mission_recommend",
  "event_quest_stage",
  "exchange_item",
  "exchange",
  "gacha",
  "gacha_tab",
  "gallery_group",
  "gallery_movie",
  "gallery_still",
  "honor",
  "item",
  "mainquest_area",
  "mainquest_stage",
  "member",
  "mission_honor",
  "mission_recommend",
  "mission",
  "shop",
  "shop_balloon",
  "shop_item",
  "story_etc",
  "story_event",
  "story_gacha",
  "story_main",
  "story_member",
  "story_reminiscence",
  "story_unique",
  "target_costume",
  "title_theme",
  "voice",
  // "pack",
];

async function processAxelFile(filename, noZeroProps) {
  console.log(`🔄 Processing ${filename}...`);
  try {
    const data = await fetchAxelFile(filename);
    const processed = await processTextFields(data);
    const finalData = noZeroProps ? removeZeroProps(processed) : processed;
    const outputPath = join(DIST_DIR_API_AXEL, `${filename}.json`);
    await mkdir(DIST_DIR_API_AXEL, { recursive: true });
    await writeFile(outputPath, JSON.stringify(finalData, null, 2));
    console.log(`✨ Generated ${outputPath}`);
    return { filename, success: true };
  } catch (error) {
    console.error(`❌ Failed to process ${filename}:`, error);
    return { filename, success: false, error: error.message };
  }
}

export async function buildAxelRoutes(filterWords, noZeroProps = false) {
  console.log('🚀 Starting Axel routes build process...');
  if (noZeroProps) {
    console.log('🧹 Zero value properties will be removed');
  }

  const filesToProcess = filterWords 
    ? AXEL_FILES.filter(file => filterWords.some(word => file.includes(word)))
    : AXEL_FILES;

  console.log(`📦 Processing ${filesToProcess.length} files...`);

  const queue = new TaskQueue(24);
  const results = await Promise.all(
    filesToProcess.map(filename => 
      queue.add(() => processAxelFile(filename, noZeroProps))
    )
  );
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('\n📊 Build Results:');
  console.log(`✅ Successfully processed: ${successful.length}`);
  
  if (failed.length > 0) {
    console.log(`❌ Failed to process: ${failed.length}`);
    failed.forEach(({ filename, error }) => {
      console.log(`  - ${filename}: ${error}`);
    });
    return false;
  }

  console.log('🎉 All files processed successfully!');
  return true;
}
