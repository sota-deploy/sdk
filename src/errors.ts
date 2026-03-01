/**
 * Error classes for the sota.io SDK.
 */

/** Base error class for all SDK errors. */
export class SotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SotaError';
  }
}

/**
 * Thrown when the API returns a non-2xx response.
 *
 * Includes the HTTP status code and the machine-readable error code from the
 * API response body.
 */
export class SotaAPIError extends SotaError {
  /** HTTP status code (e.g. 400, 404, 500). */
  public readonly statusCode: number;
  /** Machine-readable error code from the API (e.g. `"not_found"`). */
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'SotaAPIError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
