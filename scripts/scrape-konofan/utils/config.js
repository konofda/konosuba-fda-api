import path from "path";

export const KONOFAN_API_BASE = "https://konofan.fandom.com/api.php";
export const OUTPUTS_DIR = path.join(process.cwd(), "dist", "fandom", "konofan");

export const OUTPUT_FILES = {
  CHARLIST: path.join(OUTPUTS_DIR, "charlist.json"),
  EVENTS: path.join(OUTPUTS_DIR, "events.json"),
  MEMBERCARDS: path.join(OUTPUTS_DIR, "membercards.json"),
};
