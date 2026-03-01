/**
 * @sota-io/sdk — TypeScript SDK for the sota.io deployment platform.
 *
 * @packageDocumentation
 */

export { SotaClient } from './client.js';
export { SotaError, SotaAPIError } from './errors.js';
export type {
  SotaClientOptions,
  Project,
  Deployment,
  EnvVar,
  DataResponse,
  ListResponse,
  Pagination,
  APIErrorBody,
  CreateProjectOptions,
  SetEnvVarOptions,
  ListOptions,
} from './types.js';
