import { initiateScan, processScan, getScanResult } from '@/services/scanService';
import { supabase } from '@/lib/supabase';
import { runLighthouseAudit } from '@/services/lighthouseService';
import { runAxeAudit } from '@/services/axeService';
import { checkSecurityHeaders } from '@/services/securityHeadersService';
import { generateRecommendation } from '@/services/openaiService';
import { checkAlertsForScan, sendAlertNotifications } from '@/services/alertService';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

jest.mock('@/services/lighthouseService', () => ({
  runLighthouseAudit: jest.fn(),
}));

jest.mock('@/services/axeService', () => ({
  runAxeAudit: jest.fn(),
}));

jest.mock('@/services/securityHeadersService', () => ({
  checkSecurityHeaders: jest.fn(),
}));

jest.mock('@/services/openaiService', () => ({
  generateRecommendation: jest.fn(),
}));

jest.mock('@/services/alertService', () => ({
  checkAlertsForScan: jest.fn(),
  sendAlertNotifications: jest.fn(),
}));

describe('Scan Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateScan', () => {
    it('should create a new website if it does not exist', async () => {
      // Mock Supabase responses
      const mockFromSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Website not found' },
        }),
      };

      const mockFromInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'website-123' },
          error: null,
        }),
      };

      const mockFromInsertScan = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'scan-123' },
          error: null,
        }),
      };

      // Set up the mock chain
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => mockFromSelect)
        .mockImplementationOnce(() => mockFromInsert)
        .mockImplementationOnce(() => mockFromInsertScan);

      // Call the function
      const scanId = await initiateScan('https://example.com', 'user-123');

      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('websites');
      expect(mockFromSelect.select).toHaveBeenCalledWith('id');
      expect(mockFromSelect.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockFromSelect.eq).toHaveBeenCalledWith('url', 'https://example.com');

      expect(supabase.from).toHaveBeenCalledWith('websites');
      expect(mockFromInsert.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        url: 'https://example.com',
        name: 'example.com',
        is_active: true,
      });

      expect(supabase.from).toHaveBeenCalledWith('scans');
      expect(mockFromInsertScan.insert).toHaveBeenCalledWith({
        website_id: 'website-123',
        status: 'pending',
      });

      expect(scanId).toBe('scan-123');
    });

    it('should use existing website if it exists', async () => {
      // Mock Supabase responses
      const mockFromSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'website-123' },
          error: null,
        }),
      };

      const mockFromInsertScan = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'scan-123' },
          error: null,
        }),
      };

      // Set up the mock chain
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => mockFromSelect)
        .mockImplementationOnce(() => mockFromInsertScan);

      // Call the function
      const scanId = await initiateScan('https://example.com', 'user-123');

      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('websites');
      expect(mockFromSelect.select).toHaveBeenCalledWith('id');
      expect(mockFromSelect.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockFromSelect.eq).toHaveBeenCalledWith('url', 'https://example.com');

      expect(supabase.from).toHaveBeenCalledWith('scans');
      expect(mockFromInsertScan.insert).toHaveBeenCalledWith({
        website_id: 'website-123',
        status: 'pending',
      });

      expect(scanId).toBe('scan-123');
    });

    it('should throw an error if website creation fails', async () => {
      // Mock Supabase responses
      const mockFromSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Website not found' },
        }),
      };

      const mockFromInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to create website' },
        }),
      };

      // Set up the mock chain
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => mockFromSelect)
        .mockImplementationOnce(() => mockFromInsert);

      // Call the function and expect it to throw
      await expect(initiateScan('https://example.com', 'user-123')).rejects.toThrow(
        'Failed to create website: Failed to create website'
      );
    });

    it('should throw an error if scan creation fails', async () => {
      // Mock Supabase responses
      const mockFromSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'website-123' },
          error: null,
        }),
      };

      const mockFromInsertScan = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to create scan' },
        }),
      };

      // Set up the mock chain
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => mockFromSelect)
        .mockImplementationOnce(() => mockFromInsertScan);

      // Call the function and expect it to throw
      await expect(initiateScan('https://example.com', 'user-123')).rejects.toThrow(
        'Failed to create scan: Failed to create scan'
      );
    });
  });

  describe('processScan', () => {
    it('should process a scan successfully', async () => {
      // Mock Supabase responses
      const mockFromSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'scan-123',
            website_id: 'website-123',
            websites: { url: 'https://example.com' },
          },
          error: null,
        }),
      };

      const mockFromUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      const mockFromInsertMetrics = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      const mockFromInsertIssues = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [
            { id: 'issue-1', title: 'Issue 1' },
            { id: 'issue-2', title: 'Issue 2' },
          ],
          error: null,
        }),
      };

      const mockFromSelectSubscription = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { plan_type: 'premium', status: 'active' },
          error: null,
        }),
      };

      // Set up the mock chain
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => mockFromSelect) // Get scan
        .mockImplementationOnce(() => mockFromUpdate) // Update scan to in-progress
        .mockImplementationOnce(() => mockFromInsertMetrics) // Store metrics
        .mockImplementationOnce(() => mockFromInsertIssues) // Store issues
        .mockImplementationOnce(() => mockFromSelectSubscription) // Check subscription
        .mockImplementationOnce(() => mockFromUpdate); // Update scan to completed

      // Mock auth.getUser
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      // Mock service responses
      (runLighthouseAudit as jest.Mock).mockResolvedValue({
        performance: {
          score: 0.85,
          metrics: {
            'First Contentful Paint': { value: 1500, unit: 'ms' },
            'Largest Contentful Paint': { value: 2000, unit: 'ms' },
          },
        },
        accessibility: {
          score: 0.9,
          issues: [
            {
              title: 'Accessibility Issue 1',
              description: 'Description 1',
              severity: 'medium',
            },
          ],
        },
        seo: {
          score: 0.95,
          issues: [],
        },
        bestPractices: {
          score: 0.8,
          issues: [],
        },
      });

      (runAxeAudit as jest.Mock).mockResolvedValue({
        score: 0.92,
        violations: [
          {
            id: 'Axe Issue 1',
            description: 'Axe Description 1',
            impact: 'serious',
          },
        ],
      });

      (checkSecurityHeaders as jest.Mock).mockResolvedValue({
        score: 0.75,
        grade: 'B',
        issues: [
          {
            title: 'Security Issue 1',
            description: 'Security Description 1',
            severity: 'high',
          },
        ],
      });

      // Mock alert checking
      (checkAlertsForScan as jest.Mock).mockResolvedValue([]);

      // Call the function
      const result = await processScan('scan-123');

      // Assertions
      expect(result).toEqual({
        id: 'scan-123',
        url: 'https://example.com',
        status: 'completed',
        performance: {
          score: 0.85,
          metrics: {
            'First Contentful Paint': { value: 1500, unit: 'ms' },
            'Largest Contentful Paint': { value: 2000, unit: 'ms' },
          },
        },
        accessibility: {
          score: 0.92,
          issues: [
            {
              title: 'Axe Issue 1',
              description: 'Axe Description 1',
              severity: 'high',
            },
          ],
        },
        seo: {
          score: 0.95,
          issues: [],
        },
        bestPractices: {
          score: 0.8,
          issues: [],
        },
        security: {
          score: 0.75,
          grade: 'B',
          issues: [
            {
              title: 'Security Issue 1',
              description: 'Security Description 1',
              severity: 'high',
            },
          ],
        },
        recommendations: [],
      });
    });

    it('should handle errors during scan processing', async () => {
      // Mock Supabase responses
      const mockFromSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Scan not found' },
        }),
      };

      const mockFromUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      // Set up the mock chain
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => mockFromSelect) // Get scan fails
        .mockImplementationOnce(() => mockFromUpdate); // Update scan to failed

      // Call the function
      const result = await processScan('scan-123');

      // Assertions
      expect(result).toEqual({
        id: 'scan-123',
        url: '',
        status: 'failed',
        error: 'Failed to get scan: Scan not found',
      });
    });
  });
});
