import { getWikiDataAsync } from "../../common/getWikiDataAsync.js";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

export default async function generateMusic() {
  console.log("🎵 Starting music metadata generation...");

  // Load the audio listing file
  console.log("📋 Reading audio file listing...");
  const audioList = (await getRepoFileListAsync("HaiKonofanDesu", "konofan-audio"))
    // Filter for BGM .wav files only
    .filter((line) => line.startsWith("BGM") && line.endsWith(".wav"));

  // Read and parse the metadata YAML
  console.log("📚 Reading BGM metadata...");
  const metadata = await getWikiDataAsync("meta-konofan-audio-bgm");

  console.log("🔄 Processing and combining data...");
  const music = audioList.map((path) => {
    const meta = metadata[path];
    const folders = path.split("/");
    const defaultCategory = folders.length >= 2 ? folders[1] : null;

    return {
      path,
      category: meta?.category ?? defaultCategory,
      name: meta?.name ?? null,
    };
  });

  console.log(`✨ Generated metadata for ${music.length} BGM tracks`);
  return music;
}
