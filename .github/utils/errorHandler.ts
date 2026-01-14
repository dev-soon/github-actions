import { error as logError, warning, info } from "@actions/core";

export interface ApiError {
  status: number;
  message: string;
  endpoint?: string;
  details?: string;
}

/**
 * Handles API errors and provides user-friendly error messages
 */
export function handleApiError(err: unknown, endpoint?: string): never {
  const apiError = parseError(err, endpoint);

  // Log the error with details
  logApiError(apiError);

  // Throw user-friendly error message
  throw new Error(getUserFriendlyMessage(apiError));
}

/**
 * Parses an error object into a structured ApiError
 */
function parseError(err: unknown, endpoint?: string): ApiError {
  if (err && typeof err === 'object') {
    const error = err as any;

    // Handle GitHub API errors (from @octokit)
    if (error.status) {
      return {
        status: error.status,
        message: error.message || 'Unknown error',
        endpoint,
        details: error.response?.data?.message || error.message
      };
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return {
        status: 500,
        message: error.message,
        endpoint,
        details: error.stack
      };
    }
  }

  // Fallback for unknown error types
  return {
    status: 500,
    message: 'An unknown error occurred',
    endpoint
  };
}

/**
 * Generates user-friendly error messages based on HTTP status codes
 */
function getUserFriendlyMessage(apiError: ApiError): string {
  const { status, message, endpoint } = apiError;
  const endpointInfo = endpoint ? ` (${endpoint})` : '';

  // 4xx Client Errors
  if (status >= 400 && status < 500) {
    switch (status) {
      case 401:
        return `Authentication failed${endpointInfo}. Please check your GitHub token permissions.`;
      case 403:
        return `Access denied${endpointInfo}. You don't have permission to access this resource. Check your token scopes and repository permissions.`;
      case 404:
        return `Resource not found${endpointInfo}. The requested team or organization may not exist or you don't have access to it.`;
      case 422:
        return `Invalid request${endpointInfo}. ${message}`;
      case 429:
        return `Rate limit exceeded${endpointInfo}. Please wait before making more requests.`;
      default:
        return `Request failed${endpointInfo}: ${message}`;
    }
  }

  // 5xx Server Errors
  if (status >= 500 && status < 600) {
    switch (status) {
      case 500:
        return `GitHub server error${endpointInfo}. Please try again later.`;
      case 502:
      case 503:
        return `GitHub service temporarily unavailable${endpointInfo}. Please try again later.`;
      case 504:
        return `Request timeout${endpointInfo}. The server took too long to respond.`;
      default:
        return `Server error${endpointInfo}: ${message}`;
    }
  }

  // Other errors
  return `An error occurred${endpointInfo}: ${message}`;
}

/**
 * Logs API errors with appropriate severity levels
 */
function logApiError(apiError: ApiError): void {
  const { status, message, endpoint, details } = apiError;
  const endpointInfo = endpoint ? ` [${endpoint}]` : '';

  // Log based on error severity
  if (status >= 500) {
    // Server errors - these are not our fault
    logError(`API Server Error (${status})${endpointInfo}: ${message}`);
    if (details) {
      info(`Error details: ${details}`);
    }
  } else if (status >= 400) {
    // Client errors - these might be configuration issues
    if (status === 401 || status === 403) {
      logError(`API Authorization Error (${status})${endpointInfo}: ${message}`);
      info('Hint: Check your GitHub token and permissions');
    } else if (status === 404) {
      warning(`API Resource Not Found (${status})${endpointInfo}: ${message}`);
    } else if (status === 429) {
      warning(`API Rate Limit Exceeded (${status})${endpointInfo}: ${message}`);
      info('Consider reducing request frequency or using a token with higher rate limits');
    } else {
      logError(`API Client Error (${status})${endpointInfo}: ${message}`);
    }

    if (details && details !== message) {
      info(`Error details: ${details}`);
    }
  } else {
    // Unknown status
    logError(`API Error${endpointInfo}: ${message}`);
    if (details) {
      info(`Error details: ${details}`);
    }
  }
}

/**
 * Wraps an async API call with error handling
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  endpoint?: string
): Promise<T> {
  try {
    return await apiCall();
  } catch (err) {
    handleApiError(err, endpoint);
  }
}
