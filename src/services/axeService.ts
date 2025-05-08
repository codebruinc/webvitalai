import { AxePuppeteer } from '@axe-core/puppeteer';
import puppeteer from 'puppeteer';

export interface AxeViolation {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  nodes: number;
}

export interface AxeResult {
  score: number;
  violations: AxeViolation[];
  passes: number;
  incomplete: number;
}

// Define a type that matches the actual structure from axe-core
interface AxeResults {
  passes: any[];
  violations: any[];
  incomplete: any[];
  inapplicable: any[];
  // other properties...
}

/**
 * Run an axe-core accessibility audit on a URL
 * @param url The URL to audit
 * @returns The accessibility audit results
 */
export async function runAxeAudit(url: string): Promise<AxeResult> {
  // Check if we're in testing mode or mock mode
  const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  const useMockResults = process.env.USE_MOCK_RESULTS === 'true';
  
  // Log environment information for debugging
  console.log(`Running Axe audit for ${url}...`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'Not set'}`);
  
  // If we're in testing mode or explicitly configured to use mock results, return mock results immediately without launching browser
  if (isTestingMode || useMockResults) {
    console.log(`${isTestingMode ? 'TESTING' : 'MOCK'} MODE: Returning mock accessibility results without launching browser`);
    return {
      score: 92,
      violations: [
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Elements must have sufficient color contrast',
          help: 'Elements must have sufficient color contrast',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
          nodes: 2
        }
      ],
      passes: 18,
      incomplete: 0
    };
  }
  
  let browser;
  try {
    // Use Puppeteer's auto-downloaded Chromium or the one specified by environment variable
    // Define the options with the correct type
    const options: {
      headless: boolean;
      args: string[];
      executablePath?: string;
    } = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
    };
    
    // Use environment variable if set, otherwise use Puppeteer's bundled Chromium
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      console.log(`Using Chromium at: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
      options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else {
      console.log('Using Puppeteer bundled Chromium');
    }
    
    browser = await puppeteer.launch(options);
    
    const page = await browser.newPage();
    
    // Set a reasonable timeout
    await page.setDefaultNavigationTimeout(60000);
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Run axe-core analysis
    const axeResults = await new AxePuppeteer(page).analyze();
    
    // Calculate a score based on the number of violations and their impact
    const totalIssues = 
      axeResults.violations.length + 
      axeResults.incomplete.length;
    
    // Calculate weighted score based on violation impact
    let impactScore = 0;
    const impactWeights = {
      minor: 1,
      moderate: 2,
      serious: 3,
      critical: 4,
    };
    
    // Use type assertion to work with the actual structure
    const results = axeResults as unknown as AxeResults;
    
    results.violations.forEach((violation: any) => {
      const impact = violation.impact as keyof typeof impactWeights;
      const weight = impactWeights[impact] || 2;
      impactScore += weight * violation.nodes.length;
    });
    
    // Calculate a score from 0-100 (higher is better)
    // Base score is 100, subtract points for violations based on impact
    const maxPossibleScore = 100;
    const score = Math.max(0, Math.min(100, maxPossibleScore - impactScore));
    
    // Format the violations for easier consumption
    const formattedViolations = results.violations.map((violation: any): AxeViolation => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.length,
    }));
    
    return {
      score,
      violations: formattedViolations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
    };
  } catch (error) {
    console.error('Axe audit failed:', error);
    
    // In testing mode or when explicitly configured to use mock results, return mock results
    if (isTestingMode || useMockResults) {
      console.log(`${isTestingMode ? 'TESTING' : 'MOCK'} MODE: Returning mock accessibility results`);
      console.log('This is a fallback mechanism for environments where Chromium might not be available');
      return {
        score: 92,
        violations: [
          {
            id: 'color-contrast',
            impact: 'serious',
            description: 'Elements must have sufficient color contrast',
            help: 'Elements must have sufficient color contrast',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
            nodes: 2
          }
        ],
        passes: 18,
        incomplete: 0
      };
    }
    
    // In production, rethrow the error
    throw error;
  } finally {
    // Close the browser if it was opened
    if (browser) {
      await browser.close().catch(err => {
        console.error('Error closing browser:', err);
      });
    }
  }
}