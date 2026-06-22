// Typed error classes for the API client.
// Catch blocks in App.tsx use instanceof checks to decide what message to show.

// Thrown when fetch() itself rejects — backend is unreachable or offline.
export class NetworkError extends Error {
  constructor() {
    super('Cannot reach the server. Check your connection and try again.')
    this.name = 'NetworkError'
  }
}

// Thrown when the backend responds with a non-2xx status.
// `message` carries the backend's own error string when available.
// `code` mirrors the backend's `code` field (e.g. "NOT_FOUND", "VALIDATION_ERROR").
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
