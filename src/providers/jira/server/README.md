# Jira Server/Data Center Implementation

This directory contains the Jira Server/Data Center provider implementation for DevBuddy.

## Key Differences from Cloud

| Aspect | Jira Cloud | Jira Server/Data Center |
|--------|------------|-------------------------|
| **API Version** | REST API v3 (`/rest/api/3/`) | REST API v2 (`/rest/api/2/`) |
| **Base URL** | `https://{site}.atlassian.net` | Self-hosted (e.g., `http://jira.company.com`) |
| **Authentication** | Email + API Token | Username + Password or PAT |
| **Versioning** | Single version (managed by Atlassian) | Multiple versions (8.0-9.12+) |
| **Custom Fields** | Consistent IDs | Vary per instance |
| **Description Format** | ADF (Atlassian Document Format) | **Plain text only** (ADF not supported) |

> **Important:** Jira Server does NOT support ADF (Atlassian Document Format). ADF is a Cloud-only feature.
> See: [JRASERVER-72835](https://jira.atlassian.com/browse/JRASERVER-72835)
>
> DevBuddy automatically converts ADF content to plain text with markdown-style formatting when creating issues on Jira Server.

## Architecture

```
JiraServerClient (extends BaseJiraClient)
├── Configuration
│   ├── baseUrl (from settings)
│   ├── username (from settings)
│   └── password/PAT (from secure storage)
│
├── Server Detection
│   ├── serverInfo (version, build, type)
│   ├── capabilities (feature flags based on version)
│   └── authMethod (PAT or Basic Auth)
│
├── Field Mapping
│   ├── epicLink (customfield_XXXXX)
│   ├── storyPoints (customfield_XXXXX)
│   └── sprint (customfield_XXXXX)
│
└── API Operations
    ├── Issue CRUD (version-aware)
    ├── Search (JQL)
    ├── Transitions (workflow)
    ├── Comments (format-aware)
    └── Agile (if supported)
```

## Version Strategy

### Supported Versions

- **Minimum:** Jira Server 8.0
- **Tested:** 8.5 LTS, 8.20 LTS, 9.4 LTS, 9.12 LTS
- **Target:** ~85% of active Jira Server installations

### Capability Detection

On connection, the client detects:

1. **Server Version** - `/rest/api/2/serverInfo`
2. **Feature Capabilities** - Based on version numbers
3. **Authentication Method** - PAT (8.14+) or Basic Auth
4. **Custom Fields** - Per-project field mapping

### Example

```typescript
// Connect to Jira Server
const client = await JiraServerClient.create();

// Get server info
const serverInfo = client.getServerInfo();
// { version: "9.12.0", versionNumbers: [9, 12, 0], ... }

// Get capabilities
const capabilities = client.getCapabilities();
// { personalAccessTokens: true, richTextEditor: true, ... }

// Create issue (automatically adapts format)
const issue = await client.createIssue({
  projectKey: "TEST",
  summary: "New issue",
  description: "Description with **markdown**",
  issueTypeName: "Task"
});
```

## Implementation Status

### ✅ Completed

- [x] Client skeleton with version detection
- [x] Capability detection system
- [x] Authentication negotiation (PAT vs Basic)
- [x] Field mapping detection
- [x] Configuration management

### 🔄 In Progress

- [ ] Issue operations (CRUD)
- [ ] Search with JQL
- [ ] Workflow transitions
- [ ] Comments with format adaptation
- [ ] Project operations
- [ ] User operations

### 📋 Planned

- [ ] Agile operations (boards, sprints)
- [ ] Bulk operations
- [ ] Advanced JQL
- [ ] Custom field handling
- [ ] Error handling and retries

## Testing

### Docker Test Environment

```bash
# Start Jira Server 9.12 (latest)
cd test-env/jira-server/versions/v9.12
docker-compose up -d

# Access: http://localhost:8083
```

### Multi-Version Testing

```bash
# Start all versions
cd test-env/jira-server/versions
./start-all.sh

# Test against each version
npm run test:jira-server -- --version=8.5
npm run test:jira-server -- --version=8.20
npm run test:jira-server -- --version=9.4
npm run test:jira-server -- --version=9.12
```

## Configuration

### VS Code Settings

```json
{
  "devBuddy.provider": "jira",
  "devBuddy.jira.type": "server",
  "devBuddy.jira.server.baseUrl": "http://localhost:8083",
  "devBuddy.jira.server.username": "admin",
  "devBuddy.jira.defaultProject": "TEST"
}
```

### Secure Storage

Password/PAT stored in VS Code Secret Storage:

```typescript
// Store credentials
await context.secrets.store("jiraServerPassword", password);

// Retrieved automatically by client
```

## API Differences

### REST API v2 vs v3

#### Endpoint Structure

```typescript
// Cloud (v3)
GET /rest/api/3/issue/{issueIdOrKey}

// Server (v2)
GET /rest/api/2/issue/{issueIdOrKey}
```

#### Response Structure

Most responses are similar, but some differences:

```typescript
// Cloud: ADF (Atlassian Document Format)
{
  "description": {
    "type": "doc",
    "version": 1,
    "content": [...]
  }
}

// Server 8.0+: ADF or Plain text
{
  "description": "Plain text" // or ADF object
}

// Server 7.x: Wiki markup or Plain text
{
  "description": "h1. Header\n\nText"
}
```

### Authentication

```typescript
// Cloud: Email + API Token
Authorization: Basic base64(email:api_token)

// Server: Username + Password
Authorization: Basic base64(username:password)

// Server 8.14+: Personal Access Token
Authorization: Bearer {token}
```

## Resources

- **Implementation Guide:** `docs/planning/JIRA_VERSION_COMPATIBILITY.md`
- **Test Environment:** `test-env/jira-server/README.md`
- **Jira Server REST API:** https://docs.atlassian.com/software/jira/docs/api/REST/9.12.0/
- **Version History:** https://confluence.atlassian.com/adminjiraserver/jira-releases

## Next Steps

1. **Implement Core Operations** - Issue CRUD, search, transitions
2. **Add Schema Validation** - Zod schemas for API v2 responses
3. **Test Against All Versions** - Docker matrix testing
4. **Add UI Components** - First-time setup, version warnings
5. **Documentation** - User guide for Server setup

---

**Status:** 🔄 In Development  
**Target:** Phase 3 - Jira Integration (Weeks 3-4)

