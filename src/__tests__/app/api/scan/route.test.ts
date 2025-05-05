// Import the handlers but not the Next.js imports directly
import * as scanRouteModule from '@/app/api/scan/route';
import { initiateScan } from '@/services/scanService';
import { queueScan } from '@/services/queueService';

// Mock the Next.js imports
jest.mock('next/server', () => {
  return {
    NextRequest: jest.fn().mockImplementation((url) => ({
      url,
      json: jest.fn(),
    })),
    NextResponse: {
      json: jest.fn().mockImplementation((data, options) => ({
        status: options?.status || 200,
        json: async () => data,
      })),
    },
  };
});

// Mock dependencies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@/services/scanService', () => ({
  initiateScan: jest.fn(),
}));

jest.mock('@/services/queueService', () => ({
  queueScan: jest.fn(),
}));

describe('Scan API Route', () => {
  let mockSupabaseClient: any;
  let mockRequest: any;
  let mockSession: any;
  let POST: any;
  let GET: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the handlers from the module
    POST = scanRouteModule.POST;
    GET = scanRouteModule.GET;

    // Mock Supabase client
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    const createRouteHandlerClient = require('@supabase/auth-helpers-nextjs').createRouteHandlerClient;
    createRouteHandlerClient.mockReturnValue(mockSupabaseClient);

    // Mock session
    mockSession = {
      user: {
        id: 'user-123',
      },
    };

    // Mock request
    mockRequest = {
      json: jest.fn(),
      url: 'https://example.com/api/scan',
    };
  });

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      // Call the function
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if URL is missing', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      // Mock request body with missing URL
      mockRequest.json.mockResolvedValue({});

      // Call the function
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'URL is required' });
    });

    it('should return 400 if URL is invalid', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      // Mock request body with invalid URL
      mockRequest.json.mockResolvedValue({ url: 'invalid-url' });

      // Call the function
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Invalid URL format' });
    });

    it('should initiate and queue a scan successfully', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      // Mock request body with valid URL
      mockRequest.json.mockResolvedValue({ url: 'https://example.com' });

      // Mock initiateScan and queueScan
      (initiateScan as jest.Mock).mockResolvedValue('scan-123');
      (queueScan as jest.Mock).mockResolvedValue(undefined);

      // Call the function
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(initiateScan).toHaveBeenCalledWith('https://example.com', 'user-123', mockSupabaseClient);
      expect(queueScan).toHaveBeenCalledWith('scan-123');
      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        message: 'Scan initiated',
        data: {
          scan_id: 'scan-123',
        },
      });
    });

    it('should handle errors during scan initiation', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      // Mock request body with valid URL
      mockRequest.json.mockResolvedValue({ url: 'https://example.com' });

      // Mock initiateScan to throw an error
      (initiateScan as jest.Mock).mockRejectedValue(new Error('Failed to initiate scan'));

      // Call the function
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to initiate scan' });
    });
  });

  describe('GET', () => {
    beforeEach(() => {
      // Add URL search params mock
      mockRequest.url = 'https://example.com/api/scan?id=scan-123';
    });

    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      // Call the function
      const response = await GET(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if scan ID is missing', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      // Mock request without scan ID
      mockRequest.url = 'https://example.com/api/scan';

      // Call the function
      const response = await GET(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Scan ID is required' });
    });

    it('should return 404 if scan is not found', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      // Mock Supabase response for scan not found
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Scan not found' },
        }),
      });

      // Call the function
      const response = await GET(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Scan not found' });
    });

    it('should return 403 if user does not own the website', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      // Mock Supabase response for scan found but owned by different user
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'scan-123',
            status: 'completed',
            error: null,
            completed_at: '2025-05-04T12:00:00Z',
            website_id: 'website-123',
            websites: { user_id: 'different-user-id' },
          },
          error: null,
        }),
      });

      // Call the function
      const response = await GET(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(responseData).toEqual({ error: 'Unauthorized' });
    });

    it('should return scan data if user owns the website', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      // Mock Supabase response for scan found and owned by user
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'scan-123',
            status: 'completed',
            error: null,
            completed_at: '2025-05-04T12:00:00Z',
            website_id: 'website-123',
            websites: { user_id: 'user-123' },
          },
          error: null,
        }),
      });

      // Call the function
      const response = await GET(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        data: {
          id: 'scan-123',
          status: 'completed',
          error: null,
          completed_at: '2025-05-04T12:00:00Z',
          website_id: 'website-123',
        },
      });
    });

    it('should handle errors during scan retrieval', async () => {
      // Mock authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      // Mock Supabase to throw an error
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database error');
      });

      // Call the function
      const response = await GET(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Database error' });
    });
  });
});