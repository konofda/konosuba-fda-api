import { downloadRepoFileList } from "./repo-filelists/downloadRepoFileList.js";

// ANSI color codes
const colors = {
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  dim: "\x1b[2m",
};

function printWarning(token) {
  console.warn(`
    ${colors.yellow}⚠️  No GitHub token found!${colors.reset}
    ${colors.dim}Running in unauthenticated mode with limited API rate.
    Large repositories like "konofan-audio" might fail to list all files.
    
    To use with a GitHub Personal Access Token:
    1. Create a token at: ${colors.cyan}https://github.com/settings/tokens${colors.reset}${colors.dim}
    2. Run the script with:
    ${colors.cyan}GITHUB_TOKEN=your_token pnpm list-repo <username> <repo>${colors.reset}${colors.dim}

    Proceeding with unauthenticated access...${colors.reset}
    `);
}

async function main() {
  const [, , username, repo] = process.argv;
  const token = process.env.GITHUB_TOKEN;

  if (!username || !repo) {
    console.error("❌ Please provide both username and repository name");
    console.error("📝 Usage: node scripts/list-repo-files.js <username> <repo>");
    console.error("💡 Optional: GITHUB_TOKEN=<token> node scripts/list-repo-files.js <username> <repo>");
    process.exit(1);
  }

  if (!token) {
    printWarning(token);
  }

  try {
    console.log(`🚀 Starting to process ${username}/${repo}...`);
    await downloadRepoFileList(username, repo, token);
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();
