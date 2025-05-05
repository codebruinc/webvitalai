'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function UrlForm() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic URL validation
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = `https://${url}`;
    }

    try {
      // Validate URL format
      new URL(formattedUrl);
    } catch (err) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);

    try {
      // Send the URL to the API for scanning
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formattedUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate scan');
      }

      // Redirect to the dashboard with the scan ID
      router.push(`/dashboard?scan=${data.data.scan_id}`);
    } catch (error: any) {
      console.error('URL form submission error:', error);
      
      // Extract error message with fallback
      let errorMessage = 'An error occurred while analyzing the URL';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response && error.response.data && error.response.data.error) {
        // Handle structured API error responses
        errorMessage = error.response.data.error;
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        {error && (
          <div className="absolute -top-10 left-0 right-0 text-sm text-red-600 bg-red-50 p-2 rounded-md">
            {error}
          </div>
        )}
        <div className="flex rounded-md shadow-sm">
          <input
            type="text"
            name="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="block w-full rounded-l-md border-0 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            placeholder="Enter your website URL"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="relative inline-flex items-center gap-x-1.5 rounded-r-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}