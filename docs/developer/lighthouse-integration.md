# Lighthouse Integration

This document provides detailed information about the Lighthouse integration architecture in WebVital AI.

## Overview

WebVital AI uses a specialized architecture for Lighthouse integration to overcome ESM compatibility challenges with Next.js. The solution involves:

1. A separate ESM script (`scripts/run-lighthouse.js`) to run Lighthouse in a dedicated process
2. Both ES module (`lighthouse-wrapper.js`) and CommonJS (`lighthouse-wrapper.cjs`) wrappers to bridge between Next.js and the ESM module
3. Proper error handling and path resolution
4. File-based communication between processes

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Application                        │
│  (CommonJS environment)                                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Imports via CJS wrapper
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               lighthouse-wrapper.cjs                        │
│  (CommonJS wrapper that spawns a separate process)          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Spawns Node.js process
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               run-lighthouse.js                             │
│  (ESM script that runs Lighthouse)                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Writes results to temp file
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Temporary JSON File                           │
│  (File-based communication channel)                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Read by lighthouseService
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               lighthouseService.ts                          │
│  (Processes and normalizes results)                         │
└─────────────────────────────────────────────────────────────┘
```

## Why This Approach Was Necessary

This architecture was implemented to solve compatibility issues between:

1. **Lighthouse** - Which requires ESM modules and uses `import.meta.url` for path resolution
2. **Next.js** - Which uses CommonJS by default and doesn't support `import.meta.url`

The key challenges that needed to be addressed:

- Lighthouse is an ESM module that uses `import.meta.url` for path resolution
- Next.js uses CommonJS modules by default
- Direct imports of ESM modules in CommonJS code can cause compatibility issues
- The `import.meta.url` feature is not available in CommonJS modules

## Code Structure and Implementation

### 1. run-lighthouse.js

This is a pure ESM script that:

- Uses ES module syntax (`import` statements)
- Uses `import.meta.url` for path resolution
- Dynamically imports Lighthouse and chrome-launcher
- Runs Lighthouse audits in a separate process
- Writes results to a temporary JSON file
- Handles errors and process exit codes

Key implementation details:
- The script accepts URL and output path as command-line arguments
- It validates inputs before proceeding
- It uses dynamic imports to load Lighthouse and chrome-launcher
- It launches Chrome in headless mode
- It writes the Lighthouse results to the specified output file
- It handles errors and ensures Chrome is always killed

### 2. lighthouse-wrapper.js

This is an ES module wrapper that:

- Uses ES module syntax (`import` statements)
- Uses `import.meta.url` for path resolution
- Spawns a child process to run the `run-lighthouse.js` script
- Provides a Promise-based API for running Lighthouse audits
- Handles process events and errors

Key implementation details:
- It resolves the path to the `run-lighthouse.js` script using ES module path resolution
- It spawns a Node.js child process to run the script
- It handles process events (close, error) and resolves/rejects the Promise accordingly
- It provides a clean API for other ES modules to use

### 3. lighthouse-wrapper.cjs

This is a CommonJS wrapper that:

- Uses CommonJS syntax (`require` statements)
- Uses Node.js path resolution
- Spawns a child process to run the `run-lighthouse.js` script
- Provides a Promise-based API for running Lighthouse audits
- Handles process events and errors

Key implementation details:
- It resolves the path to the `run-lighthouse.js` script using CommonJS path resolution
- It spawns a Node.js child process to run the script
- It handles process events (close, error) and resolves/rejects the Promise accordingly
- It provides a clean API for CommonJS modules to use

### 4. lighthouseService.ts

This service:

- Imports the CommonJS wrapper (`lighthouse-wrapper.cjs`)
- Creates a temporary file for results
- Calls the wrapper function to run Lighthouse
- Reads and parses the results from the temporary file
- Transforms the raw Lighthouse data into a normalized format
- Handles errors and cleans up temporary files

Key implementation details:
- It creates a temporary file using `os.tmpdir()`
- It calls the wrapper function with the URL and output path
- It reads and parses the JSON results
- It extracts performance metrics, accessibility issues, SEO issues, and best practices issues
- It transforms the data into a normalized format for the application
- It cleans up the temporary file after processing

## File-Based Communication

The architecture uses file-based communication between processes:

1. The main application calls `lighthouseService.ts`
2. `lighthouseService.ts` creates a temporary file and calls the wrapper
3. The wrapper spawns a child process to run `run-lighthouse.js`
4. `run-lighthouse.js` runs Lighthouse and writes results to the temporary file
5. `lighthouseService.ts` reads the results from the temporary file
6. The temporary file is deleted after processing

This approach avoids direct module dependencies between ESM and CommonJS code.

## Error Handling

Error handling is implemented at multiple levels:

1. **run-lighthouse.js**:
   - Validates input arguments
   - Handles import errors
   - Handles Lighthouse audit errors
   - Ensures Chrome is always killed
   - Sets appropriate exit codes

2. **Wrapper modules**:
   - Handle child process events
   - Provide Promise-based error handling
   - Propagate error messages from the child process

3. **lighthouseService.ts**:
   - Handles file system errors
   - Handles JSON parsing errors
   - Handles wrapper function errors
   - Ensures temporary files are cleaned up

## Developer Guidelines

When working with the Lighthouse integration:

1. **Do not** directly import Lighthouse in the Next.js application code
2. **Do** use the provided wrapper functions in `lighthouseService.ts`
3. **Do** ensure proper error handling for process spawning and file operations
4. **Be aware** of the temporary file usage for passing results between processes
5. **Consider** the performance implications of spawning separate processes

## Troubleshooting

Common issues and solutions:

1. **"Cannot find module" errors**:
   - Ensure the Lighthouse dependencies are installed in the scripts directory
   - Run `cd scripts && npm install` to install the required dependencies

2. **Path resolution errors**:
   - Check that the path resolution in the wrapper modules is correct
   - Ensure the `run-lighthouse.js` script is executable

3. **Chrome launch failures**:
   - Ensure Chrome is installed on the system
   - Check for Chrome sandbox issues in containerized environments
   - Try adding additional Chrome flags for troubleshooting

4. **Temporary file errors**:
   - Check file system permissions
   - Ensure the temporary directory is writable
   - Check for disk space issues

## Future Improvements

Potential improvements to consider:

1. **WebSocket communication**: Replace file-based communication with WebSocket for better performance
2. **Worker threads**: Use worker threads instead of child processes for better resource utilization
3. **Result caching**: Implement caching of Lighthouse results to reduce redundant audits
4. **Parallel audits**: Support running multiple Lighthouse audits in parallel
5. **Containerization**: Run Lighthouse in a dedicated container for better isolation