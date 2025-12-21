#!/usr/bin/env node

/**
 * Pre-release Version Script for DevBuddy
 * 
 * Uses VS Code's recommended odd/even versioning strategy:
 * - Even minor versions (0.8.x, 0.10.x) = Stable releases
 * - Odd minor versions (0.9.x, 0.11.x) = Pre-releases
 * 
 * Usage:
 *   npm run beta                    # Move to pre-release track or increment patch
 *   npm run beta -- minor           # Bump to next pre-release minor
 *   npm run beta -- patch           # Increment patch within pre-release track
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const bumpType = args[0] || 'patch'; // patch or minor

// Valid bump types
const validBumps = ['patch', 'minor'];
if (!validBumps.includes(bumpType)) {
  console.error(`❌ Invalid bump type: ${bumpType}`);
  console.error(`   Valid types: ${validBumps.join(', ')}`);
  process.exit(1);
}

// Read current package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 Current version: ${currentVersion}`);

// Parse version (handle both regular and pre-release formats)
const versionRegex = /^(\d+)\.(\d+)\.(\d+)(?:-.*)?$/;
const match = currentVersion.match(versionRegex);

if (!match) {
  console.error(`❌ Invalid version format: ${currentVersion}`);
  process.exit(1);
}

let [, major, minor, patch] = match;
major = parseInt(major);
minor = parseInt(minor);
patch = parseInt(patch);

console.log(`📊 Parsed: major=${major}, minor=${minor}, patch=${patch}`);
console.log('');
console.log('📚 VS Code Version Convention:');
console.log('   Even minor (0.8.x, 0.10.x) = Stable');
console.log('   Odd minor (0.9.x, 0.11.x) = Pre-release');
console.log('');

let newVersion;

// Check if current minor is even (stable) or odd (pre-release)
const isEvenMinor = minor % 2 === 0;

if (isEvenMinor) {
  // Current is stable (even minor), move to next odd minor for pre-release
  const newMinor = minor + 1;
  newVersion = `${major}.${newMinor}.0`;
  console.log(`🔄 Moving from stable track (${minor}) to pre-release track (${newMinor})`);
} else {
  // Already on pre-release track (odd minor)
  if (bumpType === 'minor') {
    // Jump to next odd minor (skip the even one)
    const newMinor = minor + 2;
    newVersion = `${major}.${newMinor}.0`;
    console.log(`🔼 Bumping to next pre-release minor (${newMinor})`);
  } else {
    // Just increment patch
    const newPatch = patch + 1;
    newVersion = `${major}.${minor}.${newPatch}`;
    console.log(`🔼 Incrementing patch to ${newPatch}`);
  }
}

console.log(`✨ New version: ${newVersion}`);
console.log('');

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

console.log(`✅ Updated package.json to ${newVersion}`);
console.log('');
console.log('📝 Next steps:');
console.log('   1. Review the version change');
console.log('   2. Commit the change:');
console.log(`      git add package.json`);
console.log(`      git commit -m "chore: release v${newVersion} (pre-release)"`);
console.log('   3. Create a tag:');
console.log(`      git tag v${newVersion}`);
console.log('   4. Push:');
console.log(`      git push origin HEAD --tags`);
console.log('   5. Publish with pre-release flag:');
console.log(`      npm run beta:publish`);
console.log('');
console.log('🚀 Or use the GitHub "Publish Pre-release" workflow to automate this!');
