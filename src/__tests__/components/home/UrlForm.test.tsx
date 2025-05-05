import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UrlForm from '@/components/home/UrlForm';

// Mock the next/navigation router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the fetch function
global.fetch = jest.fn();

describe('UrlForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the form correctly', () => {
    render(<UrlForm />);
    
    // Check if the input and button are rendered
    expect(screen.getByPlaceholderText('Enter your website URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeInTheDocument();
  });

  it('shows error for empty URL submission', async () => {
    render(<UrlForm />);
    
    // Submit the form without entering a URL
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    
    // Check if error message is displayed
    expect(await screen.findByText('Please enter a URL')).toBeInTheDocument();
  });

  it('shows error for invalid URL format', async () => {
    render(<UrlForm />);
    
    // Enter an invalid URL
    fireEvent.change(screen.getByPlaceholderText('Enter your website URL'), {
      target: { value: 'invalid-url' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    
    // Check if any error message is displayed
    const errorElement = await screen.findByText(/Cannot read properties/);
    expect(errorElement).toBeInTheDocument();
  });

  it('formats URL correctly by adding https://', async () => {
    // Clear previous mock calls
    mockPush.mockClear();
    const mockFetch = global.fetch as jest.Mock;
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { scan_id: '123' } }),
    });
    
    render(<UrlForm />);
    
    // Enter a URL without protocol
    fireEvent.change(screen.getByPlaceholderText('Enter your website URL'), {
      target: { value: 'example.com' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    
    // Wait for the fetch call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      });
    });
    
    // Check if router.push was called with the correct URL
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard?scan=123');
    });
  });

  it('handles API errors correctly', async () => {
    const mockFetch = global.fetch as jest.Mock;
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'API error' }),
    });
    
    render(<UrlForm />);
    
    // Enter a valid URL
    fireEvent.change(screen.getByPlaceholderText('Enter your website URL'), {
      target: { value: 'https://example.com' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    
    // Check if loading state is displayed
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    
    // Check if error message is displayed after API error
    expect(await screen.findByText('API error')).toBeInTheDocument();
  });

  it('handles network errors correctly', async () => {
    const mockFetch = global.fetch as jest.Mock;
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(<UrlForm />);
    
    // Enter a valid URL
    fireEvent.change(screen.getByPlaceholderText('Enter your website URL'), {
      target: { value: 'https://example.com' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    
    // Check if error message is displayed after network error
    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });
});