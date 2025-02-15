import { config } from "dotenv";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { copyStaticFiles } from "./static/copyStaticFiles.js";
import { scrapeStories } from "./scrape-axel-repo/story-routes.js";
import { buildRoutes } from "./build-v1-routes.js";
import { buildAxelRoutes } from "./build-axel-routes.js";

// Load environment variables from .env file
config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Directory configuration
const PATHS = {
  public: join(process.cwd(), "public"),
  routes: join(__dirname, "v1", "routes"),
  dist: join(process.cwd(), "dist"),
  apiV1: join(process.cwd(), "dist", "v1"),
};

// CLI argument configuration
const CLI_FLAGS = {
  // Build scope flags
  onlyV1: "--v1-only",
  onlyAxel: "--axel-only",
  onlyMisc: "--misc-only",
  // Build behavior flags
  continueOnError: "--continue-on-error",
  noZeroProps: "--no-zero-props",
  // Filter flag (special handling)
  filter: "--filter=",
};

function parseArgs(args) {
  const hasFlag = flag => args.includes(flag);
  const getFilterWords = () => {
    const filterArg = args.find(arg => arg.startsWith(CLI_FLAGS.filter));
    return filterArg ? filterArg.replace(CLI_FLAGS.filter, "").split(",") : null;
  };

  return {
    onlyV1: hasFlag(CLI_FLAGS.onlyV1),
    onlyAxel: hasFlag(CLI_FLAGS.onlyAxel),
    onlyMisc: hasFlag(CLI_FLAGS.onlyMisc),
    continueOnError: hasFlag(CLI_FLAGS.continueOnError),
    noZeroProps: hasFlag(CLI_FLAGS.noZeroProps),
    filterWords: getFilterWords(),
  };
}

async function buildV1Routes(options) {
  await mkdir(PATHS.apiV1, { recursive: true });
  return await buildRoutes(
    PATHS.routes, 
    PATHS.apiV1, 
    options.filterWords?.length ? options.filterWords : null
  );
}

async function buildAll(options) {
  const errors = [];

  // Copy static files
  await copyStaticFiles(PATHS.public, PATHS.dist);

  // Build V1 routes
  if (!options.onlyAxel && !options.onlyMisc) {
    const v1Errors = await buildV1Routes(options);
    errors.push(...v1Errors);
  }

  // Build Axel routes
  if (!options.onlyV1 && !options.onlyMisc) {
    const axelSuccess = await buildAxelRoutes(options.filterWords, options.noZeroProps);
    if (!axelSuccess) {
      errors.push({ file: "axel-routes", error: "Failed to build Axel routes" });
    }
  }

  // Build misc (stories)
  if (!options.onlyV1 && !options.onlyAxel) {
    if (!options.filterWords?.length || options.filterWords.includes("story")) {
      scrapeStories();
    }
  }

  return errors;
}

async function main() {
  console.log("🏗️ Starting build process...");
  
  const options = parseArgs(process.argv.slice(2));
  
  // Log build configuration
  if (options.continueOnError) console.log("🚨 Continue on error mode enabled");
  if (options.noZeroProps) console.log("🧹 Zero value properties will be removed");
  if (options.filterWords) console.log(`🎯 Using filter words: ${options.filterWords.join(", ")}`);

  try {
    console.log("📁 Creating necessary directories...");
    const errors = await buildAll(options);

    if (errors.length > 0) {
      console.log("\n⚠️ Build completed with the following errors:");
      errors.forEach(({ file, error }) => console.log(`  ❌ ${file}: ${error}`));
      if (!options.continueOnError) process.exit(1);
    } else {
      console.log("✅ Build completed successfully!");
    }
  } catch (error) {
    console.error("❌ Error during build setup:", error);
    if (!options.continueOnError) process.exit(1);
  }
}

main();
