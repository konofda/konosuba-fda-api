import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { downloadRepoFileList } from "./downloadRepoFileList.js";
import { REPO_FILES_DIR } from "../common/constants.js";

/**
 * Load repository file list, downloading it first if needed
 * @param {string} username - GitHub username
 * @param {string} repo - Repository name
 * @param {boolean} [force=false] - Force download even if file exists
 * @returns {Promise<string[]>} Array of file paths
 */
export async function getRepoFileListAsync(username, repo, force = false) {
  console.log("📂 Loading repository file list...");
  const filePath = join(REPO_FILES_DIR, username, `${repo}.txt`);

  const githubToken = process.env.GITHUB_TOKEN;

  // If file doesn't exist or force is true, download it
  if (force || !existsSync(filePath)) {
    console.log("🌐 File not found or force download requested, fetching from GitHub...");
    await downloadRepoFileList(username, repo, githubToken);
  }

  // Read and return the file contents
  console.log("📖 Reading file list from disk...");
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim().length > 0);

  console.log(`✨ Loaded ${lines.length} file paths`);
  return lines;
}
