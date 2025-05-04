import { supabase } from '@/lib/supabase';
import { ScanResult } from './scanService';

export interface ScorecardData {
  id: string;
  scanId: string;
  websiteUrl: string;
  websiteName: string;
  performanceScore: number;
  accessibilityScore: number;
  seoScore: number;
  securityScore: number;
  securityGrade: string;
  createdAt: string;
  shareUrl: string;
  shareCode: string;
}

/**
 * Generate a social scorecard for a scan
 * @param scanId The scan ID
 * @returns The scorecard data
 */
export async function generateScorecard(scanId: string): Promise<ScorecardData | null> {
  try {
    // Check if a scorecard already exists for this scan
    const { data: existingScorecard, error: existingError } = await supabase
      .from('scorecards')
      .select('*')
      .eq('scan_id', scanId)
      .single();

    if (!existingError && existingScorecard) {
      return formatScorecardData(existingScorecard);
    }

    // Get the scan data
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('id, website_id, websites(url, name, user_id)')
      .eq('id', scanId)
      .single();

    if (scanError || !scan) {
      console.error('Error fetching scan:', scanError);
      return null;
    }

    // Get the metrics for the scan
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics')
      .select('name, value')
      .eq('scan_id', scanId);

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return null;
    }

    // Extract scores
    const performanceScore = metrics.find(m => m.name === 'Performance Score')?.value || 0;
    const accessibilityScore = metrics.find(m => m.name === 'Accessibility Score')?.value || 0;
    const seoScore = metrics.find(m => m.name === 'SEO Score')?.value || 0;
    const securityScore = metrics.find(m => m.name === 'Security Score')?.value || 0;
    const securityGrade = getSecurityGrade(securityScore);

    // Generate a unique share code
    const shareCode = generateShareCode();

    // Create the scorecard
    const { data: scorecard, error: createError } = await supabase
      .from('scorecards')
      .insert({
        scan_id: scanId,
        website_id: scan.website_id,
        user_id: (scan.websites as any).user_id,
        website_url: (scan.websites as any).url,
        website_name: (scan.websites as any).name,
        performance_score: performanceScore,
        accessibility_score: accessibilityScore,
        seo_score: seoScore,
        security_score: securityScore,
        security_grade: securityGrade,
        share_code: shareCode,
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating scorecard:', createError);
      return null;
    }

    return formatScorecardData(scorecard);
  } catch (error) {
    console.error('Error generating scorecard:', error);
    return null;
  }
}

/**
 * Get a scorecard by its share code
 * @param shareCode The share code
 * @returns The scorecard data
 */
export async function getScorecardByShareCode(shareCode: string): Promise<ScorecardData | null> {
  try {
    const { data, error } = await supabase
      .from('scorecards')
      .select('*')
      .eq('share_code', shareCode)
      .single();

    if (error) {
      console.error('Error fetching scorecard:', error);
      return null;
    }

    return formatScorecardData(data);
  } catch (error) {
    console.error('Error fetching scorecard:', error);
    return null;
  }
}

/**
 * Get scorecards for a user
 * @param userId The user ID
 * @returns Array of scorecard data
 */
export async function getUserScorecards(userId: string): Promise<ScorecardData[]> {
  try {
    const { data, error } = await supabase
      .from('scorecards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user scorecards:', error);
      return [];
    }

    return data.map(formatScorecardData);
  } catch (error) {
    console.error('Error fetching user scorecards:', error);
    return [];
  }
}

/**
 * Delete a scorecard
 * @param scorecardId The scorecard ID
 * @returns Whether the deletion was successful
 */
export async function deleteScorecard(scorecardId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('scorecards')
      .delete()
      .eq('id', scorecardId);

    if (error) {
      console.error('Error deleting scorecard:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting scorecard:', error);
    return false;
  }
}

/**
 * Format scorecard data from database
 * @param data The database scorecard data
 * @returns Formatted scorecard data
 */
function formatScorecardData(data: any): ScorecardData {
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'https://webvitalai.com';

  return {
    id: data.id,
    scanId: data.scan_id,
    websiteUrl: data.website_url,
    websiteName: data.website_name,
    performanceScore: data.performance_score,
    accessibilityScore: data.accessibility_score,
    seoScore: data.seo_score,
    securityScore: data.security_score,
    securityGrade: data.security_grade,
    createdAt: data.created_at,
    shareCode: data.share_code,
    shareUrl: `${baseUrl}/scorecard/${data.share_code}`,
  };
}

/**
 * Generate a security grade based on score
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
 * Generate a random share code
 * @returns A random share code
 */
function generateShareCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}