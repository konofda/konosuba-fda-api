import { getWikiDataAsync } from "../../common/getWikiDataAsync.js";
import { fetchAxelFile } from "../../scrape-axel-repo/fetchAxelFile.js";
import { processTextFields } from "../../scrape-axel-repo/utils.js";
import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

export default async function generateGallerySongs() {
  console.log("🎵 Starting gallery songs metadata generation...");

  // Load the gallery movie data from Axel
  console.log("📋 Reading gallery movie data...");
  const movieData = await fetchAxelFile("gallery_movie");
  const processedMovies = await processTextFields(movieData);

  // Read and parse the metadata YAML
  console.log("📚 Reading gallery metadata...");
  const metadata = await getWikiDataAsync("meta-axel-gallery-movie");

  // Load the assets file listing
  console.log("🖼️ Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  console.log("🔄 Processing and combining data...");
  const songs = processedMovies.map((movie) => {
    const meta = metadata[movie.movie];
    const icon = fileList.find(path => 
      path.includes("IconMovie") && 
      path.includes(movie.list_icon)
    );

    return { 
      ...movie, 
      ...meta,
      icon: icon || null
    };
  });

  // Create ordered map of metadata keys for sorting
  const metaOrder = Object.keys(metadata).reduce((acc, key, idx) => {
    acc.set(key, idx);
    return acc;
  }, new Map());

  // Sort songs: metadata order first, then story_id for remaining items
  songs.sort((a, b) => {
    const aIdx = metaOrder.get(a.movie);
    const bIdx = metaOrder.get(b.movie);

    // If both have metadata order, use it
    if (aIdx !== undefined && bIdx !== undefined) {
      return aIdx - bIdx;
    }
    // If only one has metadata order, prioritize it
    if (aIdx !== undefined) return -1;
    if (bIdx !== undefined) return 1;
    // For items without metadata, use story_id
    return a.story_id.localeCompare(b.story_id);
  });

  // Log any songs missing icons
  const missingSongs = songs.filter(song => !song.icon);
  if (missingSongs.length > 0) {
    console.log("\n⚠️ Songs missing icons:");
    missingSongs.forEach(song => {
      console.log(`  - ${song.title} (list_icon: ${song.list_icon})`);
    });
  }

  console.log(`✨ Generated metadata for ${songs.length} songs`);
  return songs;
}
