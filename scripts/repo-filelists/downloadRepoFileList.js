import { REPO_FILES_DIR } from "../common/constants.js";
import { getRepoFiles_Simple } from "./lib/getRepoFiles_Simple.js";
import { getRepoFiles_WithTraversal } from "./lib/getRepoFiles_WithTraversal.js";
import { saveFileList } from "./lib/saveFileList.js";

/**
 * Save a list of files from a GitHub repository
 * @param {string} username - GitHub username
 * @param {string} repo - Repository name
 * @param {string} [token] - Optional GitHub Personal Access Token
 * @returns {Promise<string>} Path to the saved file
 */
export async function downloadRepoFileList(username, repo, token) {
  let filePaths;

  try {
    console.log("🔍 Attempting simple repository fetch...");
    const data = await getRepoFiles_Simple(username, repo);
    if (!data.tree) {
      console.error("❌ Repository data structure is invalid:", data);
      throw new Error("Repository data structure is unexpected");
    }
    filePaths = data.tree
      .filter((item) => item.type === "blob" && !item.path.startsWith(".") && item.path !== "README.md")
      .map((item) => item.path)
      .sort();

    console.log(`✨ Successfully fetched ${filePaths.length} files using simple method`);
  } catch (error) {
    console.error("🚨 Simple fetch error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.response?.url,
      headers: error.response?.headers,
    });

    if (!token) {
      console.log("⚠️ Simple fetch failed - a token might help with larger repositories");
      throw new Error(
        `Failed to fetch repository files (${error.response?.status || "unknown status"}): ` +
          `${error.message}. Try using a GitHub token for better results.`
      );
    }

    // Fall back to traversal method if we have a token
    console.log("🔄 Falling back to detailed traversal with authentication...");
    try {
      filePaths = await getRepoFiles_WithTraversal(username, repo, token);
      console.log(`✨ Successfully fetched ${filePaths.length} files using traversal method`);
    } catch (traversalError) {
      console.error("💥 Traversal method error details:", {
        message: traversalError.message,
        status: traversalError.response?.status,
        statusText: traversalError.response?.statusText,
        url: traversalError.response?.url,
        headers: traversalError.response?.headers,
      });
      throw traversalError; // Re-throw to be handled by caller
    }
  }

  try {
    const savedPath = await saveFileList(username, repo, filePaths, REPO_FILES_DIR);
    console.log("💾 Successfully saved file list to:", savedPath);
    return savedPath;
  } catch (saveError) {
    console.error("📝 Error saving file list:", {
      message: saveError.message,
      code: saveError.code, // For filesystem errors
      path: saveError.path, // For filesystem errors
    });
    throw saveError;
  }
}
