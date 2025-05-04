import { supabase } from '@/lib/supabase';

export interface IndustryBenchmark {
  id: string;
  industry: string;
  metricName: string;
  goodThreshold: number;
  averageThreshold: number;
  poorThreshold: number;
}

export interface BenchmarkComparison {
  metricName: string;
  currentValue: number;
  industry: string;
  goodThreshold: number;
  averageThreshold: number;
  poorThreshold: number;
  status: 'good' | 'average' | 'poor';
  percentile?: number;
}

/**
 * Get all available industries for benchmarking
 * @returns Array of industry names
 */
export async function getAvailableIndustries(): Promise<string[]> {
  const { data, error } = await supabase
    .from('industry_benchmarks')
    .select('industry')
    .order('industry');

  if (error) {
    console.error('Error fetching industries:', error);
    return [];
  }

  // Use Set to get unique industries
  const industries = new Set<string>();
  data.forEach((item: { industry: string }) => {
    industries.add(item.industry);
  });

  return Array.from(industries);
}

/**
 * Get benchmarks for a specific industry
 * @param industry The industry name
 * @returns Array of industry benchmarks
 */
export async function getIndustryBenchmarks(industry: string): Promise<IndustryBenchmark[]> {
  const { data, error } = await supabase
    .from('industry_benchmarks')
    .select('*')
    .eq('industry', industry);

  if (error) {
    console.error('Error fetching industry benchmarks:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    industry: item.industry,
    metricName: item.metric_name,
    goodThreshold: item.good_threshold,
    averageThreshold: item.average_threshold,
    poorThreshold: item.poor_threshold,
  }));
}

/**
 * Compare website metrics against industry benchmarks
 * @param scanId The scan ID
 * @param industry The industry to compare against
 * @returns Array of benchmark comparisons
 */
export async function compareWithIndustryBenchmarks(
  scanId: string,
  industry: string
): Promise<BenchmarkComparison[]> {
  // Get the metrics for the scan
  const { data: metrics, error: metricsError } = await supabase
    .from('metrics')
    .select('name, value, unit, category')
    .eq('scan_id', scanId);

  if (metricsError) {
    console.error('Error fetching metrics:', metricsError);
    return [];
  }

  // Get the benchmarks for the industry
  const benchmarks = await getIndustryBenchmarks(industry);

  // Compare metrics with benchmarks
  const comparisons: BenchmarkComparison[] = [];

  for (const metric of metrics) {
    const benchmark = benchmarks.find(b => b.metricName === metric.name);
    
    if (benchmark) {
      let status: 'good' | 'average' | 'poor';
      
      // For metrics where lower is better (like load times)
      if (['First Contentful Paint', 'Largest Contentful Paint', 'Total Blocking Time', 'Cumulative Layout Shift', 'Speed Index'].includes(metric.name)) {
        if (metric.value <= benchmark.goodThreshold) {
          status = 'good';
        } else if (metric.value <= benchmark.averageThreshold) {
          status = 'average';
        } else {
          status = 'poor';
        }
      } 
      // For metrics where higher is better (like scores)
      else {
        if (metric.value >= benchmark.goodThreshold) {
          status = 'good';
        } else if (metric.value >= benchmark.averageThreshold) {
          status = 'average';
        } else {
          status = 'poor';
        }
      }

      // Calculate percentile (simplified)
      let percentile: number | undefined;
      if (['First Contentful Paint', 'Largest Contentful Paint', 'Total Blocking Time', 'Cumulative Layout Shift', 'Speed Index'].includes(metric.name)) {
        // For metrics where lower is better
        if (metric.value <= benchmark.goodThreshold) {
          percentile = 90;
        } else if (metric.value <= benchmark.averageThreshold) {
          percentile = 50;
        } else {
          percentile = 10;
        }
      } else {
        // For metrics where higher is better
        if (metric.value >= benchmark.goodThreshold) {
          percentile = 90;
        } else if (metric.value >= benchmark.averageThreshold) {
          percentile = 50;
        } else {
          percentile = 10;
        }
      }

      comparisons.push({
        metricName: metric.name,
        currentValue: metric.value,
        industry: benchmark.industry,
        goodThreshold: benchmark.goodThreshold,
        averageThreshold: benchmark.averageThreshold,
        poorThreshold: benchmark.poorThreshold,
        status,
        percentile,
      });
    }
  }

  return comparisons;
}

/**
 * Seed initial industry benchmarks (for development/testing)
 */
export async function seedIndustryBenchmarks(): Promise<void> {
  const benchmarks = [
    // E-commerce
    { industry: 'E-commerce', metric_name: 'Performance Score', good_threshold: 80, average_threshold: 60, poor_threshold: 40 },
    { industry: 'E-commerce', metric_name: 'First Contentful Paint', good_threshold: 1.8, average_threshold: 3, poor_threshold: 4.5 },
    { industry: 'E-commerce', metric_name: 'Largest Contentful Paint', good_threshold: 2.5, average_threshold: 4, poor_threshold: 6 },
    { industry: 'E-commerce', metric_name: 'Cumulative Layout Shift', good_threshold: 0.1, average_threshold: 0.25, poor_threshold: 0.4 },
    { industry: 'E-commerce', metric_name: 'Total Blocking Time', good_threshold: 200, average_threshold: 500, poor_threshold: 800 },
    { industry: 'E-commerce', metric_name: 'Speed Index', good_threshold: 3.4, average_threshold: 5.8, poor_threshold: 8.2 },
    { industry: 'E-commerce', metric_name: 'Accessibility Score', good_threshold: 90, average_threshold: 75, poor_threshold: 60 },
    { industry: 'E-commerce', metric_name: 'SEO Score', good_threshold: 90, average_threshold: 75, poor_threshold: 60 },
    { industry: 'E-commerce', metric_name: 'Security Score', good_threshold: 85, average_threshold: 70, poor_threshold: 55 },
    
    // Media & Publishing
    { industry: 'Media & Publishing', metric_name: 'Performance Score', good_threshold: 75, average_threshold: 55, poor_threshold: 35 },
    { industry: 'Media & Publishing', metric_name: 'First Contentful Paint', good_threshold: 2, average_threshold: 3.5, poor_threshold: 5 },
    { industry: 'Media & Publishing', metric_name: 'Largest Contentful Paint', good_threshold: 2.8, average_threshold: 4.5, poor_threshold: 6.5 },
    { industry: 'Media & Publishing', metric_name: 'Cumulative Layout Shift', good_threshold: 0.15, average_threshold: 0.3, poor_threshold: 0.45 },
    { industry: 'Media & Publishing', metric_name: 'Total Blocking Time', good_threshold: 250, average_threshold: 550, poor_threshold: 850 },
    { industry: 'Media & Publishing', metric_name: 'Speed Index', good_threshold: 3.8, average_threshold: 6.2, poor_threshold: 8.6 },
    { industry: 'Media & Publishing', metric_name: 'Accessibility Score', good_threshold: 85, average_threshold: 70, poor_threshold: 55 },
    { industry: 'Media & Publishing', metric_name: 'SEO Score', good_threshold: 90, average_threshold: 75, poor_threshold: 60 },
    { industry: 'Media & Publishing', metric_name: 'Security Score', good_threshold: 80, average_threshold: 65, poor_threshold: 50 },
    
    // SaaS
    { industry: 'SaaS', metric_name: 'Performance Score', good_threshold: 85, average_threshold: 65, poor_threshold: 45 },
    { industry: 'SaaS', metric_name: 'First Contentful Paint', good_threshold: 1.5, average_threshold: 2.8, poor_threshold: 4.2 },
    { industry: 'SaaS', metric_name: 'Largest Contentful Paint', good_threshold: 2.2, average_threshold: 3.8, poor_threshold: 5.5 },
    { industry: 'SaaS', metric_name: 'Cumulative Layout Shift', good_threshold: 0.08, average_threshold: 0.2, poor_threshold: 0.35 },
    { industry: 'SaaS', metric_name: 'Total Blocking Time', good_threshold: 180, average_threshold: 450, poor_threshold: 750 },
    { industry: 'SaaS', metric_name: 'Speed Index', good_threshold: 3.2, average_threshold: 5.5, poor_threshold: 8 },
    { industry: 'SaaS', metric_name: 'Accessibility Score', good_threshold: 95, average_threshold: 80, poor_threshold: 65 },
    { industry: 'SaaS', metric_name: 'SEO Score', good_threshold: 90, average_threshold: 75, poor_threshold: 60 },
    { industry: 'SaaS', metric_name: 'Security Score', good_threshold: 90, average_threshold: 75, poor_threshold: 60 },
    
    // Travel & Hospitality
    { industry: 'Travel & Hospitality', metric_name: 'Performance Score', good_threshold: 75, average_threshold: 55, poor_threshold: 35 },
    { industry: 'Travel & Hospitality', metric_name: 'First Contentful Paint', good_threshold: 2, average_threshold: 3.5, poor_threshold: 5 },
    { industry: 'Travel & Hospitality', metric_name: 'Largest Contentful Paint', good_threshold: 2.8, average_threshold: 4.5, poor_threshold: 6.5 },
    { industry: 'Travel & Hospitality', metric_name: 'Cumulative Layout Shift', good_threshold: 0.12, average_threshold: 0.28, poor_threshold: 0.42 },
    { industry: 'Travel & Hospitality', metric_name: 'Total Blocking Time', good_threshold: 220, average_threshold: 520, poor_threshold: 820 },
    { industry: 'Travel & Hospitality', metric_name: 'Speed Index', good_threshold: 3.6, average_threshold: 6, poor_threshold: 8.4 },
    { industry: 'Travel & Hospitality', metric_name: 'Accessibility Score', good_threshold: 85, average_threshold: 70, poor_threshold: 55 },
    { industry: 'Travel & Hospitality', metric_name: 'SEO Score', good_threshold: 90, average_threshold: 75, poor_threshold: 60 },
    { industry: 'Travel & Hospitality', metric_name: 'Security Score', good_threshold: 85, average_threshold: 70, poor_threshold: 55 },
  ];

  // Insert benchmarks in batches
  const { error } = await supabase.from('industry_benchmarks').insert(benchmarks);

  if (error) {
    console.error('Error seeding industry benchmarks:', error);
    throw error;
  }
}