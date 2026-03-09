#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Cache Management System...\n');

// Test 1: Check if all required files exist
const requiredFiles = [
  'src/utils/cacheManager.js',
  'public/sw.js',
  'src/widgets/cache/CacheControl.jsx',
  'vite.config.js',
  'public/.htaccess'
];

console.log('📁 Checking required files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Test 2: Check package.json scripts
console.log('\n📦 Checking package.json scripts:');
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const requiredScripts = ['build:clean', 'build:force', 'version:patch'];
requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`✅ ${script}`);
  } else {
    console.log(`❌ ${script} - MISSING`);
    allFilesExist = false;
  }
});

// Test 3: Check vite config
console.log('\n⚙️ Checking Vite configuration:');
const viteConfigPath = path.join(__dirname, '..', 'vite.config.js');
const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

if (viteConfig.includes('entryFileNames') && viteConfig.includes('[hash]')) {
  console.log('✅ Cache busting configured');
} else {
  console.log('❌ Cache busting not configured');
  allFilesExist = false;
}

// Test 4: Check cache manager version
console.log('\n🔧 Checking cache manager:');
const cacheManagerPath = path.join(__dirname, '..', 'src', 'utils', 'cacheManager.js');
const cacheManager = fs.readFileSync(cacheManagerPath, 'utf8');

if (cacheManager.includes('this.version = ')) {
  const versionMatch = cacheManager.match(/this\.version = '([^']+)'/);
  if (versionMatch) {
    console.log(`✅ Version: ${versionMatch[1]}`);
  } else {
    console.log('❌ Version not found');
  }
} else {
  console.log('❌ Version property not found');
  allFilesExist = false;
}

// Summary
console.log('\n📊 Test Summary:');
if (allFilesExist) {
  console.log('✅ All tests passed! Cache management system is ready.');
  console.log('\n🚀 Next steps:');
  console.log('1. Run: npm run build:force');
  console.log('2. Deploy the dist/ folder');
  console.log('3. Test in browser incognito mode');
} else {
  console.log('❌ Some tests failed. Please check the missing components.');
}

console.log('\n📚 For more information, see CACHE_MANAGEMENT.md');

