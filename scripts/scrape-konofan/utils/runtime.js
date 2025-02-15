/**
 * Checks if the current module is being run directly (not imported)
 * Handles both Windows and Unix-style paths
 * @param {string} moduleUrl - The import.meta.url of the calling module
 * @returns {boolean} True if the module is being run directly
 */
export function isMainModule(moduleUrl) {
  if (!process.argv[1] || !moduleUrl) return false;

  // Convert both paths to use forward slashes and remove 'file://' prefix
  const normalized = (url) =>
    url //
      .replace(/file:\/\//g, "")
      .replace(/\\/g, "/");

  const scriptPath = normalized(process.argv[1]);
  const modulePath = normalized(moduleUrl);

  // console.log({ scriptPath, modulePath, argument1: process.argv[1], moduleUrl });

  return scriptPath === modulePath;
}
