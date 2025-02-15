import { cp } from "fs/promises";

export async function copyStaticFiles(publicDir, distDir) {
  console.log("🌐 Copying public files to dist...");
  try {
    await cp(publicDir, distDir, { recursive: true });
    console.log("📂 Public files copied successfully");
  } catch (error) {
    console.error("❌ Error copying public files:", error);
    throw error;
  }
}
