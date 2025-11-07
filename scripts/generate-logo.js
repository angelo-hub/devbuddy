const fs = require('fs');
const path = require('path');

// Colors from our recommendation
const COLORS = {
  primary: '#5B7FE8',    // trust blue
  accent: '#10B981',     // success green
  dark: '#1E293B',       // dark base
};

// SVG for workflow connection icon (inspired by network/nodes)
const generateWorkflowSVG = (size = 128) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="url(#gradient)" opacity="0.1"/>
  
  <!-- Gradient definition -->
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${COLORS.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${COLORS.accent};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Workflow nodes (circles) -->
  <circle cx="64" cy="32" r="10" fill="${COLORS.primary}" stroke="white" stroke-width="2"/>
  <circle cx="38" cy="64" r="10" fill="${COLORS.primary}" stroke="white" stroke-width="2"/>
  <circle cx="90" cy="64" r="10" fill="${COLORS.primary}" stroke="white" stroke-width="2"/>
  <circle cx="64" cy="96" r="10" fill="${COLORS.accent}" stroke="white" stroke-width="2"/>
  
  <!-- Connection lines -->
  <line x1="64" y1="42" x2="64" y2="86" stroke="${COLORS.primary}" stroke-width="3" opacity="0.6"/>
  <line x1="60" y1="38" x2="42" y2="58" stroke="${COLORS.primary}" stroke-width="3" opacity="0.6"/>
  <line x1="68" y1="38" x2="86" y2="58" stroke="${COLORS.primary}" stroke-width="3" opacity="0.6"/>
  <line x1="42" y1="70" x2="60" y2="90" stroke="${COLORS.accent}" stroke-width="3" opacity="0.6"/>
  <line x1="86" y1="70" x2="68" y2="90" stroke="${COLORS.accent}" stroke-width="3" opacity="0.6"/>
  
  <!-- Center hub -->
  <circle cx="64" cy="64" r="16" fill="white"/>
  <circle cx="64" cy="64" r="14" fill="url(#gradient)"/>
  
  <!-- Checkmark in center (the "buddy" helper) -->
  <path d="M 58 64 L 62 68 L 70 58" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
};

// Alternative: Using network/workflow pattern
const generateWithLucide = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${COLORS.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${COLORS.accent};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Rounded square background -->
  <rect x="8" y="8" width="112" height="112" rx="24" fill="url(#gradient)" opacity="0.15"/>
  
  <!-- Network/workflow pattern -->
  <g transform="translate(24, 24) scale(3.2)">
    <circle cx="12" cy="5" r="3" fill="none" stroke="${COLORS.primary}" stroke-width="2"/>
    <circle cx="5" cy="12" r="3" fill="none" stroke="${COLORS.primary}" stroke-width="2"/>
    <circle cx="19" cy="12" r="3" fill="none" stroke="${COLORS.primary}" stroke-width="2"/>
    <circle cx="12" cy="19" r="3" fill="none" stroke="${COLORS.accent}" stroke-width="2"/>
    <line x1="12" y1="8" x2="12" y2="16" stroke="${COLORS.primary}" stroke-width="1.5"/>
    <line x1="10.5" y1="6.5" x2="6.5" y2="10.5" stroke="${COLORS.primary}" stroke-width="1.5"/>
    <line x1="13.5" y1="6.5" x2="17.5" y2="10.5" stroke="${COLORS.primary}" stroke-width="1.5"/>
    <line x1="6.5" y1="13.5" x2="10.5" y2="17.5" stroke="${COLORS.accent}" stroke-width="1.5"/>
    <line x1="17.5" y1="13.5" x2="13.5" y2="17.5" stroke="${COLORS.accent}" stroke-width="1.5"/>
  </g>
</svg>`;
};

// Generate the logo files
const outputDir = path.join(__dirname, '..', 'resources');

// Ensure resources directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write SVG files
const workflowSVG = generateWorkflowSVG(128);
const lucideSVG = generateWithLucide();

fs.writeFileSync(path.join(outputDir, 'icon-workflow.svg'), workflowSVG);
fs.writeFileSync(path.join(outputDir, 'icon-lucide.svg'), lucideSVG);

console.log('✅ Generated SVG logos in resources/');
console.log('   - icon-workflow.svg');
console.log('   - icon-lucide.svg');
console.log('\n📝 To convert to PNG:');
console.log('   npm install --save-dev sharp');
console.log('   Then run: node scripts/generate-png.js');

