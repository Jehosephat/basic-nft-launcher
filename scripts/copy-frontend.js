// Cross-platform script to copy frontend dist to backend
const fs = require('fs');
const path = require('path');

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const backendDist = path.join(__dirname, '..', 'backend', 'frontend-dist');

// Remove existing directory
if (fs.existsSync(backendDist)) {
  fs.rmSync(backendDist, { recursive: true, force: true });
}

// Create directory
fs.mkdirSync(backendDist, { recursive: true });

// Copy files recursively
function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(frontendDist)) {
  console.error('❌ Frontend dist directory not found. Run "npm run build:frontend" first.');
  process.exit(1);
}

copyRecursive(frontendDist, backendDist);
console.log('✅ Frontend files copied to backend/frontend-dist');
