import { join } from "path";

export const PUBLIC_DIR = join(process.cwd(), "public");
export const WIKI_DIR = join(process.cwd(), "wiki");

export const DIST_DIR = join(process.cwd(), "dist");
export const DIST_DIR_API_V0 = join(DIST_DIR, "v0");
export const DIST_DIR_API_V1 = join(DIST_DIR, "v1");
export const DIST_DIR_API_AXEL = join(DIST_DIR, "axel");
export const REPO_FILES_DIR = join(DIST_DIR, "repo-filelists");
