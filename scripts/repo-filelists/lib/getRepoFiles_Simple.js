/**
 * Simple repository file listing
 * Just tries to get all files in one go using the recursive tree API
 * @param {string} username - GitHub username
 * @param {string} repo - Repository name
 * @param {string} [token] - Optional GitHub Personal Access Token
 */
export async function getRepoFiles_Simple(username, repo, token) {
  console.log("🔍 Fetching repository contents...");

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchWithAuth = async (branch) => {
    console.log(`🌿 Attempting to fetch ${branch} branch...`);
    const response = await fetch(`https://api.github.com/repos/${username}/${repo}/git/trees/${branch}?recursive=1`, {
      headers,
    });

    if (!response.ok) {
      console.error(`❌ Failed to fetch ${branch} branch:`, {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });
      return null;
    }

    console.log(`✅ Successfully fetched ${branch} branch`);
    return response.json();
  };

  // Try 'main' branch first
  const mainResult = await fetchWithAuth("main");
  if (mainResult) return mainResult;

  // Fall back to 'master' branch
  const masterResult = await fetchWithAuth("master");
  if (masterResult) return masterResult;

  throw new Error("❌ Failed to fetch repository contents from both main and master branches");
}
