import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { processTextFields } from './utils.js';
import { fetchAxelFile } from './fetchAxelFile.js';
import { getRepoFileListAsync } from '../repo-filelists/getRepoFileListAsync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const processStoryData = async (data, repoFiles, usedPaths) => {
  const processed = await processTextFields(data);
  const results = processed.map(item => {
    const matchingPath = repoFiles.find(f => f.endsWith(`${item.id}.txt`));
    if (matchingPath) {
      usedPaths.add(matchingPath);
    }

    // Remove all "0" values
    Object.keys(item).forEach(key => {
      if (item[key] === "0") {
        delete item[key];
      }
    });

    return {
      ...item,
      scriptPath: matchingPath || null,
      // part: parseInt(item.id.slice(-2), 10)
    };
  });

  return {
    items: results,
    stats: {
      total: results.length,
      withPath: results.filter(item => item.path !== null).length,
      withoutPath: results.filter(item => item.path === null).length
    }
  };
};

const saveStoryData = async (filename, data) => {
  const outputPath = path.join(dirname(__dirname), '..', 'dist', 'v1', filename);
  await fs.writeFile(outputPath, JSON.stringify(data.items, null, 2));
  console.log(`✅ Saved ${outputPath}`);
  return data.stats;
};

const printStats = (stats, repoFiles, usedPaths) => {
  console.log('\n📊 Story Processing Results:');
  console.log('Type'.padEnd(15), 'Total'.padEnd(8), 'Found'.padEnd(8), 'Missing'.padEnd(8), 'Coverage');
  console.log('─'.repeat(55));

  let totalItems = 0;
  let totalMissing = 0;

  Object.entries(stats).forEach(([type, typeStat]) => {
    totalItems += typeStat.total;
    totalMissing += typeStat.withoutPath;
    const coverage = ((typeStat.withPath / typeStat.total) * 100).toFixed(1);
    console.log(
      type.padEnd(15),
      String(typeStat.total).padEnd(8),
      String(typeStat.withPath).padEnd(8),
      String(typeStat.withoutPath).padEnd(8),
      `${coverage}%`
    );
  });

  console.log('─'.repeat(55));
  const totalCoverage = ((1 - totalMissing / totalItems) * 100).toFixed(1);
  console.log(
    'TOTAL'.padEnd(15),
    String(totalItems).padEnd(8),
    String(totalItems - totalMissing).padEnd(8),
    String(totalMissing).padEnd(8),
    `${totalCoverage}%`
  );

  const unusedPaths = repoFiles.filter(f => !usedPaths.has(f));
  console.log('\n📁 Repository Status:');
  console.log(`Total files: ${repoFiles.length}, Used: ${usedPaths.size}, Unused: ${unusedPaths.length}`);

  if (unusedPaths.length > 0) {
    console.log('\n⚠️  Unused files:');
    unusedPaths.forEach(f => console.log(`  ${f}`));
  }
};

const scrapeStories = async () => {
  const storyTypes = [
    { type: 'member', output: 'stories-member.json' },
    { type: 'main', output: 'stories-main.json' },
    { type: 'gacha', output: 'stories-gacha.json' },
    { type: 'unique', output: 'stories-unique.json' },
    { type: 'reminiscence', output: 'stories-reminiscence.json' },
    { type: 'event', output: 'stories-event.json' },
    { type: 'etc', output: 'stories-etc.json' }
  ];

  const repoFiles = await getRepoFileListAsync('HaiKonofanDesu', 'konofan-story');
  const stats = {};
  const usedPaths = new Set();

  for (const { type, output } of storyTypes) {
    console.log(`📚 Processing story_${type}...`);
    try {
      const data = await fetchAxelFile(`story_${type}`);
      const processed = await processStoryData(data, repoFiles, usedPaths);
      stats[type] = await saveStoryData(output, processed);
    } catch (error) {
      console.error(`❌ Error processing story_${type}:`, error);
      stats[type] = { total: 0, withPath: 0, withoutPath: 0 };
    }
  }

  printStats(stats, repoFiles, usedPaths);
};

export { scrapeStories }; 
