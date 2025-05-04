import React from 'react';

interface LoadingStateProps {
  progress: number;
}

export default function LoadingState({ progress }: LoadingStateProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">Analyzing Website</h3>
        <p className="mt-1 text-sm text-gray-500">
          This may take a minute or two. We're checking performance, accessibility, SEO, and security.
        </p>
        
        <div className="mt-6">
          <div className="relative pt-1">
            <div className="mb-4 flex h-2 overflow-hidden rounded bg-gray-200 text-xs">
              <div
                style={{ width: `${progress}%` }}
                className="flex flex-col justify-center whitespace-nowrap bg-primary-600 text-center text-white shadow-none transition-all duration-500"
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="inline-block rounded-full bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-800">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              {progress < 100 ? (
                <div className="text-right">
                  <svg
                    className="ml-2 h-4 w-4 animate-spin text-primary-600"
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
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-md bg-gray-50 p-4">
            <div className="h-8 w-8 mx-auto mb-2 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="h-4 w-24 mx-auto rounded bg-gray-200 animate-pulse"></div>
          </div>
          <div className="rounded-md bg-gray-50 p-4">
            <div className="h-8 w-8 mx-auto mb-2 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="h-4 w-24 mx-auto rounded bg-gray-200 animate-pulse"></div>
          </div>
          <div className="rounded-md bg-gray-50 p-4">
            <div className="h-8 w-8 mx-auto mb-2 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="h-4 w-24 mx-auto rounded bg-gray-200 animate-pulse"></div>
          </div>
          <div className="rounded-md bg-gray-50 p-4">
            <div className="h-8 w-8 mx-auto mb-2 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="h-4 w-24 mx-auto rounded bg-gray-200 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}