import { readFile } from "fs/promises";
import { join } from "path";
import * as YAML from "yaml";
import { WIKI_DIR } from "./constants.js";

/**
 * Loads and parses a wiki file from the wiki directory
 * @param {string} filename - The name of the wiki file to load (without .yaml extension)
 * @returns {Promise<any>} The parsed content of the wiki file
 */
export const getWikiDataAsync = async (filename) => {
  const filePath = join(WIKI_DIR, `${filename}.yaml`);
  const content = await readFile(filePath, "utf-8");
  return YAML.parse(content);
};
