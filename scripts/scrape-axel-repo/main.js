import { scrapeStories } from './story-routes.js';

async function main() {
  try {
    console.log('🚀 Starting Axel repo scraping...');
    await scrapeStories();
    console.log('✨ All done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main(); 
