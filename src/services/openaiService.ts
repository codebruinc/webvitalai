import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RecommendationRequest {
  issue: {
    title: string;
    description: string;
    severity: string;
    category: string;
  };
  url: string;
  scanResults: {
    performance?: {
      score: number;
      metrics: {
        [key: string]: {
          value: number;
          unit?: string;
        };
      };
    };
    accessibility?: {
      score: number;
    };
    seo?: {
      score: number;
    };
    security?: {
      score: number;
      grade: string;
    };
  };
}

export interface RecommendationResponse {
  description: string;
  priority: string;
  implementationDetails: string;
  impact: number; // 1-10 scale
  effort: number; // 1-10 scale
  priorityScore: number; // Calculated score for sorting
}

/**
 * Generate a recommendation for an issue using OpenAI
 * @param request The recommendation request
 * @returns The recommendation response
 */
export async function generateRecommendation(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  try {
    // Create a prompt for OpenAI
    const prompt = `
You are a web performance, accessibility, SEO, and security expert. 
Based on the following issue detected on a website, provide a detailed recommendation.

WEBSITE URL: ${request.url}

ISSUE DETAILS:
- Title: ${request.issue.title}
- Description: ${request.issue.description}
- Severity: ${request.issue.severity}
- Category: ${request.issue.category}

SCAN RESULTS OVERVIEW:
${request.scanResults.performance ? `- Performance Score: ${request.scanResults.performance.score}/100` : ''}
${request.scanResults.accessibility ? `- Accessibility Score: ${request.scanResults.accessibility.score}/100` : ''}
${request.scanResults.seo ? `- SEO Score: ${request.scanResults.seo.score}/100` : ''}
${request.scanResults.security ? `- Security Score: ${request.scanResults.security.score}/100 (Grade: ${request.scanResults.security.grade})` : ''}

${
  request.scanResults.performance?.metrics
    ? `PERFORMANCE METRICS:
${Object.entries(request.scanResults.performance.metrics)
  .map(([key, value]) => `- ${key}: ${value.value}${value.unit ? ' ' + value.unit : ''}`)
  .join('\n')}`
    : ''
}

Please provide:
1. A clear description of why this issue is important to fix
2. A priority level (critical, high, medium, low) with justification
3. Detailed implementation steps to resolve the issue
4. Impact score (1-10) - how much fixing this issue will improve the website
5. Effort score (1-10) - how difficult/time-consuming it would be to implement the fix

Format your response as JSON with the following structure:
{
  "description": "Why this issue matters and its impact",
  "priority": "Priority level (critical, high, medium, low)",
  "implementationDetails": "Step-by-step instructions to fix the issue",
  "impact": 5, // Example value on a scale of 1-10
  "effort": 3, // Example value on a scale of 1-10
  "priorityScore": 0 // Will be calculated on the server
}
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are WebVitalAI, an expert assistant that provides detailed recommendations for web performance, accessibility, SEO, and security issues. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      // Removed response_format parameter as it may not be supported by all GPT-4 deployments
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const parsedRecommendation = JSON.parse(content);
    
    // Calculate priority score (impact / effort ratio)
    const impact = parsedRecommendation.impact || 5;
    const effort = parsedRecommendation.effort || 5;
    const priorityScore = calculatePriorityScore(impact, effort, parsedRecommendation.priority);
    
    const recommendation: RecommendationResponse = {
      ...parsedRecommendation,
      impact,
      effort,
      priorityScore
    };
    
    return recommendation;
  } catch (error) {
    console.error('Error generating recommendation:', error);
    
    // Provide a fallback recommendation if OpenAI fails
    const priority = mapSeverityToPriority(request.issue.severity);
    const impact = mapSeverityToImpact(request.issue.severity);
    const effort = 5; // Default medium effort
    
    return {
      description: `This issue requires attention based on its severity (${request.issue.severity}) and category (${request.issue.category}).`,
      priority,
      implementationDetails: 'Please consult web development best practices or documentation related to this specific issue.',
      impact,
      effort,
      priorityScore: calculatePriorityScore(impact, effort, priority)
    };
  }
}

/**
 * Map severity to priority
 * @param severity The severity level
 * @returns The priority level
 */
function mapSeverityToPriority(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'high':
      return 'critical';
    case 'medium':
      return 'high';
    case 'low':
      return 'medium';
    default:
      return 'low';
  }
}

/**
 * Map severity to impact score
 * @param severity The severity level
 * @returns The impact score (1-10)
 */
function mapSeverityToImpact(severity: string): number {
  switch (severity.toLowerCase()) {
    case 'high':
      return 9;
    case 'medium':
      return 6;
    case 'low':
      return 3;
    default:
      return 5;
  }
}

/**
 * Calculate priority score based on impact, effort, and priority
 * @param impact Impact score (1-10)
 * @param effort Effort score (1-10)
 * @param priority Priority level string
 * @returns Priority score for sorting
 */
function calculatePriorityScore(impact: number, effort: number, priority: string): number {
  // Base score is impact/effort ratio (higher is better)
  let score = impact / Math.max(1, effort) * 10;
  
  // Apply priority multiplier
  const priorityMultiplier = {
    'critical': 2.0,
    'high': 1.5,
    'medium': 1.0,
    'low': 0.5
  };
  
  score *= priorityMultiplier[priority.toLowerCase() as keyof typeof priorityMultiplier] || 1.0;
  
  return parseFloat(score.toFixed(2));
}
