const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('index.html not found in dist');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf-8');

// 1. Find the main CSS link
// Example: <link rel="stylesheet"  href="./assets/style-CJu9tal9.css">
const cssRegex = /<link rel="stylesheet"\s+href="\.\/(assets\/style-.*?\.css)">/g;
let match;
let count = 0;

while ((match = cssRegex.exec(html)) !== null) {
  const cssPath = path.join(distDir, match[1]);
  if (fs.existsSync(cssPath)) {
    console.log(`Inlining ${match[1]}...`);
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    // Security: Replace backslashes/dollars to avoid JS template string issues if we were using them
    // but here we just use string replace.
    html = html.replace(match[0], `<style>${cssContent}</style>`);
    count++;
  } else {
    console.warn(`CSS file not found: ${cssPath}`);
  }
}

if (count > 0) {
  fs.writeFileSync(indexPath, html);
  console.log(`Successfully inlined ${count} CSS files.`);
} else {
  console.log('No CSS links found to inline.');
  
  // Fallback: try more generic regex if the first one failed
  const cssRegexFallback = /<link rel="stylesheet".*?href=".*?assets\/(.*?\.css)".*?>/g;
  html = fs.readFileSync(indexPath, 'utf-8');
  let match2;
  let count2 = 0;
  while ((match2 = cssRegexFallback.exec(html)) !== null) {
    const cssFileName = match2[1];
    const cssPath = path.join(distDir, 'assets', cssFileName);
    if (fs.existsSync(cssPath)) {
        console.log(`Fallback Inlining ${cssFileName}...`);
        const cssContent = fs.readFileSync(cssPath, 'utf-8');
        html = html.replace(match2[0], `<style>${cssContent}</style>`);
        count2++;
    }
  }
  if (count2 > 0) {
    fs.writeFileSync(indexPath, html);
    console.log(`Successfully inlined ${count2} CSS files (fallback).`);
  }
}
