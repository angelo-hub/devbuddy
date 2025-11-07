const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Sharp not installed. Run: npm install --save-dev sharp');
  process.exit(1);
}

const resourcesDir = path.join(__dirname, '..', 'resources');
const sizes = [16, 32, 64, 128, 256, 512]; // Different sizes for VS Code

async function convertSVGtoPNG() {
  const svgFiles = ['icon-workflow.svg', 'icon-lucide.svg'];
  
  for (const svgFile of svgFiles) {
    const svgPath = path.join(resourcesDir, svgFile);
    
    if (!fs.existsSync(svgPath)) {
      console.log(`⚠️  ${svgFile} not found, skipping...`);
      continue;
    }
    
    const baseName = path.basename(svgFile, '.svg');
    
    // Generate multiple sizes
    for (const size of sizes) {
      const outputPath = path.join(resourcesDir, `${baseName}-${size}.png`);
      
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${baseName}-${size}.png`);
    }
  }
  
  // Generate main icon.png (128x128 for VS Code) from workflow design
  const mainOutputPath = path.join(resourcesDir, 'icon.png');
  await sharp(path.join(resourcesDir, 'icon-workflow.svg'))
    .resize(128, 128)
    .png()
    .toFile(mainOutputPath);
  
  console.log(`✅ Generated icon.png (main extension icon)`);
}

convertSVGtoPNG().catch(console.error);

