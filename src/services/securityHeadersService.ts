import fetch from 'node-fetch';

export interface SecurityHeadersResult {
  score: number;
  grade: string;
  headers: {
    [key: string]: {
      present: boolean;
      value?: string;
      status: 'good' | 'warning' | 'bad';
      description: string;
    };
  };
  issues: Array<{
    title: string;
    description: string;
    severity: string;
  }>;
}

/**
 * Run a security headers check on a URL
 * @param url The URL to check
 * @returns The security headers check results
 */
export async function checkSecurityHeaders(url: string): Promise<SecurityHeadersResult> {
  try {
    // Make a request to the URL to check its headers
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'WebVitalAI Security Scanner',
      },
    });

    // Get the headers from the response
    const headers = response.headers;
    
    // Define the security headers we want to check
    const securityHeaders: {
      [key: string]: {
        present: boolean;
        value?: string;
        status: 'good' | 'warning' | 'bad';
        description: string;
      };
    } = {
      'Strict-Transport-Security': {
        present: headers.has('strict-transport-security'),
        value: headers.get('strict-transport-security') || undefined,
        status: 'bad',
        description: 'HTTP Strict Transport Security (HSTS) enforces secure (HTTPS) connections to the server',
      },
      'Content-Security-Policy': {
        present: headers.has('content-security-policy'),
        value: headers.get('content-security-policy') || undefined,
        status: 'bad',
        description: 'Content Security Policy (CSP) helps prevent XSS attacks by specifying which dynamic resources are allowed to load',
      },
      'X-Content-Type-Options': {
        present: headers.has('x-content-type-options'),
        value: headers.get('x-content-type-options') || undefined,
        status: 'bad',
        description: 'X-Content-Type-Options prevents MIME type sniffing',
      },
      'X-Frame-Options': {
        present: headers.has('x-frame-options'),
        value: headers.get('x-frame-options') || undefined,
        status: 'bad',
        description: 'X-Frame-Options protects against clickjacking attacks',
      },
      'X-XSS-Protection': {
        present: headers.has('x-xss-protection'),
        value: headers.get('x-xss-protection') || undefined,
        status: 'bad',
        description: 'X-XSS-Protection stops pages from loading when they detect reflected XSS attacks',
      },
      'Referrer-Policy': {
        present: headers.has('referrer-policy'),
        value: headers.get('referrer-policy') || undefined,
        status: 'bad',
        description: 'Referrer Policy controls how much referrer information should be included with requests',
      },
      'Permissions-Policy': {
        present: headers.has('permissions-policy'),
        value: headers.get('permissions-policy') || undefined,
        status: 'bad',
        description: 'Permissions Policy allows a site to control which features and APIs can be used in the browser',
      },
    };

    // Evaluate each header
    for (const [header, data] of Object.entries(securityHeaders)) {
      if (data.present) {
        // Check if the header value is appropriate
        switch (header) {
          case 'Strict-Transport-Security':
            if (data.value && data.value.includes('max-age=') && !data.value.includes('max-age=0')) {
              data.status = 'good';
            } else {
              data.status = 'warning';
            }
            break;
          case 'Content-Security-Policy':
            if (data.value && data.value.length > 0) {
              data.status = 'good';
            } else {
              data.status = 'warning';
            }
            break;
          case 'X-Content-Type-Options':
            if (data.value === 'nosniff') {
              data.status = 'good';
            } else {
              data.status = 'warning';
            }
            break;
          case 'X-Frame-Options':
            if (data.value === 'DENY' || data.value === 'SAMEORIGIN') {
              data.status = 'good';
            } else {
              data.status = 'warning';
            }
            break;
          case 'X-XSS-Protection':
            if (data.value === '1; mode=block') {
              data.status = 'good';
            } else {
              data.status = 'warning';
            }
            break;
          case 'Referrer-Policy':
            if (data.value && data.value.length > 0) {
              data.status = 'good';
            } else {
              data.status = 'warning';
            }
            break;
          case 'Permissions-Policy':
            if (data.value && data.value.length > 0) {
              data.status = 'good';
            } else {
              data.status = 'warning';
            }
            break;
        }
      }
    }

    // Calculate score based on header presence and status
    let score = 0;
    const headerCount = Object.keys(securityHeaders).length;
    
    for (const data of Object.values(securityHeaders)) {
      if (data.status === 'good') {
        score += 1;
      } else if (data.status === 'warning') {
        score += 0.5;
      }
    }
    
    // Convert to a 0-100 scale
    score = Math.round((score / headerCount) * 100);
    
    // Determine grade based on score
    let grade = 'F';
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 50) grade = 'D';
    
    // Generate issues list
    const issues = [];
    
    for (const [header, data] of Object.entries(securityHeaders)) {
      if (data.status !== 'good') {
        issues.push({
          title: `Missing or improper ${header} header`,
          description: data.present 
            ? `The ${header} header is present but not properly configured: ${data.value}` 
            : `The ${header} header is missing. ${data.description}`,
          severity: data.status === 'warning' ? 'medium' : 'high',
        });
      }
    }
    
    return {
      score,
      grade,
      headers: securityHeaders,
      issues,
    };
  } catch (error) {
    console.error('Error checking security headers:', error);
    throw new Error('Failed to check security headers');
  }
}