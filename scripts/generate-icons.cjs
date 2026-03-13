const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    console.log('Generating icons...');
    
    // Ensure directories exist
    if (!fs.existsSync('public')) fs.mkdirSync('public');
    if (!fs.existsSync('build')) fs.mkdirSync('build');
    
    // Copy PNG to public folder for web
    fs.copyFileSync('icon.png', 'public/favicon.png');
    console.log('✓ Created public/favicon.png');
    
    // Copy PNG to build folder
    fs.copyFileSync('icon.png', 'build/icon.png');
    console.log('✓ Created build/icon.png');
    
    // Generate .ico file for Windows
    try {
      const buf = await pngToIco(['icon.png']);
      fs.writeFileSync('build/icon.ico', buf);
      console.log('✓ Created build/icon.ico');
    } catch (icoError) {
      console.log('⚠ Could not generate .ico file automatically');
      console.log('  Please convert icon.png to icon.ico manually and place in build folder');
    }
    
    console.log('\n✓ Icon setup complete!');
    console.log('\nFor Android icons, run: npx @capacitor/assets generate --android');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
