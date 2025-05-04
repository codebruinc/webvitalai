import { supabase } from '@/lib/supabase';
import { runLighthouseAudit, LighthouseResult } from './lighthouseService';
import { runAxeAudit, AxeResult } from './axeService';
import { checkSecurityHeaders, SecurityHeadersResult } from './securityHeadersService';
import { generateRecommendation, RecommendationRequest } from './openaiService';
import { checkAlertsForScan, sendAlertNotifications } from './alertService';
import { Database } from '@/types/supabase';

export interface ScanResult {
  id: string;
  url: string;
  status: 'completed' | 'failed';
  error?: string;
  performance?: {
    score: number;
    metrics: Record<string, { value: number; unit?: string }>;
  };
  accessibility?: {
    score: number;
    issues: Array<{
      title: string;
      description: string;
      severity: string;
    }>;
  };
  seo?: {
    score: number;
    issues: Array<{
      title: string;
      description: string;
      severity: string;
    }>;
  };
  bestPractices?: {
    score: number;
    issues: Array<{
      title: string;
      description: string;
      severity: string;
    }>;
  };
  security?: {
    score: number;
    grade: string;
    issues: Array<{
      title: string;
      description: string;
      severity: string;
    }>;
  };
  recommendations?: Array<{
    issueId: string;
    description: string;
    priority: string;
    implementationDetails: string;
    impact: number;
    effort: number;
    priorityScore: number;
  }>;
}

/**
 * Initiate a scan for a URL
 * @param url The URL to scan
 * @param userId The user ID
 * @returns The scan ID
 */
export async function initiateScan(url: string, userId: string): Promise<string> {
  // Check if website exists
  const { data: existingWebsite, error: websiteError } = await supabase
    .from('websites')
    .select('id')
    .eq('user_id', userId)
    .eq('url', url)
    .single();

  let websiteId;

  if (websiteError && !existingWebsite) {
    // Website doesn't exist, create it
    const { data: newWebsite, error: createError } = await supabase
      .from('websites')
      .insert({
        user_id: userId,
        url,
        name: url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        is_active: true,
      })
      .select('id')
      .single();

    if (createError) {
      throw new Error(`Failed to create website: ${createError.message}`);
    }

    websiteId = newWebsite.id;
  } else {
    websiteId = existingWebsite?.id;
  }

  // Create a new scan
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .insert({
      website_id: websiteId,
      status: 'pending',
    })
    .select('id')
    .single();

  if (scanError) {
    throw new Error(`Failed to create scan: ${scanError.message}`);
  }

  return scan.id;
}

/**
 * Process a scan
 * @param scanId The scan ID
 * @returns The scan result
 */
export async function processScan(scanId: string): Promise<ScanResult> {
  try {
    // Get the scan
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('id, website_id, websites(url)')
      .eq('id', scanId)
      .single();

    if (scanError || !scan) {
      throw new Error(`Failed to get scan: ${scanError?.message || 'Scan not found'}`);
    }

    const url = (scan.websites as any).url;

    // Update scan status to in-progress
    await supabase
      .from('scans')
      .update({ status: 'in-progress' })
      .eq('id', scanId);

    // Run all audits in parallel
    const [lighthouseResult, axeResult, securityHeadersResult] = await Promise.all([
      runLighthouseAudit(url).catch(error => {
        console.error('Lighthouse audit failed:', error);
        return null;
      }),
      runAxeAudit(url).catch(error => {
        console.error('Axe audit failed:', error);
        return null;
      }),
      checkSecurityHeaders(url).catch(error => {
        console.error('Security headers check failed:', error);
        return null;
      }),
    ]);

    // Prepare the scan result
    const scanResult: ScanResult = {
      id: scanId,
      url,
      status: 'completed',
    };

    // Add results to the scan result
    if (lighthouseResult) {
      scanResult.performance = lighthouseResult.performance;
      scanResult.accessibility = lighthouseResult.accessibility;
      scanResult.seo = lighthouseResult.seo;
      scanResult.bestPractices = lighthouseResult.bestPractices;
    }

    if (axeResult) {
      // If we have both Lighthouse and axe results, use the axe score for accessibility
      scanResult.accessibility = {
        score: axeResult.score,
        issues: axeResult.violations.map(violation => ({
          title: violation.id,
          description: violation.description,
          severity: mapImpactToSeverity(violation.impact),
        })),
      };
    }

    if (securityHeadersResult) {
      scanResult.security = {
        score: securityHeadersResult.score,
        grade: securityHeadersResult.grade,
        issues: securityHeadersResult.issues,
      };
    }

    // Store metrics in the database
    await storeMetrics(scanId, scanResult);

    // Store issues in the database
    const issueIds = await storeIssues(scanId, scanResult);

    // Generate and store recommendations for premium users
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
      .eq('status', 'active')
      .single();

    if (subscription && (subscription.plan_id === 'premium' || subscription.plan_id === 'business')) {
      scanResult.recommendations = await generateRecommendations(scanId, scanResult, url, issueIds);
    }

    // Update scan status to completed
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', scanId);
    
    // Check for alerts
    try {
      const triggeredAlerts = await checkAlertsForScan(scanId);
      if (triggeredAlerts.length > 0) {
        await sendAlertNotifications(triggeredAlerts);
      }
    } catch (alertError) {
      console.error('Error checking alerts:', alertError);
      // Don't fail the scan if alert checking fails
    }

    return scanResult;
  } catch (error: any) {
    console.error('Scan processing failed:', error);

    // Update scan status to failed
    await supabase
      .from('scans')
      .update({
        status: 'failed',
        error: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    return {
      id: scanId,
      url: '',
      status: 'failed',
      error: error.message,
    };
  }
}

/**
 * Store metrics in the database
 * @param scanId The scan ID
 * @param scanResult The scan result
 */
async function storeMetrics(scanId: string, scanResult: ScanResult): Promise<void> {
  const metrics = [];

  // Performance metrics
  if (scanResult.performance?.metrics) {
    for (const [name, data] of Object.entries(scanResult.performance.metrics)) {
      metrics.push({
        scan_id: scanId,
        name,
        value: data.value,
        unit: data.unit,
        category: 'performance',
      });
    }
  }

  // Overall scores
  if (scanResult.performance) {
    metrics.push({
      scan_id: scanId,
      name: 'Performance Score',
      value: scanResult.performance.score,
      unit: null,
      category: 'performance',
    });
  }

  if (scanResult.accessibility) {
    metrics.push({
      scan_id: scanId,
      name: 'Accessibility Score',
      value: scanResult.accessibility.score,
      unit: null,
      category: 'accessibility',
    });
  }

  if (scanResult.seo) {
    metrics.push({
      scan_id: scanId,
      name: 'SEO Score',
      value: scanResult.seo.score,
      unit: null,
      category: 'seo',
    });
  }

  if (scanResult.bestPractices) {
    metrics.push({
      scan_id: scanId,
      name: 'Best Practices Score',
      value: scanResult.bestPractices.score,
      unit: null,
      category: 'best-practices',
    });
  }

  if (scanResult.security) {
    metrics.push({
      scan_id: scanId,
      name: 'Security Score',
      value: scanResult.security.score,
      unit: null,
      category: 'security',
    });
  }

  // Store metrics in batches
  if (metrics.length > 0) {
    const { error } = await supabase.from('metrics').insert(metrics);

    if (error) {
      console.error('Failed to store metrics:', error);
    }
  }
}

/**
 * Store issues in the database
 * @param scanId The scan ID
 * @param scanResult The scan result
 * @returns The issue IDs
 */
async function storeIssues(scanId: string, scanResult: ScanResult): Promise<Record<string, string>> {
  const issues = [];
  const issueMap: Record<string, string> = {};

  // Performance issues
  if (scanResult.performance?.metrics) {
    const performanceThresholds: Record<string, { threshold: number; unit?: string }> = {
      'First Contentful Paint': { threshold: 1800, unit: 'ms' },
      'Largest Contentful Paint': { threshold: 2500, unit: 'ms' },
      'Cumulative Layout Shift': { threshold: 0.1 },
      'Total Blocking Time': { threshold: 200, unit: 'ms' },
      'Speed Index': { threshold: 3400, unit: 'ms' },
      'Server Response Time': { threshold: 100, unit: 'ms' },
    };

    for (const [name, data] of Object.entries(scanResult.performance.metrics)) {
      const threshold = performanceThresholds[name];
      
      if (threshold && data.value > threshold.threshold) {
        const issue = {
          scan_id: scanId,
          title: `High ${name}`,
          description: `${name} is ${data.value}${data.unit ? ' ' + data.unit : ''}, which is above the recommended threshold of ${threshold.threshold}${threshold.unit ? ' ' + threshold.unit : ''}.`,
          severity: data.value > threshold.threshold * 1.5 ? 'high' : 'medium',
          category: 'performance',
        };
        
        issues.push(issue);
      }
    }
  }

  // Accessibility issues
  if (scanResult.accessibility?.issues) {
    for (const issue of scanResult.accessibility.issues) {
      issues.push({
        scan_id: scanId,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        category: 'accessibility',
      });
    }
  }

  // SEO issues
  if (scanResult.seo?.issues) {
    for (const issue of scanResult.seo.issues) {
      issues.push({
        scan_id: scanId,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        category: 'seo',
      });
    }
  }

  // Best practices issues
  if (scanResult.bestPractices?.issues) {
    for (const issue of scanResult.bestPractices.issues) {
      issues.push({
        scan_id: scanId,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        category: 'best-practices',
      });
    }
  }

  // Security issues
  if (scanResult.security?.issues) {
    for (const issue of scanResult.security.issues) {
      issues.push({
        scan_id: scanId,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        category: 'security',
      });
    }
  }

  // Store issues in batches
  if (issues.length > 0) {
    const { data, error } = await supabase
      .from('issues')
      .insert(issues)
      .select('id, title');

    if (error) {
      console.error('Failed to store issues:', error);
    } else if (data) {
      // Create a map of issue title to issue ID
      for (const issue of data) {
        issueMap[issue.title] = issue.id;
      }
    }
  }

  return issueMap;
}

/**
 * Generate recommendations for issues
 * @param scanId The scan ID
 * @param scanResult The scan result
 * @param url The URL
 * @param issueIds The issue IDs
 * @returns The recommendations
 */
async function generateRecommendations(
  scanId: string,
  scanResult: ScanResult,
  url: string,
  issueIds: Record<string, string>
): Promise<Array<{
  issueId: string;
  description: string;
  priority: string;
  implementationDetails: string;
  impact: number;
  effort: number;
  priorityScore: number;
}>> {
  const recommendations = [];
  const allIssues = [
    ...(scanResult.accessibility?.issues || []),
    ...(scanResult.seo?.issues || []),
    ...(scanResult.bestPractices?.issues || []),
    ...(scanResult.security?.issues || []),
  ];

  // Sort issues by severity (we'll sort recommendations by priorityScore later)
  const sortedIssues = allIssues.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return (
      (severityOrder[a.severity as keyof typeof severityOrder] || 3) -
      (severityOrder[b.severity as keyof typeof severityOrder] || 3)
    );
  });

  // Generate recommendations for the top 10 issues
  const topIssues = sortedIssues.slice(0, 10);
  
  for (const issue of topIssues) {
    const issueId = issueIds[issue.title];
    
    if (!issueId) continue;

    try {
      // Determine the category based on the issue
      let category = 'performance';
      if (issue.title.includes('accessibility') || issue.title.includes('ARIA')) {
        category = 'accessibility';
      } else if (issue.title.includes('SEO') || issue.title.includes('meta')) {
        category = 'seo';
      } else if (issue.title.includes('security') || issue.title.includes('header')) {
        category = 'security';
      }

      // Prepare the request for OpenAI
      const request: RecommendationRequest = {
        issue: {
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          category,
        },
        url,
        scanResults: {
          performance: scanResult.performance,
          accessibility: scanResult.accessibility,
          seo: scanResult.seo,
          security: scanResult.security,
        },
      };

      // Generate recommendation
      const recommendation = await generateRecommendation(request);

      // Store recommendation
      const { error } = await supabase.from('recommendations').insert({
        issue_id: issueId,
        description: recommendation.description,
        priority: recommendation.priority,
        implementation_details: recommendation.implementationDetails,
        impact: recommendation.impact,
        effort: recommendation.effort,
        priority_score: recommendation.priorityScore
      });

      if (error) {
        console.error('Failed to store recommendation:', error);
      } else {
        recommendations.push({
          issueId,
          description: recommendation.description,
          priority: recommendation.priority,
          implementationDetails: recommendation.implementationDetails,
          impact: recommendation.impact,
          effort: recommendation.effort,
          priorityScore: recommendation.priorityScore
        });
      }
    } catch (error) {
      console.error(`Failed to generate recommendation for issue ${issue.title}:`, error);
    }
  }

  // Sort recommendations by priorityScore (highest first)
  return recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Map impact to severity
 * @param impact The impact level
 * @returns The severity level
 */
function mapImpactToSeverity(impact: string): string {
  switch (impact.toLowerCase()) {
    case 'critical':
      return 'high';
    case 'serious':
      return 'high';
    case 'moderate':
      return 'medium';
    case 'minor':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Get a scan result
 * @param scanId The scan ID
 * @returns The scan result
 */
export async function getScanResult(scanId: string): Promise<ScanResult | null> {
  try {
    // Get the scan
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('id, status, error, completed_at, website_id, websites(url)')
      .eq('id', scanId)
      .single();

    if (scanError || !scan) {
      throw new Error(`Failed to get scan: ${scanError?.message || 'Scan not found'}`);
    }

    const url = (scan.websites as any).url;

    // Get metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics')
      .select('name, value, unit, category')
      .eq('scan_id', scanId);

    if (metricsError) {
      console.error('Failed to get metrics:', metricsError);
    }

    // Get issues
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('id, title, description, severity, category')
      .eq('scan_id', scanId);

    if (issuesError) {
      console.error('Failed to get issues:', issuesError);
    }

    // Get recommendations
    const { data: recommendations, error: recommendationsError } = await supabase
      .from('recommendations')
      .select('issue_id, description, priority, implementation_details, impact, effort, priority_score')
      .in(
        'issue_id',
        issues?.map(issue => issue.id) || []
      )
      .order('priority_score', { ascending: false });

    if (recommendationsError) {
      console.error('Failed to get recommendations:', recommendationsError);
    }

    // Prepare the scan result
    const scanResult: ScanResult = {
      id: scanId,
      url,
      status: scan.status === 'completed' ? 'completed' : 'failed',
      error: scan.error || undefined,
    };

    // Process metrics
    if (metrics) {
      const performanceMetrics: Record<string, { value: number; unit?: string }> = {};
      let performanceScore = 0;
      let accessibilityScore = 0;
      let seoScore = 0;
      let bestPracticesScore = 0;
      let securityScore = 0;

      for (const metric of metrics) {
        if (metric.category === 'performance' && metric.name !== 'Performance Score') {
          performanceMetrics[metric.name] = {
            value: metric.value,
            unit: metric.unit || undefined,
          };
        } else if (metric.name === 'Performance Score') {
          performanceScore = metric.value;
        } else if (metric.name === 'Accessibility Score') {
          accessibilityScore = metric.value;
        } else if (metric.name === 'SEO Score') {
          seoScore = metric.value;
        } else if (metric.name === 'Best Practices Score') {
          bestPracticesScore = metric.value;
        } else if (metric.name === 'Security Score') {
          securityScore = metric.value;
        }
      }

      if (Object.keys(performanceMetrics).length > 0 || performanceScore > 0) {
        scanResult.performance = {
          score: performanceScore,
          metrics: performanceMetrics,
        };
      }

      if (accessibilityScore > 0) {
        scanResult.accessibility = {
          score: accessibilityScore,
          issues: [],
        };
      }

      if (seoScore > 0) {
        scanResult.seo = {
          score: seoScore,
          issues: [],
        };
      }

      if (bestPracticesScore > 0) {
        scanResult.bestPractices = {
          score: bestPracticesScore,
          issues: [],
        };
      }

      if (securityScore > 0) {
        scanResult.security = {
          score: securityScore,
          grade: getSecurityGrade(securityScore),
          issues: [],
        };
      }
    }

    // Process issues
    if (issues) {
      for (const issue of issues) {
        const issueData = {
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
        };

        if (issue.category === 'accessibility' && scanResult.accessibility) {
          scanResult.accessibility.issues.push(issueData);
        } else if (issue.category === 'seo' && scanResult.seo) {
          scanResult.seo.issues.push(issueData);
        } else if (issue.category === 'best-practices' && scanResult.bestPractices) {
          scanResult.bestPractices.issues.push(issueData);
        } else if (issue.category === 'security' && scanResult.security) {
          scanResult.security.issues.push(issueData);
        }
      }
    }

    // Process recommendations
    if (recommendations && recommendations.length > 0) {
      scanResult.recommendations = recommendations.map(rec => ({
        issueId: rec.issue_id,
        description: rec.description,
        priority: rec.priority,
        implementationDetails: rec.implementation_details,
        impact: rec.impact || 5,
        effort: rec.effort || 5,
        priorityScore: rec.priority_score || 0
      }));
    }

    return scanResult;
  } catch (error: any) {
    console.error('Failed to get scan result:', error);
    return null;
  }
}

/**
 * Get security grade based on score
 * @param score The security score
 * @returns The security grade
 */
function getSecurityGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}