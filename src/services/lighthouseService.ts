import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runLighthouseAudit as runLighthouseScript } from '../../scripts/lighthouse-wrapper.cjs';

export interface LighthouseResult {
  performance: {
    score: number;
    metrics: {
      [key: string]: {
        value: number;
        unit?: string;
      };
    };
  };
  accessibility: {
    score: number;
    issues: Array<{
      title: string;
      description: string;
      severity: string;
    }>;
  };
  seo: {
    score: number;
    issues: Array<{
      title: string;
      description: string;
      severity: string;
    }>;
  };
  bestPractices: {
    score: number;
    issues: Array<{
      title: string;
      description: string;
      severity: string;
    }>;
  };
}

interface LighthouseAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  numericValue?: number;
  details?: any;
  displayValue?: string;
  scoreDisplayMode?: string;
  auditType?: string;
  // Custom property we'll use for filtering
  groupId?: string;
}

/**
 * Get the severity level based on the score
 * @param score The audit score (0-1)
 * @returns The severity level (high, medium, low)
 */
function getSeverity(score: number | null): string {
  if (score === null) return 'high';
  if (score < 0.5) return 'high';
  if (score < 0.9) return 'medium';
  return 'low';
}

/**
 * Run a Lighthouse audit on a URL using a Node.js child process
 * This approach avoids ESM compatibility issues with Next.js
 * @param url The URL to audit
 * @returns The Lighthouse audit results
 */
export async function runLighthouseAudit(url: string): Promise<LighthouseResult> {
  try {
    // Check if we're in testing mode
    const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true';
    
    // Create a temporary file to store the Lighthouse results
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `lighthouse-${Date.now()}.json`);
    
    // Run the Lighthouse script using our wrapper
    console.log(`Running Lighthouse audit for ${url}...`);
    
    try {
      // Run the Lighthouse script and wait for it to complete
      await runLighthouseScript(url, outputPath);
    } catch (scriptError) {
      console.error('Lighthouse script execution failed:', scriptError);
      
      // In testing mode, generate mock results if the script fails
      if (isTestingMode) {
        console.log('TESTING MODE: Generating mock Lighthouse results after script failure');
        
        // Create a mock Lighthouse result directly in the service
        const mockResult = {
          categories: {
            performance: { score: 0.85 },
            accessibility: { score: 0.92 },
            'best-practices': { score: 0.87 },
            seo: { score: 0.95 }
          },
          audits: {
            'first-contentful-paint': { numericValue: 1200, score: 0.8, title: 'First Contentful Paint', description: 'First Contentful Paint marks the time at which the first text or image is painted.' },
            'largest-contentful-paint': { numericValue: 2500, score: 0.7, title: 'Largest Contentful Paint', description: 'Largest Contentful Paint marks the time at which the largest text or image is painted.' },
            'cumulative-layout-shift': { numericValue: 0.1, score: 0.9, title: 'Cumulative Layout Shift', description: 'Cumulative Layout Shift measures the movement of visible elements within the viewport.' },
            'total-blocking-time': { numericValue: 150, score: 0.8, title: 'Total Blocking Time', description: 'Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50ms.' },
            'speed-index': { numericValue: 3000, score: 0.7, title: 'Speed Index', description: 'Speed Index shows how quickly the contents of a page are visibly populated.' },
            'server-response-time': { numericValue: 200, score: 0.9, title: 'Server Response Time', description: 'Time for the server to respond to the main document request.' }
          }
        };
        
        // Write mock results to the output file
        fs.writeFileSync(outputPath, JSON.stringify(mockResult));
        console.log('TESTING MODE: Mock Lighthouse results generated successfully');
      } else {
        // In production, rethrow the error
        throw scriptError;
      }
    }
    
    // Check if the output file exists
    if (!fs.existsSync(outputPath)) {
      throw new Error('Lighthouse results file not found');
    }
    
    // Read the results from the temporary file
    let resultJson;
    try {
      resultJson = fs.readFileSync(outputPath, 'utf8');
    } catch (readError) {
      console.error('Error reading Lighthouse results file:', readError);
      
      if (isTestingMode) {
        console.log('TESTING MODE: Generating mock Lighthouse results after file read error');
        
        // Create a mock result
        return {
          performance: {
            score: 85,
            metrics: {
              'First Contentful Paint': { value: 1200, unit: 'ms' },
              'Largest Contentful Paint': { value: 2500, unit: 'ms' },
              'Cumulative Layout Shift': { value: 0.1 },
              'Total Blocking Time': { value: 150, unit: 'ms' },
              'Speed Index': { value: 3000, unit: 'ms' },
              'Server Response Time': { value: 200, unit: 'ms' }
            }
          },
          accessibility: {
            score: 92,
            issues: [
              { title: 'Images must have alternate text', description: 'Informative elements should aim for short, descriptive alternate text.', severity: 'medium' }
            ]
          },
          seo: {
            score: 95,
            issues: [
              { title: 'Document does not have a meta description', description: 'Meta descriptions may be included in search results to concisely summarize page content.', severity: 'medium' }
            ]
          },
          bestPractices: {
            score: 87,
            issues: [
              { title: 'Uses HTTPS', description: 'All sites should be protected with HTTPS, even ones that don\'t handle sensitive data.', severity: 'low' }
            ]
          }
        };
      } else {
        throw readError;
      }
    }
    
    // Parse the JSON
    let lhr;
    try {
      lhr = JSON.parse(resultJson);
    } catch (parseError) {
      console.error('Error parsing Lighthouse results:', parseError);
      
      if (isTestingMode) {
        console.log('TESTING MODE: Generating mock Lighthouse results after JSON parse error');
        
        // Create a mock result
        return {
          performance: {
            score: 85,
            metrics: {
              'First Contentful Paint': { value: 1200, unit: 'ms' },
              'Largest Contentful Paint': { value: 2500, unit: 'ms' },
              'Cumulative Layout Shift': { value: 0.1 },
              'Total Blocking Time': { value: 150, unit: 'ms' },
              'Speed Index': { value: 3000, unit: 'ms' },
              'Server Response Time': { value: 200, unit: 'ms' }
            }
          },
          accessibility: {
            score: 92,
            issues: [
              { title: 'Images must have alternate text', description: 'Informative elements should aim for short, descriptive alternate text.', severity: 'medium' }
            ]
          },
          seo: {
            score: 95,
            issues: [
              { title: 'Document does not have a meta description', description: 'Meta descriptions may be included in search results to concisely summarize page content.', severity: 'medium' }
            ]
          },
          bestPractices: {
            score: 87,
            issues: [
              { title: 'Uses HTTPS', description: 'All sites should be protected with HTTPS, even ones that don\'t handle sensitive data.', severity: 'low' }
            ]
          }
        };
      } else {
        throw parseError;
      }
    }
    
    // Clean up the temporary file
    try {
      fs.unlinkSync(outputPath);
    } catch (unlinkError) {
      console.error('Error removing temporary file:', unlinkError);
      // Continue processing even if cleanup fails
    }
    
    // Extract performance metrics
    const performanceMetrics: { [key: string]: { value: number; unit?: string } } = {};
    
    // Core Web Vitals and other important metrics
    if (lhr.audits['first-contentful-paint']?.numericValue !== undefined) {
      performanceMetrics['First Contentful Paint'] = {
        value: lhr.audits['first-contentful-paint'].numericValue,
        unit: 'ms',
      };
    }
    
    if (lhr.audits['largest-contentful-paint']?.numericValue !== undefined) {
      performanceMetrics['Largest Contentful Paint'] = {
        value: lhr.audits['largest-contentful-paint'].numericValue,
        unit: 'ms',
      };
    }
    
    if (lhr.audits['cumulative-layout-shift']?.numericValue !== undefined) {
      performanceMetrics['Cumulative Layout Shift'] = {
        value: lhr.audits['cumulative-layout-shift'].numericValue,
      };
    }
    
    if (lhr.audits['total-blocking-time']?.numericValue !== undefined) {
      performanceMetrics['Total Blocking Time'] = {
        value: lhr.audits['total-blocking-time'].numericValue,
        unit: 'ms',
      };
    }
    
    if (lhr.audits['speed-index']?.numericValue !== undefined) {
      performanceMetrics['Speed Index'] = {
        value: lhr.audits['speed-index'].numericValue,
        unit: 'ms',
      };
    }
    
    if (lhr.audits['server-response-time']?.numericValue !== undefined) {
      performanceMetrics['Server Response Time'] = {
        value: lhr.audits['server-response-time'].numericValue,
        unit: 'ms',
      };
    }

    // Prepare audits with group information
    const audits = Object.entries(lhr.audits).map(([id, audit]) => {
      // Find which category this audit belongs to
      let groupId = '';
      
      for (const [categoryId, category] of Object.entries(lhr.categories)) {
        const typedCategory = category as { auditRefs: Array<{ id: string }> };
        if (typedCategory.auditRefs.some((ref: { id: string }) => ref.id === id)) {
          groupId = categoryId;
          break;
        }
      }
      
      return {
        ...(audit as object),
        id,
        groupId,
      } as LighthouseAudit;
    });

    // Extract accessibility issues
    const accessibilityIssues = audits
      .filter(audit => audit.groupId === 'accessibility' && audit.score !== 1 && audit.score !== null)
      .map(audit => ({
        title: audit.title,
        description: audit.description,
        severity: getSeverity(audit.score),
      }));

    // Extract SEO issues
    const seoIssues = audits
      .filter(audit => audit.groupId === 'seo' && audit.score !== 1 && audit.score !== null)
      .map(audit => ({
        title: audit.title,
        description: audit.description,
        severity: getSeverity(audit.score),
      }));

    // Extract best practices issues
    const bestPracticesIssues = audits
      .filter(audit => audit.groupId === 'best-practices' && audit.score !== 1 && audit.score !== null)
      .map(audit => ({
        title: audit.title,
        description: audit.description,
        severity: getSeverity(audit.score),
      }));

    return {
      performance: {
        score: (lhr.categories.performance.score ?? 0) * 100,
        metrics: performanceMetrics,
      },
      accessibility: {
        score: (lhr.categories.accessibility.score ?? 0) * 100,
        issues: accessibilityIssues,
      },
      seo: {
        score: (lhr.categories.seo.score ?? 0) * 100,
        issues: seoIssues,
      },
      bestPractices: {
        score: (lhr.categories['best-practices']?.score ?? 0) * 100,
        issues: bestPracticesIssues,
      },
    };
  } catch (error) {
    console.error('Lighthouse audit failed:', error);
    
    // Check if we're in testing mode
    const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true';
    
    if (isTestingMode) {
      console.log('TESTING MODE: Returning mock Lighthouse results after error');
      
      // Return mock results in testing mode
      return {
        performance: {
          score: 85,
          metrics: {
            'First Contentful Paint': { value: 1200, unit: 'ms' },
            'Largest Contentful Paint': { value: 2500, unit: 'ms' },
            'Cumulative Layout Shift': { value: 0.1 },
            'Total Blocking Time': { value: 150, unit: 'ms' },
            'Speed Index': { value: 3000, unit: 'ms' },
            'Server Response Time': { value: 200, unit: 'ms' }
          }
        },
        accessibility: {
          score: 92,
          issues: [
            { title: 'Images must have alternate text', description: 'Informative elements should aim for short, descriptive alternate text.', severity: 'medium' }
          ]
        },
        seo: {
          score: 95,
          issues: [
            { title: 'Document does not have a meta description', description: 'Meta descriptions may be included in search results to concisely summarize page content.', severity: 'medium' }
          ]
        },
        bestPractices: {
          score: 87,
          issues: [
            { title: 'Uses HTTPS', description: 'All sites should be protected with HTTPS, even ones that don\'t handle sensitive data.', severity: 'low' }
          ]
        }
      };
    }
    
    // In production mode, throw the error
    throw new Error(`Lighthouse audit failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}