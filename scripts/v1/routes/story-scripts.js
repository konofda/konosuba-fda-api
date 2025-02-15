import { getWikiDataAsync } from "../../common/getWikiDataAsync.js";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

export default async function generateStoryScripts() {
  console.log("📖 Starting story scripts metadata generation...");

  // Load the story scripts listing file
  console.log("📋 Reading story scripts file listing...");
  const storyList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-story");

  // Read and parse the metadata YAML
  console.log("📚 Reading story metadata...");
  const metadata = await getWikiDataAsync("meta-konofan-story");

  console.log("🔄 Processing and parsing story IDs and parts...");
  const stories = storyList.map((path) => {
    // Extract just the filename without extension
    const filename = path.split("/").pop().replace(".txt", "");

    // Extract only digits from the filename
    const digits = filename.replace(/\D/g, "");

    // Parse story ID and part
    const part = parseInt(digits.slice(-2), 10);
    const story = parseInt(digits.slice(0, -2), 10);

    return {
      path,
      story,
      part,
    };
  });

  console.log(`✨ Generated metadata for ${stories.length} story scripts`);
  return stories;
}
