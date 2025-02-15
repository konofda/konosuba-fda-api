# Konosuba FD/A API

A static JSON API for the Konosuba Fantastic Days Archive project.

## Setup

```bash
pnpm install
```

## Generate Data

To generate the API data:

```bash
pnpm build
```

This will create JSON files in the `dist` directory that can be served statically.

## Project Structure

- `scripts/` - Contains data generation scripts
- `dist/` - Contains generated JSON files (API endpoints)

# Konosuba FDA API Repository Analysis

This repository serves as the data generation pipeline for the **Konosuba: Fantastic Days / Archive** project's static API.
It aggregates data from multiple sources and transforms it into a structured JSON format [served statically](https://konofda.github.io/konosuba-fda-api).

## Core Purpose

The API acts as a centralized data source for the Konosuba FD/A frontend, providing:

- Asset metadata and paths
- Game data from various sources
- Structured information about characters, events, items, etc.

## Data Sources

1. **Asset Repositories**

   - [HaiKonofanDesu/konofan-assets-jp-sortet](https://github.com/HaiKonofanDesu/konofan-assets-jp-sortet): Game textures and spine models
   - [HaiKonofanDesu/konofan-live2d](https://github.com/HaiKonofanDesu/konofan-live2d): Live2D models
   - [HaiKonofanDesu/konofan-audio](https://github.com/HaiKonofanDesu/konofan-audio): BGM and sound files
   - [HaiKonofanDesu/konofan-videos](https://github.com/HaiKonofanDesu/konofan-videos): Video content
   - [HaiKonofanDesu/konofan-story](https://github.com/HaiKonofanDesu/konofan-story): Story scripts

   * (A lot of info is stitched together from the asset names in there)

2. **Axel Repository**

   - Raw game data
   - Accessed via GitHub raw content

3. **Hardcoded**
   - YAML files in the `/wiki` directory are written right here in this repo
   - Contains manual metadata and mappings
   - Provide additional properties or structure

## Project Structure

### Key Directories

- `/scripts`: Core data generation logic

  - `/v1/routes`: Individual API endpoint generators
  - `/scrape-konofan`: Wiki data fetchers
  - `/scrape-axel-repo`: Game data fetchers
  - `/repo-filelists`: GitHub repository file listers
  - `/common`: Shared utilities

- `/dist`: Generated API output (not in repo)
  - Contains JSON files that form the API endpoints
  - Structured for versioning (v0, v1)

### Notable Components

1. **Route Generators** (`/scripts/v1/routes/`)

   - Each file generates one API endpoint
   - Examples:
     - member-cards.js: Character card data
     - music.js: BGM metadata
     - story-scripts.js: Story content

2. **File Listing System** (`/scripts/repo-filelists/`)

   - Handles GitHub repository traversal
   - Caches file listings locally
   - Supports authenticated and unauthenticated access

3. **Data Scrapers**
   - Konofan Wiki scraper
   - Axel repository data fetcher
   - Asset metadata extractors

## Build Process

1. Install dependencies:

```bash
npm install
```

2. Generate API data:

```bash
npm run build
```

The build process:

1. Fetches latest file listings from asset repos
2. Downloads and processes game data from Axel
3. Combines with wiki metadata
4. Generates structured JSON endpoints
5. Outputs to `/dist` directory

## Integration with Konosuba FDA

The generated JSON files serve as a static API that:

1. Can be hosted on any static file hosting
2. Provides structured data for the FD/A frontend
3. Enables efficient asset path resolution
4. Maintains data consistency across the project

This approach allows the FDA project to:

- Access game data without direct game client access
- Maintain a structured data layer
- Scale efficiently using static hosting
- Version and track data changes through Git

The repository essentially acts as the data processing pipeline that powers the FDA project's backend, converting raw game assets and data into a structured, consumable format.
