#!/usr/bin/env node

/**
 * Beta Release Script for DevBuddy
 * 
 * This script helps manage beta/pre-release versions for the DevBuddy extension.
 * It handles version bumping with pre-release tags (beta, alpha, rc).
 * 
 * Usage:
 *   npm run beta -- [beta-type] [bump-type]
 * 
 * Examples:
 *   npm run beta                    # Creates/increments beta.X version
 *   npm run beta -- alpha           # Creates/increments alpha.X version
 *   npm run beta -- rc              # Creates/increments rc.X version
 *   npm run beta -- beta minor      # Bumps minor and creates beta.1
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const betaType = args[0] || 'beta'; // beta, alpha, rc
const bumpType = args[1] || null;   // major, minor, patch, or null

// Valid pre-release types
const validTypes = ['beta', 'alpha', 'rc'];
if (!validTypes.includes(betaType)) {
  console.error(`❌ Invalid beta type: ${betaType}`);
  console.error(`   Valid types: ${validTypes.join(', ')}`);
  process.exit(1);
}

// Valid bump types
const validBumps = ['major', 'minor', 'patch', null];
if (!validBumps.includes(bumpType)) {
  console.error(`❌ Invalid bump type: ${bumpType}`);
  console.error(`   Valid types: major, minor, patch`);
  process.exit(1);
}

// Read current package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 Current version: ${currentVersion}`);

// Parse version
const versionRegex = /^(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta|rc)\.(\d+))?$/;
const match = currentVersion.match(versionRegex);

if (!match) {
  console.error(`❌ Invalid version format: ${currentVersion}`);
  process.exit(1);
}

let [, major, minor, patch, currentPreType, currentPreNum] = match;
major = parseInt(major);
minor = parseInt(minor);
patch = parseInt(patch);
currentPreNum = currentPreNum ? parseInt(currentPreNum) : 0;

let newVersion;

// Determine new version
if (currentPreType === betaType && !bumpType) {
  // Increment pre-release number
  newVersion = `${major}.${minor}.${patch}-${betaType}.${currentPreNum + 1}`;
  console.log(`🔼 Incrementing ${betaType} version`);
} else if (bumpType) {
  // Bump base version and start pre-release at .1
  if (bumpType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bumpType === 'minor') {
    minor += 1;
    patch = 0;
  } else if (bumpType === 'patch') {
    patch += 1;
  }
  newVersion = `${major}.${minor}.${patch}-${betaType}.1`;
  console.log(`🔼 Bumping ${bumpType} version and starting ${betaType}.1`);
} else if (currentPreType && currentPreType !== betaType) {
  // Switching pre-release type
  newVersion = `${major}.${minor}.${patch}-${betaType}.1`;
  console.log(`🔄 Switching from ${currentPreType} to ${betaType}`);
} else {
  // First pre-release for current version
  newVersion = `${major}.${minor}.${patch}-${betaType}.1`;
  console.log(`🆕 Creating first ${betaType} for version ${major}.${minor}.${patch}`);
}

console.log(`✨ New version: ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

console.log(`✅ Updated package.json to ${newVersion}`);
console.log('');
console.log('📝 Next steps:');
console.log('   1. Review the version change');
console.log('   2. Commit the change:');
console.log(`      git add package.json`);
console.log(`      git commit -m "chore: bump version to ${newVersion} (pre-release)"`);
console.log('   3. Create a tag:');
console.log(`      git tag v${newVersion}`);
console.log('   4. Push:');
console.log(`      git push origin HEAD --tags`);
console.log('   5. Run the "Publish Beta (Pre-release)" GitHub Action');
console.log('');
console.log('🚀 Or use the GitHub workflow to automate this process!');
