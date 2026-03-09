#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json to get current version
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;

// Update cache manager version
const cacheManagerPath = path.join(__dirname, '..', 'src', 'utils', 'cacheManager.js');
let cacheManagerContent = fs.readFileSync(cacheManagerPath, 'utf8');

// Update version in cacheManager.js
cacheManagerContent = cacheManagerContent.replace(
  /this\.version = '[^']*';/,
  `this.version = '${currentVersion}';`
);

fs.writeFileSync(cacheManagerPath, cacheManagerContent);

console.log(`✅ Cache version updated to ${currentVersion}`);
console.log('📦 Run "npm run build:force" to create a clean build with new version');

