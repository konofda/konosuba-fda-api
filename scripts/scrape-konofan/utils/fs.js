import fs from "fs/promises";
import { OUTPUTS_DIR } from "./config.js";

/**
 * Ensures the outputs directory exists
 */
export async function ensureOutputDir() {
  await fs.mkdir(OUTPUTS_DIR, { recursive: true });
}

/**
 * Saves data to a JSON file
 * @param {string} filePath - Path to save the file
 * @param {any} data - Data to save
 */
export async function saveJsonToFile(filePath, data) {
  await ensureOutputDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Data saved to ${filePath}`);
}

/**
 * Reads data from a JSON file
 * @param {string} filePath - Path to read the file from
 * @returns {Promise<any>} Parsed JSON data
 */
export async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to read file ${filePath}:`, error);
    throw error;
  }
}
