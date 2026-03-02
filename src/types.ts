/**
 * TypeScript type definitions for the sota.io API.
 */

// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

/** Options for constructing a {@link SotaClient}. */
export interface SotaClientOptions {
  /** sota.io API key (starts with `sota_`). */
  apiKey: string;
  /** API base URL. Defaults to `https://api.sota.io`. */
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

/** A sota.io project. */
export interface Project {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

/** A single deployment of a project. */
export interface Deployment {
  id: string;
  project_id: string;
  status: string;
  url?: string;
  image_tag?: string;
  build_method?: string;
  framework?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

/** An environment variable attached to a project. */
export interface EnvVar {
  id: string;
  project_id: string;
  key: string;
  value?: string;
  created_at: string;
  updated_at: string;
}

/** A custom domain attached to a project. */
export interface Domain {
  id: string;
  project_id: string;
  user_id: string;
  domain: string;
  status: string;
  dns_type: string;
  last_checked_at?: string;
  verified_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/** DNS record instructions for pointing a custom domain. */
export interface DNSInstructions {
  /** Record type: "A" for apex domains, "CNAME" for subdomains. */
  type: string;
  /** Record name: "@" for apex, or subdomain prefix (e.g., "app"). */
  name: string;
  /** Record value: IP address for A records, or "{slug}.sota.io" for CNAME. */
  value: string;
}

/** A domain with DNS setup instructions (returned by addDomain and getDomain). */
export interface DomainResponse {
  domain: Domain;
  dns_instructions?: DNSInstructions;
}

// ---------------------------------------------------------------------------
// API response envelopes
// ---------------------------------------------------------------------------

/** Envelope for single-item API responses. */
export interface DataResponse<T> {
  data: T;
}

/** Pagination metadata returned with list responses. */
export interface Pagination {
  next_cursor?: string;
  has_more: boolean;
}

/** Envelope for list API responses. */
export interface ListResponse<T> {
  data: T[];
  pagination?: Pagination;
}

/** Body returned by the API when an error occurs. */
export interface APIErrorBody {
  error: {
    code: string;
    message: string;
  };
}

// ---------------------------------------------------------------------------
// Method parameter types
// ---------------------------------------------------------------------------

/** Options for creating a new project. */
export interface CreateProjectOptions {
  /** Human-readable project name. */
  name: string;
  /** URL-safe slug (auto-generated from name if omitted). */
  slug?: string;
}

/** Options for setting an environment variable. */
export interface SetEnvVarOptions {
  /** Variable name. */
  key: string;
  /** Variable value. */
  value: string;
}

/** Options for list endpoints that support cursor-based pagination. */
export interface ListOptions {
  /** Cursor returned by a previous list call. */
  cursor?: string;
  /** Maximum number of items to return. */
  limit?: number;
}
