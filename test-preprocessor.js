// test-preprocessor.js
import fs from 'fs';
import path from 'path';
import { preprocessBidDocuments } from './app/utils/bidPreprocessor.js';

// Path to your test files
const testFilesDir = './test-files';
const outputDir = './processed-output';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Get all files in the test directory
const files = fs.readdirSync(testFilesDir);

// Create file content objects for the preprocessor
const fileContents = files.map(filename => {
  const filePath = path.join(testFilesDir, filename);
  return {
    name: filename,
    content: fs.readFileSync(filePath, 'utf8')
  };
});

// Process the files
const processedFiles = preprocessBidDocuments(fileContents);

// Save processed output to individual files
processedFiles.forEach(file => {
  const outputPath = path.join(outputDir, `processed_${file.name}.txt`);
  fs.writeFileSync(outputPath, file.content);
  console.log(`Processed ${file.name}: ${file.originalSize} → ${file.content.length} chars (${((file.originalSize - file.content.length) / file.originalSize * 100).toFixed(1)}% reduction)`);
});

console.log(`\nProcessed ${processedFiles.length} files. Results saved to ${outputDir}/`);