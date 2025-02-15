import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

/**
 * Save repository file list to disk
 */
export async function saveFileList(username, repo, filePaths, outputDir) {
  // Create output directory
  const userDir = join(outputDir, username);
  await mkdir(userDir, { recursive: true });

  // Write to file
  const outputPath = join(userDir, `${repo}.txt`);
  await writeFile(outputPath, filePaths.join("\n"));

  console.log(`✅ Successfully saved file list to ${outputPath}`);
  console.log(`📊 Total files listed: ${filePaths.length}`);

  return outputPath;
}
