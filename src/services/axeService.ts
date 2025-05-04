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
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
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
  } finally {
    await browser.close();
  }
}