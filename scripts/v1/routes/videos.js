import { getWikiDataAsync } from "../../common/getWikiDataAsync.js";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

export default async function generateVideos() {
  console.log("🎥 Starting video metadata generation...");

  // Load the video listing file
  console.log("📋 Reading video file listing...");
  const videoList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-videos");

  // Read and parse the metadata YAML
  console.log("📚 Reading video metadata...");
  const metadata = await getWikiDataAsync("meta-konofan-videos");

  console.log("🔄 Processing and combining data...");
  const videos = videoList.map((path) => {
    const meta = metadata[path];
    const folders = path.split("/");
    const defaultCategory = folders.length >= 2 ? folders[1] : null;

    return {
      path,
      category: meta?.category ?? defaultCategory,
      name: meta?.name ?? null,
    };
  });

  console.log(`✨ Generated metadata for ${videos.length} videos`);
  return videos;
}
