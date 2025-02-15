import { TaskQueue } from "../../common/TaskQueue.js";

const MAX_CONCURRENT_REQUESTS = 25;

/**
 * Base GitHub API fetching function with authentication
 */
async function fetchGitHub(url, token) {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    Authorization: `token ${token}`,
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`❌ GitHub API error (${response.status}): ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get repository's default branch
 */
async function getDefaultBranch(username, repo, token) {
  console.log("🔍 Detecting default branch...");
  const data = await fetchGitHub(`https://api.github.com/repos/${username}/${repo}`, token);
  console.log(`📌 Using branch: ${data.default_branch}`);
  return data.default_branch;
}

/**
 * Get contents of a specific tree
 */
async function getTreeContents(username, repo, treeSha, token) {
  return fetchGitHub(`https://api.github.com/repos/${username}/${repo}/git/trees/${treeSha}`, token);
}

/**
 * Detailed repository file listing with authentication and tree traversal
 * Uses task queue to handle concurrent requests and traverses the tree structure
 */
export async function getRepoFiles_WithTraversal(username, repo, token) {
  if (!token) {
    throw new Error("🔑 Authentication token is required for detailed repository traversal");
  }

  console.log("🌲 Getting repository tree structure...");
  const files = new Set();
  const processedTrees = new Set();
  let totalItems = 0;
  const taskQueue = new TaskQueue(MAX_CONCURRENT_REQUESTS);

  async function processTree(treeSha, path = "") {
    if (processedTrees.has(treeSha)) return;
    processedTrees.add(treeSha);

    const tree = await taskQueue.add(() => getTreeContents(username, repo, treeSha, token));
    totalItems += tree.tree.length;
    console.log(`📂 Processing directory "${path || "/"}" (${tree.tree.length} items)...`);

    const dirPromises = [];

    for (const item of tree.tree) {
      const itemPath = path ? `${path}/${item.path}` : item.path;

      if (item.type === "tree") {
        dirPromises.push(processTree(item.sha, itemPath));
      } else if (item.type === "blob" && !item.path.startsWith(".") && item.path !== "README.md") {
        files.add(itemPath);
      }
    }

    await Promise.all(dirPromises);
  }

  const defaultBranch = await getDefaultBranch(username, repo, token);
  const rootData = await fetchGitHub(
    `https://api.github.com/repos/${username}/${repo}/git/refs/heads/${defaultBranch}`,
    token
  );
  const commitData = await fetchGitHub(
    `https://api.github.com/repos/${username}/${repo}/git/commits/${rootData.object.sha}`,
    token
  );

  await processTree(commitData.tree.sha);
  console.log(`📊 Processed ${totalItems} total items across ${processedTrees.size} directories`);
  return Array.from(files).sort();
}
