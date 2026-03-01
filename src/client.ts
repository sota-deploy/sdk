/**
 * Main client class for the sota.io API.
 *
 * @example
 * ```typescript
 * import { SotaClient } from '@sota-io/sdk';
 *
 * const sota = new SotaClient({ apiKey: 'sota_your_api_key' });
 * const projects = await sota.listProjects();
 * ```
 */

import type {
  SotaClientOptions,
  Project,
  Deployment,
  EnvVar,
  DataResponse,
  ListResponse,
  APIErrorBody,
  CreateProjectOptions,
  SetEnvVarOptions,
  ListOptions,
  Pagination,
} from './types.js';
import { SotaAPIError } from './errors.js';

const DEFAULT_BASE_URL = 'https://api.sota.io';

export class SotaClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  /**
   * Create a new SotaClient.
   *
   * @param options - Client configuration. `apiKey` is required.
   */
  constructor(options: SotaClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Generic JSON request helper. Handles auth headers, JSON serialization,
   * and error mapping.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorBody: APIErrorBody | undefined;
      try {
        errorBody = (await response.json()) as APIErrorBody;
      } catch {
        // response body may not be JSON
      }
      throw new SotaAPIError(
        response.status,
        errorBody?.error?.code ?? 'unknown',
        errorBody?.error?.message ?? response.statusText,
      );
    }

    // Handle 204 No Content (DELETE responses)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  // -------------------------------------------------------------------------
  // Projects
  // -------------------------------------------------------------------------

  /**
   * List all projects for the authenticated user.
   *
   * @param options - Optional pagination parameters.
   * @returns An object containing the projects array and optional pagination metadata.
   */
  async listProjects(
    options?: ListOptions,
  ): Promise<{ projects: Project[]; pagination?: Pagination }> {
    const params = new URLSearchParams();
    if (options?.cursor) params.set('cursor', options.cursor);
    if (options?.limit) params.set('limit', String(options.limit));
    const qs = params.toString();
    const path = `/v1/projects${qs ? `?${qs}` : ''}`;

    const resp = await this.request<ListResponse<Project>>('GET', path);
    return { projects: resp.data, pagination: resp.pagination };
  }

  /**
   * Create a new project.
   *
   * @param options - Project creation options. `name` is required; `slug` is auto-generated if omitted.
   * @returns The created project.
   */
  async createProject(options: CreateProjectOptions): Promise<Project> {
    const resp = await this.request<DataResponse<Project>>(
      'POST',
      '/v1/projects',
      options,
    );
    return resp.data;
  }

  /**
   * Get a project by ID.
   *
   * @param projectId - The project UUID.
   * @returns The project details.
   */
  async getProject(projectId: string): Promise<Project> {
    const resp = await this.request<DataResponse<Project>>(
      'GET',
      `/v1/projects/${projectId}`,
    );
    return resp.data;
  }

  /**
   * Delete a project.
   *
   * @param projectId - The project UUID.
   */
  async deleteProject(projectId: string): Promise<void> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
    };
    const response = await fetch(
      `${this.baseUrl}/v1/projects/${projectId}`,
      { method: 'DELETE', headers },
    );
    if (!response.ok) {
      let errorBody: APIErrorBody | undefined;
      try {
        errorBody = (await response.json()) as APIErrorBody;
      } catch {
        // body may not be JSON
      }
      throw new SotaAPIError(
        response.status,
        errorBody?.error?.code ?? 'unknown',
        errorBody?.error?.message ?? response.statusText,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Deployments
  // -------------------------------------------------------------------------

  /**
   * Deploy a project from a tar.gz archive.
   *
   * @param projectId - The project UUID.
   * @param archive - The tar.gz archive as a `Buffer` or `Uint8Array`.
   * @returns The created deployment.
   */
  async deploy(
    projectId: string,
    archive: Buffer | Uint8Array,
  ): Promise<Deployment> {
    const boundary = '----SotaSDKBoundary' + Date.now();
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    };

    // Build multipart body manually (no external dependency needed)
    const preamble = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="archive"; filename="archive.tar.gz"\r\n`,
      `Content-Type: application/gzip\r\n`,
      `\r\n`,
    ].join('');

    const epilogue = `\r\n--${boundary}--\r\n`;

    const encoder = new TextEncoder();
    const prefixBytes = encoder.encode(preamble);
    const suffixBytes = encoder.encode(epilogue);
    const archiveBytes =
      archive instanceof Uint8Array ? archive : new Uint8Array(archive);

    // Concatenate into a single Uint8Array
    const body = new Uint8Array(
      prefixBytes.length + archiveBytes.length + suffixBytes.length,
    );
    body.set(prefixBytes, 0);
    body.set(archiveBytes, prefixBytes.length);
    body.set(suffixBytes, prefixBytes.length + archiveBytes.length);

    const response = await fetch(
      `${this.baseUrl}/v1/projects/${projectId}/deploy`,
      { method: 'POST', headers, body },
    );

    if (!response.ok) {
      let errorBody: APIErrorBody | undefined;
      try {
        errorBody = (await response.json()) as APIErrorBody;
      } catch {
        // body may not be JSON
      }
      throw new SotaAPIError(
        response.status,
        errorBody?.error?.code ?? 'unknown',
        errorBody?.error?.message ?? response.statusText,
      );
    }

    const resp = (await response.json()) as DataResponse<Deployment>;
    return resp.data;
  }

  /**
   * List all deployments for a project.
   *
   * @param projectId - The project UUID.
   * @returns An array of deployments, most recent first.
   */
  async listDeployments(projectId: string): Promise<Deployment[]> {
    const resp = await this.request<ListResponse<Deployment>>(
      'GET',
      `/v1/projects/${projectId}/deployments`,
    );
    return resp.data;
  }

  /**
   * Get build/runtime logs for a specific deployment.
   *
   * @param projectId - The project UUID.
   * @param deploymentId - The deployment UUID.
   * @returns The raw log text.
   */
  async getLogs(projectId: string, deploymentId: string): Promise<string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
    };

    const response = await fetch(
      `${this.baseUrl}/v1/projects/${projectId}/deployments/${deploymentId}/logs`,
      { headers },
    );

    if (!response.ok) {
      let errorBody: APIErrorBody | undefined;
      try {
        errorBody = (await response.json()) as APIErrorBody;
      } catch {
        // body may not be JSON
      }
      throw new SotaAPIError(
        response.status,
        errorBody?.error?.code ?? 'unknown',
        errorBody?.error?.message ?? response.statusText,
      );
    }

    return response.text();
  }

  /**
   * Rollback to the previous deployment.
   *
   * @param projectId - The project UUID.
   * @returns The restored deployment.
   */
  async rollback(projectId: string): Promise<Deployment> {
    const resp = await this.request<DataResponse<Deployment>>(
      'POST',
      `/v1/projects/${projectId}/rollback`,
    );
    return resp.data;
  }

  /**
   * Redeploy the latest deployment.
   *
   * @param projectId - The project UUID.
   * @returns The new deployment.
   */
  async redeploy(projectId: string): Promise<Deployment> {
    const resp = await this.request<DataResponse<Deployment>>(
      'POST',
      `/v1/projects/${projectId}/redeploy`,
    );
    return resp.data;
  }

  // -------------------------------------------------------------------------
  // Environment Variables
  // -------------------------------------------------------------------------

  /**
   * List all environment variables for a project.
   *
   * @param projectId - The project UUID.
   * @returns An array of environment variables.
   */
  async listEnvVars(projectId: string): Promise<EnvVar[]> {
    const resp = await this.request<DataResponse<EnvVar[]>>(
      'GET',
      `/v1/projects/${projectId}/envs`,
    );
    return resp.data;
  }

  /**
   * Set an environment variable on a project.
   *
   * Creates the variable if it doesn't exist, or updates it if it does.
   *
   * @param projectId - The project UUID.
   * @param options - The key/value pair to set.
   */
  async setEnvVar(
    projectId: string,
    options: SetEnvVarOptions,
  ): Promise<void> {
    await this.request(
      'POST',
      `/v1/projects/${projectId}/envs`,
      options,
    );
  }

  /**
   * Delete an environment variable from a project.
   *
   * @param projectId - The project UUID.
   * @param key - The variable name to delete.
   */
  async deleteEnvVar(projectId: string, key: string): Promise<void> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
    };
    const response = await fetch(
      `${this.baseUrl}/v1/projects/${projectId}/envs/${key}`,
      { method: 'DELETE', headers },
    );
    if (!response.ok) {
      let errorBody: APIErrorBody | undefined;
      try {
        errorBody = (await response.json()) as APIErrorBody;
      } catch {
        // body may not be JSON
      }
      throw new SotaAPIError(
        response.status,
        errorBody?.error?.code ?? 'unknown',
        errorBody?.error?.message ?? response.statusText,
      );
    }
  }
}
