# @sota-io/sdk

TypeScript SDK for the [sota.io](https://sota.io) deployment platform.
Deploy web apps, manage projects, and control deployments programmatically.

[![npm](https://img.shields.io/npm/v/@sota-io/sdk)](https://www.npmjs.com/package/@sota-io/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Installation

```bash
npm install @sota-io/sdk
```

## Quick Start

Deploy an app in 5 lines:

```typescript
import { SotaClient } from '@sota-io/sdk';
import { readFileSync } from 'fs';

const sota = new SotaClient({ apiKey: 'sota_your_api_key' });
const project = await sota.createProject({ name: 'my-app' });
const deployment = await sota.deploy(project.id, readFileSync('app.tar.gz'));
console.log(`Live at: ${deployment.url}`);
```

## Authentication

Get your API key from the [sota.io dashboard](https://sota.io/dashboard) or via the CLI:

```bash
sota auth set-key <your-api-key>
```

Create a client with your key:

```typescript
import { SotaClient } from '@sota-io/sdk';

const sota = new SotaClient({ apiKey: 'sota_your_api_key' });
```

For self-hosted or staging environments, pass a custom base URL:

```typescript
const sota = new SotaClient({
  apiKey: 'sota_your_api_key',
  baseUrl: 'https://api.staging.sota.io',
});
```

## API Reference

### Projects

### client.listProjects(options?)

List all projects for the authenticated user.

**Parameters:**
- `options.cursor` (string, optional) -- Pagination cursor from a previous response
- `options.limit` (number, optional) -- Maximum number of projects to return

**Returns:** `Promise<{ projects: Project[]; pagination?: Pagination }>`

**Example:**
```typescript
const { projects, pagination } = await sota.listProjects({ limit: 10 });
console.log(projects.map(p => p.name));

// Paginate
if (pagination?.has_more) {
  const next = await sota.listProjects({ cursor: pagination.next_cursor });
}
```

### client.createProject(options)

Create a new project. The slug is auto-generated from the name if not provided.

**Parameters:**
- `options.name` (string) -- Human-readable project name
- `options.slug` (string, optional) -- URL-safe slug (auto-generated if omitted)

**Returns:** `Promise<Project>`

**Example:**
```typescript
const project = await sota.createProject({ name: 'My Cool App' });
console.log(project.slug); // "my-cool-app"
console.log(project.id);   // UUID
```

### client.getProject(projectId)

Get a project by ID.

**Parameters:**
- `projectId` (string) -- The project UUID

**Returns:** `Promise<Project>`

**Example:**
```typescript
const project = await sota.getProject('abc-123-def');
console.log(project.name, project.slug);
```

### client.deleteProject(projectId)

Delete a project and all its deployments.

**Parameters:**
- `projectId` (string) -- The project UUID

**Returns:** `Promise<void>`

**Example:**
```typescript
await sota.deleteProject('abc-123-def');
```

### Deployments

### client.deploy(projectId, archive)

Deploy an app from a tar.gz archive. The archive should contain your application source code.

**Parameters:**
- `projectId` (string) -- The project UUID
- `archive` (Buffer | Uint8Array) -- The tar.gz archive

**Returns:** `Promise<Deployment>`

**Example:**
```typescript
import { readFileSync } from 'fs';

const archive = readFileSync('app.tar.gz');
const deployment = await sota.deploy(project.id, archive);
console.log(`Status: ${deployment.status}`);
console.log(`URL: ${deployment.url}`);
```

### client.listDeployments(projectId)

List all deployments for a project, most recent first.

**Parameters:**
- `projectId` (string) -- The project UUID

**Returns:** `Promise<Deployment[]>`

**Example:**
```typescript
const deployments = await sota.listDeployments(project.id);
const latest = deployments[0];
console.log(`Latest: ${latest.status} at ${latest.url}`);
```

### client.getLogs(projectId, deploymentId)

Get build and runtime logs for a specific deployment.

**Parameters:**
- `projectId` (string) -- The project UUID
- `deploymentId` (string) -- The deployment UUID

**Returns:** `Promise<string>` -- Raw log text

**Example:**
```typescript
const logs = await sota.getLogs(project.id, deployment.id);
console.log(logs);
```

### client.rollback(projectId)

Rollback to the previous deployment. Restores the prior container without rebuilding.

**Parameters:**
- `projectId` (string) -- The project UUID

**Returns:** `Promise<Deployment>`

**Example:**
```typescript
const restored = await sota.rollback(project.id);
console.log(`Rolled back to: ${restored.url}`);
```

### client.redeploy(projectId)

Redeploy the latest deployment. Rebuilds and deploys the most recent source.

**Parameters:**
- `projectId` (string) -- The project UUID

**Returns:** `Promise<Deployment>`

**Example:**
```typescript
const deployment = await sota.redeploy(project.id);
console.log(`Redeployed: ${deployment.status}`);
```

### Environment Variables

### client.listEnvVars(projectId)

List all environment variables for a project.

**Parameters:**
- `projectId` (string) -- The project UUID

**Returns:** `Promise<EnvVar[]>`

**Example:**
```typescript
const envVars = await sota.listEnvVars(project.id);
envVars.forEach(v => console.log(`${v.key}=${v.value}`));
```

### client.setEnvVar(projectId, options)

Set an environment variable. Creates it if new, updates it if it already exists.

**Parameters:**
- `projectId` (string) -- The project UUID
- `options.key` (string) -- Variable name
- `options.value` (string) -- Variable value

**Returns:** `Promise<void>`

**Example:**
```typescript
await sota.setEnvVar(project.id, {
  key: 'DATABASE_URL',
  value: 'postgres://localhost:5432/mydb',
});
```

### client.deleteEnvVar(projectId, key)

Delete an environment variable from a project.

**Parameters:**
- `projectId` (string) -- The project UUID
- `key` (string) -- The variable name to delete

**Returns:** `Promise<void>`

**Example:**
```typescript
await sota.deleteEnvVar(project.id, 'OLD_VARIABLE');
```

## Error Handling

All API errors are thrown as `SotaAPIError` instances with the HTTP status code, a machine-readable error code, and a human-readable message:

```typescript
import { SotaClient, SotaAPIError } from '@sota-io/sdk';

const sota = new SotaClient({ apiKey: 'sota_your_api_key' });

try {
  await sota.getProject('non-existent-id');
} catch (err) {
  if (err instanceof SotaAPIError) {
    console.error(`HTTP ${err.statusCode}: [${err.code}] ${err.message}`);
    // e.g. "HTTP 404: [not_found] Project not found"
  }
}
```

## TypeScript Types

All types are exported for use in your application:

```typescript
import type {
  Project,
  Deployment,
  EnvVar,
  SotaClientOptions,
  CreateProjectOptions,
  SetEnvVarOptions,
  ListOptions,
  Pagination,
  DataResponse,
  ListResponse,
  APIErrorBody,
} from '@sota-io/sdk';
```

| Type | Description |
|------|-------------|
| `Project` | A sota.io project with id, name, slug, timestamps |
| `Deployment` | A deployment with status, url, build info, timestamps |
| `EnvVar` | An environment variable with key, value, timestamps |
| `SotaClientOptions` | Constructor options: apiKey (required), baseUrl (optional) |
| `CreateProjectOptions` | Project creation: name (required), slug (optional) |
| `SetEnvVarOptions` | Env var: key and value |
| `ListOptions` | Pagination: cursor and limit |
| `Pagination` | Pagination metadata: next_cursor, has_more |
| `DataResponse<T>` | API envelope for single items |
| `ListResponse<T>` | API envelope for lists with pagination |
| `APIErrorBody` | API error response body |

## Requirements

- **Node.js >= 18** (uses native `fetch`)
- **sota.io API key** -- get one at [sota.io/dashboard](https://sota.io/dashboard)

## License

MIT
