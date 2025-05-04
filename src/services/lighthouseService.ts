import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

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
 * Run a Lighthouse audit on a URL
 * @param url The URL to audit
 * @returns The Lighthouse audit results
 */
export async function runLighthouseAudit(url: string): Promise<LighthouseResult> {
  // Launch Chrome
  const chrome = await launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
  });

  try {
    // Run Lighthouse
    const options = {
      logLevel: 'info' as 'info',
      output: 'json' as const,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);
    
    if (!runnerResult) {
      throw new Error('Lighthouse audit failed to return results');
    }
    
    const lhr = runnerResult.lhr;

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
        if (category.auditRefs.some(ref => ref.id === id)) {
          groupId = categoryId;
          break;
        }
      }
      
      return {
        ...audit,
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
  } finally {
    // Always kill Chrome
    await chrome.kill();
  }
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