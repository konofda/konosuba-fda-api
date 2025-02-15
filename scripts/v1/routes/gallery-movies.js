import { fetchAxelFile } from "../../scrape-axel-repo/fetchAxelFile.js";
import { processTextFields } from "../../scrape-axel-repo/utils.js";

export default async function generateGalleryMovies() {
  console.log("🎬 Starting gallery movies generation...");

  // Fetch and translate gallery movie data from Axel
  console.log("🔄 Fetching gallery movie data from Axel...");
  const axelMovies = await fetchAxelFile('gallery_movie');
  const translatedMovies = await processTextFields(axelMovies);

  console.log(`✨ Generated data for ${translatedMovies.length} gallery movies`);
  return translatedMovies;
} 
