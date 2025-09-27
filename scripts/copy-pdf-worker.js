import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy PDF worker from node_modules to public directory
const sourcePath = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const destPath = path.join(__dirname, '../public/pdf.worker.min.mjs');

try {
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log('✅ PDF worker copied successfully');
  } else {
    console.warn('⚠️ PDF worker source not found, using CDN fallback');
  }
} catch (error) {
  console.error('❌ Error copying PDF worker:', error);
}
