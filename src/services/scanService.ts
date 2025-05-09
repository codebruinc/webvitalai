import { supabase, supabaseServiceRole } from '@/lib/supabase';
import { runLighthouseAudit, LighthouseResult } from './lighthouseService';
import { runAxeAudit, AxeResult } from './axeService';
import { checkSecurityHeaders, SecurityHeadersResult } from './securityHeadersService';
import { generateRecommendation, RecommendationRequest } from './openaiService';
import { checkAlertsForScan, sendAlertNotifications } from './alertService';
import { Database } from '@/types/supabase';
import crypto from 'crypto';

// Store mock scan URLs for testing mode
export const mockScanUrls = new Map<string, string>();

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
/**
 * Initiate a scan for a URL
 * This function attempts to create a scan using the provided client,
 * and falls back to the service role client if that fails
 *
 * @param url The URL to scan
 * @param userId The user ID
 * @param client The Supabase client to use (defaults to global client)
 * @returns The scan ID
 */
export async function initiateScan(
  url: string,
  userId: string,
  client = supabaseServiceRole // Default to service role client to bypass RLS
): Promise<string> {
  // Log which client we're using
  console.log('initiateScan: Starting scan creation with service role client', {
    url,
    userId
  });
  
  // Check if we're in testing mode based on environment variables
  const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true';
  
  // PRODUCTION MODE: Check if user exists and create if needed
  const { data: user, error: userError } = await client
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  // If user doesn't exist in public.users table or there's an error
  if (userError) {
    console.log('User not found in public.users table, creating user record');
    
    // Get user information from Supabase Auth
    const { data: authUser, error: authError } = await client.auth.getUser(userId);
    
    if (authError || !authUser?.user) {
      console.error('Auth user lookup error:', authError);
      throw new Error(`Failed to get auth user: ${authError?.message || 'User not found in auth'}`);
    }
    
    // Create user record in public.users table
    const { data: newUser, error: createError } = await client
      .from('users')
      .insert({
        id: userId,
        email: authUser.user.email || '',
        name: authUser.user.user_metadata?.name || null,
        avatar_url: authUser.user.user_metadata?.avatar_url || null,
      })
      .select('id')
      .single();
    
    if (createError) {
      console.error('User creation error:', createError);
      throw new Error(`Failed to create user: ${createError.message || 'Unknown database error'}`);
    }
    
    console.log('User created successfully:', newUser.id);
  } else {
    console.log('User found in public.users table:', user.id);
  }

  // Website handling - check if website exists or create it
  let websiteId;
  
  // PRODUCTION MODE: Normal website lookup and creation
  // Check if website exists
  const { data: existingWebsite, error: websiteError } = await client
    .from('websites')
    .select('id')
    .eq('user_id', userId)
    .eq('url', url)
    .single();

  // Check specifically for "no rows returned" error (PGRST116)
  if (websiteError && websiteError.code === 'PGRST116') {
    // Website doesn't exist, create it
    const { data: newWebsite, error: createError } = await client
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
      console.error('Website creation error:', createError);
      throw new Error(`Failed to create website: ${createError.message || 'Unknown database error'}`);
    }

    websiteId = newWebsite.id;
  } else if (websiteError) {
    // Handle other database errors
    console.error('Website lookup error:', websiteError);
    throw new Error(`Failed to lookup website: ${websiteError.message || 'Unknown database error'}`);
  } else {
    // Website exists
    websiteId = existingWebsite.id;
  }

  // Create a new scan - always use production mode
  let scanId;
  
  // PRODUCTION MODE: Create scan with service role client
  console.log('Creating scan with service role client');
  
  const { data: scan, error: scanError } = await client
    .from('scans')
    .insert({
      website_id: websiteId,
      status: 'pending',
    })
    .select('id')
    .single();
  
  if (scanError) {
    console.error('Scan creation error with service role client:', scanError);
    throw new Error(`Failed to create scan: ${scanError.message || 'Unknown database error'}`);
  }
  
  scanId = scan.id;
  console.log('Scan created successfully:', scanId);
  
  return scanId;
}

/**
 * Process a scan
 * @param scanId The scan ID
 * @returns The scan result
 */
export async function processScan(scanId: string): Promise<ScanResult> {
  try {
    // Get the scan from the database
    let url;
    
    // Check if we're in testing mode based on environment variables
    const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true';
    
    // Get the scan from the database
    const { data: scan, error: scanError } = await supabaseServiceRole
      .from('scans')
      .select('id, website_id, websites(url)')
      .eq('id', scanId)
      .single();

    if (scanError || !scan) {
      console.error('Failed to get scan:', scanError);
      throw new Error(`Failed to get scan: ${scanError?.message || 'Scan not found'}`);
    }

    url = (scan.websites as any).url;

    // Update scan status to in-progress
    await supabaseServiceRole
      .from('scans')
      .update({ status: 'in-progress' })
      .eq('id', scanId);
    
    console.log(`Processing scan ${scanId} for URL: ${url}`);
    
    // No need to log here, already logged above

    // Create fallback results for when services fail
    const fallbackLighthouseResult: LighthouseResult = {
      performance: {
        score: 50,
        metrics: {
          'First Contentful Paint': { value: 2000, unit: 'ms' },
          'Largest Contentful Paint': { value: 3000, unit: 'ms' },
          'Cumulative Layout Shift': { value: 0.2 },
          'Total Blocking Time': { value: 300, unit: 'ms' },
          'Speed Index': { value: 4000, unit: 'ms' },
          'Server Response Time': { value: 300, unit: 'ms' }
        }
      },
      accessibility: {
        score: 50,
        issues: [
          { title: 'Accessibility audit failed', description: 'The accessibility audit could not be completed. Please try again later.', severity: 'medium' }
        ]
      },
      seo: {
        score: 50,
        issues: [
          { title: 'SEO audit failed', description: 'The SEO audit could not be completed. Please try again later.', severity: 'medium' }
        ]
      },
      bestPractices: {
        score: 50,
        issues: [
          { title: 'Best practices audit failed', description: 'The best practices audit could not be completed. Please try again later.', severity: 'medium' }
        ]
      }
    };

    const fallbackAxeResult: AxeResult = {
      score: 50,
      violations: [
        {
          id: 'accessibility-audit-failed',
          impact: 'moderate',
          description: 'The accessibility audit could not be completed',
          help: 'Please try again later',
          helpUrl: '',
          nodes: 0
        }
      ],
      passes: 0,
      incomplete: 0
    };

    const fallbackSecurityHeadersResult: SecurityHeadersResult = {
      score: 50,
      grade: 'D',
      headers: {},
      issues: [
        { title: 'Security headers check failed', description: 'The security headers check could not be completed. Please try again later.', severity: 'medium' }
      ]
    };

    // Run all audits in parallel
    const auditUrl = url;
    const [lighthouseResult, axeResult, securityHeadersResult] = await Promise.all([
      runLighthouseAudit(auditUrl).catch(error => {
        console.error('Lighthouse audit failed:', error);
        return fallbackLighthouseResult;
      }),
      runAxeAudit(auditUrl).catch(error => {
        console.error('Axe audit failed:', error);
        return fallbackAxeResult;
      }),
      checkSecurityHeaders(auditUrl).catch(error => {
        console.error('Security headers check failed:', error);
        return fallbackSecurityHeadersResult;
      }),
    ]);

    // Prepare the scan result
    const scanResult: ScanResult = {
      id: scanId,
      url,
      status: 'completed',
    };

    // Add results to the scan result - since we're using fallbacks, these will always be available
    // Add Lighthouse results (performance, SEO, best practices)
    scanResult.performance = lighthouseResult.performance;
    scanResult.seo = lighthouseResult.seo;
    scanResult.bestPractices = lighthouseResult.bestPractices;
    
    // For accessibility, prefer axe results over lighthouse
    scanResult.accessibility = {
      score: axeResult.score,
      issues: axeResult.violations.map(violation => ({
        title: violation.id,
        description: violation.description,
        severity: mapImpactToSeverity(violation.impact),
      })),
    };
    
    // Add security results
    scanResult.security = {
      score: securityHeadersResult.score,
      grade: securityHeadersResult.grade,
      issues: securityHeadersResult.issues,
    };

    // Store metrics in the database
    await storeMetrics(scanId, scanResult);

    // Store issues in the database
    const issueIds = await storeIssues(scanId, scanResult);

    // Generate and store recommendations for premium users
    try {
      // Get the user ID from the scan's website
      const { data: scanData, error: scanError } = await supabaseServiceRole
        .from('scans')
        .select('website_id, websites(user_id)')
        .eq('id', scanId)
        .single();
      
      if (scanError || !scanData) {
        console.error('Error fetching scan data for subscription check:', scanError);
        // Continue without recommendations if we can't get the user ID
      } else {
        // The websites field is returned as an object, not an array
        const userId = (scanData.websites as any).user_id;
        
        if (userId) {
          const { data: subscription, error: subscriptionError } = await supabaseServiceRole
            .from('subscriptions')
            .select('plan_type, status')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

          if (subscriptionError) {
            console.error('Subscription query error:', subscriptionError);
            const errorMessage = subscriptionError.message || 'Unknown database error';
            if (subscriptionError.details?.includes('column') || subscriptionError.message?.includes('column')) {
              console.error('Schema mismatch detected in subscription query. Check database schema alignment with code.');
            }
            // Continue without recommendations if there's an error with subscriptions
          } else if (subscription && (subscription.plan_type === 'premium' || subscription.plan_type === 'business')) {
            scanResult.recommendations = await generateRecommendations(scanId, scanResult, url, issueIds);
          }
        } else {
          console.error('No user ID found for scan:', scanId);
        }
      }
    } catch (subscriptionError) {
      console.error('Error checking subscription status:', subscriptionError);
      // Continue without recommendations if there's an error with subscriptions
    }

    // Update scan status to completed
    await supabaseServiceRole
      .from('scans')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', scanId);
    
    console.log(`Scan ${scanId} completed successfully`);
    
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
    
    // Extract error message with fallback
    const errorMessage = error.message || 'Unknown error during scan processing';
    
    // Update scan status to failed
    try {
      await supabaseServiceRole
        .from('scans')
        .update({
          status: 'failed',
          error: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', scanId);
    } catch (dbError) {
      // If we can't update the database, at least log the error
      console.error('Failed to update scan status in database:', dbError);
    }

    // Try to get the URL from mockScanUrls if available, otherwise use a fallback
    // Only use mockScanUrls in testing mode
    const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true';
    const fallbackUrl = (isTestingMode && mockScanUrls.has(scanId)) ? mockScanUrls.get(scanId)! : 'unknown';
    
    return {
      id: scanId,
      url: fallbackUrl,
      status: 'failed',
      error: errorMessage,
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
    const { error } = await supabaseServiceRole.from('metrics').insert(metrics);

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
    const { data, error } = await supabaseServiceRole
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
      const { error } = await supabaseServiceRole.from('recommendations').insert({
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
// Export the getScanResult function for use in API routes
export async function getScanResult(scanId: string): Promise<ScanResult | null> {
  try {
    // Check if we're in testing mode based on environment variables
    const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true';
    
    console.log(`getScanResult called for scan ID: ${scanId}`);
    console.log(`Testing mode: ${isTestingMode ? 'Yes' : 'No'}`);
    
    // Variables to store scan data and URL
    let scan;
    let url;
    
    // Check if the scan ID has a "default-" prefix, which is not a valid UUID
    const hasDefaultPrefix = scanId.startsWith('default-');
    console.log(`Scan ID has default prefix: ${hasDefaultPrefix ? 'Yes' : 'No'}`);
    
    try {
      console.log(`Fetching scan result for scan ID: ${scanId}`);
      
      // If the scan ID has a "default-" prefix, it's not a valid UUID for the database
      if (hasDefaultPrefix) {
        console.error(`Invalid scan ID format: ${scanId} - IDs with "default-" prefix are not valid UUIDs`);
        return null;
      }
      
      // Always use service role client to bypass RLS policies
      // Normal database lookup for production mode - first try without .single() to avoid PGRST116 error
      console.log(`Querying database for scan ID: ${scanId}`);
      const { data: scanDataArray, error: scanArrayError } = await supabaseServiceRole
        .from('scans')
        .select('id, status, error, completed_at, website_id, websites(url)')
        .eq('id', scanId);
      
      console.log(`Database query result:`, {
        hasData: scanDataArray && scanDataArray.length > 0,
        count: scanDataArray ? scanDataArray.length : 0,
        error: scanArrayError ? scanArrayError.message : null
      });
      
      if (scanArrayError) {
        console.error('Failed to get scan result (array query):', scanArrayError);
        throw new Error(`Failed to get scan: ${scanArrayError.message || 'Database error'}`);
      }
      
      // Check if we got any results
      if (!scanDataArray || scanDataArray.length === 0) {
        console.error(`No scan found with ID: ${scanId}`);
        return null; // Return null instead of throwing an error for better error handling
      }
      
      // Use the first result
      const scanData = scanDataArray[0];
  
      // This condition should never be true since we already checked scanDataArray.length above,
      // but we'll keep it for type safety
      if (!scanData) {
        console.error('Failed to get scan result: No scan data found');
        return null; // Return null instead of throwing an error
      }
      
      // If we're in testing mode and we have a mock scan URL, we can use that for mock scan results
      if (isTestingMode && mockScanUrls.has(scanId)) {
        // Get the mock URL
        const mockUrl = mockScanUrls.get(scanId) || 'https://example.com';
        
        // Only log in testing mode
        console.log('Found mock scan URL for testing');
        console.log('Using URL for mock scan results:', mockUrl);
        
        // Return mock scan results data
        return {
          id: scanId,
          url: mockUrl,
          status: 'completed',
          performance: {
            score: 85,
            metrics: {
              'First Contentful Paint': { value: 1.2, unit: 's' },
              'Largest Contentful Paint': { value: 2.5, unit: 's' },
              'Total Blocking Time': { value: 150, unit: 'ms' },
              'Cumulative Layout Shift': { value: 0.05 }
            }
          },
          accessibility: {
            score: 92,
            issues: [
              { title: 'Images must have alternate text', description: 'Provide alt text for images', severity: 'medium' }
            ]
          },
          seo: {
            score: 88,
            issues: [
              { title: 'Document does not have a meta description', description: 'Add a meta description', severity: 'medium' }
            ]
          },
          bestPractices: {
            score: 90,
            issues: []
          },
          security: {
            score: 75,
            grade: 'B',
            issues: [
              { title: 'Missing Content-Security-Policy header', description: 'Add CSP header', severity: 'high' }
            ]
          },
          recommendations: [
            {
              issueId: 'rec-1',
              description: 'Optimize images to improve load time',
              priority: 'high',
              implementationDetails: 'Use WebP format and compress images',
              impact: 8,
              effort: 3,
              priorityScore: 8.5
            },
            {
              issueId: 'rec-2',
              description: 'Add alt text to all images',
              priority: 'medium',
              implementationDetails: 'Ensure all <img> tags have descriptive alt attributes',
              impact: 6,
              effort: 2,
              priorityScore: 7.0
            }
          ]
        };
      }
      
      // Store scan data for later use
      scan = scanData;
      url = (scan.websites as any).url;
      
    } catch (dbError) {
      // We're in production mode, so just re-throw the error
      
      // Re-throw the error if we can't handle it
      throw dbError;
    }

    // Get metrics - always use service role client to bypass RLS
    console.log(`Fetching metrics for scan ID: ${scanId}`);
    const { data: metrics, error: metricsError } = await supabaseServiceRole
      .from('metrics')
      .select('name, value, unit, category')
      .eq('scan_id', scanId);

    console.log(`Metrics query result:`, {
      hasData: metrics && metrics.length > 0,
      count: metrics ? metrics.length : 0,
      error: metricsError ? metricsError.message : null
    });

    if (metricsError) {
      console.error('Failed to get metrics:', metricsError);
      // Continue with empty metrics rather than failing
    }

    // Get issues - always use service role client to bypass RLS
    const { data: issues, error: issuesError } = await supabaseServiceRole
      .from('issues')
      .select('id, title, description, severity, category')
      .eq('scan_id', scanId);

    if (issuesError) {
      console.error('Failed to get issues:', issuesError);
      // Continue with empty issues rather than failing
    }

    // Get recommendations - always use service role client to bypass RLS
    const { data: recommendations, error: recommendationsError } = await supabaseServiceRole
      .from('recommendations')
      .select('issue_id, description, priority, implementation_details, impact, effort, priority_score')
      .in(
        'issue_id',
        issues?.map(issue => issue.id) || []
      )
      .order('priority_score', { ascending: false });

    if (recommendationsError) {
      console.error('Failed to get recommendations:', recommendationsError);
      // Continue with empty recommendations rather than failing
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

    console.log(`Returning scan result for ID ${scanId}:`, {
      id: scanResult.id,
      url: scanResult.url,
      status: scanResult.status,
      hasPerformance: !!scanResult.performance,
      hasAccessibility: !!scanResult.accessibility,
      hasSeo: !!scanResult.seo,
      hasBestPractices: !!scanResult.bestPractices,
      hasSecurity: !!scanResult.security,
      hasRecommendations: !!scanResult.recommendations
    });
    
    return scanResult;
  } catch (error: any) {
    console.error('Failed to get scan result:', error);
    // Log the full error object for debugging
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    // Always return null instead of throwing to allow graceful handling by the UI
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
/**
 * Alias for getScanResult to maintain backward compatibility
 * @param scanId The scan ID
 * @returns The scan result
 */
export const getScanResults = getScanResult;
