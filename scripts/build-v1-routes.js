import { readdir, writeFile } from "fs/promises";
import { join } from "path";

export async function buildRoutes(ROUTES_DIR, API_DIR, filterWords) {
  // Read all .js files from the routes directory
  console.log("🔍 Reading route files...");
  const files = await readdir(ROUTES_DIR);
  const routeFiles = files
    .filter(file => file.endsWith(".js"))
    .filter(file => {
      if (!filterWords) return true;
      const fileNameWithoutExt = file.replace('.js', '');
      return filterWords.some(word => fileNameWithoutExt.includes(word));
    });

  console.log(`📦 Found ${routeFiles.length} route files to process`);

  // Process each route file
  const errors = [];
  for (const file of routeFiles) {
    console.log(`🔄 Processing ${file}...`);
    try {
      const routeModule = await import(join(ROUTES_DIR, file));
      const data = await routeModule.default();

      // Generate output filename (replace .js with .json)
      const outputFile = join(API_DIR, file.replace(".js", ".json"));

      // Write the JSON file
      await writeFile(outputFile, JSON.stringify(data, null, 2));
      console.log(`✨ Generated ${outputFile}`);
    } catch (error) {
      errors.push({ file, error: error.message });
      console.error(`❌ Failed to process ${file}:`, error);
    }
  }

  return errors;
} 
