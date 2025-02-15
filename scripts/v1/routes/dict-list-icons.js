import { getRepoFileListAsync } from "../../repo-filelists/getRepoFileListAsync.js";

/**
 * Extracts the ID from a file path based on the first 4 digits
 */
function extractId(filePath) {
  const base = filePath
    .split("/")
    .pop()
    .replace(/\.[^/.]+$/, ""); // Remove file extension first
  // For member cards, handle special cases first
  if (filePath.includes("Member")) {
    return base
      .replace("IconMiddleMember", "")
      .replace("IconLargeMember", "")
      .replace("MemberCardFull", "")
      .replace("IconMember", "")
      .replace(/[_-]+$/, "")
      .trim();
  }
  // For stills and backgrounds, extract first 4 digits
  const match = base.match(/^(\d{4})/);
  return match ? match[1] : null;
}

export default async function generateDictListIcons() {
  console.log("🎯 Starting icon dictionary generation...");

  // Load the assets file listing
  console.log("📋 Reading assets file listing...");
  const fileList = await getRepoFileListAsync("HaiKonofanDesu", "konofan-assets-jp-sortet");

  // Filter paths for each category
  console.log("🔍 Filtering icon assets...");
  const iconStillPaths = fileList.filter((line) => line.includes("IconStill"));
  const iconBgPaths = fileList.filter((line) => line.includes("IconBackground"));
  const iconMemberPaths = fileList.filter((line) => line.includes("IconMiddleMember"));

  // Create the unified dictionary
  console.log("✨ Building unified icon dictionary...");
  const iconDict = {};

  // Process stills
  iconStillPaths.forEach((path) => {
    const id = extractId(path);
    if (id) {
      iconDict[`still_${id}`] = path;
    }
  });

  // Process backgrounds
  iconBgPaths.forEach((path) => {
    const id = extractId(path);
    if (id) {
      iconDict[`background_${id}`] = path;
    }
  });

  // Process member cards
  iconMemberPaths.forEach((path) => {
    const id = extractId(path);
    if (id) {
      iconDict[`member_${id}`] = path;
    }
  });

  // Log statistics
  console.log("\n📊 Icon Dictionary Statistics:");
  const stillCount = Object.keys(iconDict).filter((k) => k.startsWith("still_")).length;
  const bgCount = Object.keys(iconDict).filter((k) => k.startsWith("background_")).length;
  const memberCount = Object.keys(iconDict).filter((k) => k.startsWith("member_")).length;

  console.log(`🖼️ Total icons: ${Object.keys(iconDict).length}`);
  console.log(`🎭 Still icons: ${stillCount}`);
  console.log(`🏞️ Background icons: ${bgCount}`);
  console.log(`👤 Member icons: ${memberCount}`);

  return iconDict;
}
