/**
 * This is an ES module wrapper for the Lighthouse script
 * It allows us to call the ESM script from other ES modules
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run a Lighthouse audit using the ESM script
 * @param {string} url - The URL to audit
 * @param {string} outputPath - The path to save the results
 * @returns {Promise<void>} - A promise that resolves when the audit is complete
 */
export function runLighthouseAudit(url, outputPath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, 'run-lighthouse.js');
    
    console.log(`Running Lighthouse audit for ${url}...`);
    console.log(`Using script: ${scriptPath}`);
    console.log(`Output path: ${outputPath}`);
    
    const child = spawn('node', [scriptPath, url, outputPath], {
      stdio: ['ignore', 'inherit', 'inherit']
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Lighthouse script exited with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}