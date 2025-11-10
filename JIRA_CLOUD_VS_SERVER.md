# Jira Implementation Strategy - Cloud vs Server/Data Center

## Overview

Jira has two distinct deployment models that require different implementation approaches:

1. **Jira Cloud** - Atlassian-hosted SaaS solution
2. **Jira Server/Data Center** - Self-hosted Enterprise solution

## Key Differences

### 1. API Differences

#### Jira Cloud
- **API Version**: REST API v3 (Cloud-specific)
- **Base URL Format**: `https://{site}.atlassian.net`
- **Authentication**: 
  - API tokens (email + token)
  - OAuth 2.0 (for marketplace apps)
- **API Endpoint**: `https://{site}.atlassian.net/rest/api/3/`
- **Documentation**: [Jira Cloud REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)

#### Jira Server/Data Center (Enterprise)
- **API Version**: REST API v2
- **Base URL Format**: Custom (e.g., `https://jira.company.com`)
- **Authentication**:
  - Basic Auth (username + password)
  - Personal Access Tokens (recommended)
  - OAuth 1.0a
- **API Endpoint**: `https://{custom-domain}/rest/api/2/`
- **Documentation**: [Jira Server REST API](https://docs.atlassian.com/software/jira/docs/api/REST/)

### 2. Feature Differences

| Feature | Jira Cloud | Jira Server/DC |
|---------|------------|----------------|
| Custom Fields | Standardized | Highly customized |
| Workflows | Limited customization | Fully customizable |
| API Rate Limits | Yes (documented) | Depends on admin config |
| Version Support | Always latest | Multiple versions in use |
| Permissions | Cloud-managed | Self-managed |
| SSL Certificates | Atlassian-managed | Customer-managed |

### 3. Implementation Impact

#### Authentication
```typescript
// Jira Cloud
interface JiraCloudAuth {
  type: 'cloud';
  email: string;
  apiToken: string;
  siteUrl: string; // e.g., "mycompany.atlassian.net"
}

// Jira Server/DC
interface JiraServerAuth {
  type: 'server';
  baseUrl: string; // e.g., "https://jira.company.com"
  authentication: {
    method: 'token' | 'basic' | 'oauth';
    token?: string;
    username?: string;
    password?: string;
  };
}
```

#### API Client Structure
```typescript
abstract class BaseJiraClient extends BaseTicketProvider {
  abstract getIssue(key: string): Promise<JiraIssue>;
  abstract searchIssues(jql: string): Promise<JiraIssue[]>;
  // ... common methods
}

class JiraCloudClient extends BaseJiraClient {
  private apiVersion = '3';
  private baseUrl: string; // e.g., "https://mycompany.atlassian.net"
  
  async getIssue(key: string): Promise<JiraIssue> {
    // Cloud-specific implementation using API v3
    const url = `${this.baseUrl}/rest/api/3/issue/${key}`;
    // ...
  }
}

class JiraServerClient extends BaseJiraClient {
  private apiVersion = '2';
  private baseUrl: string; // Custom URL
  
  async getIssue(key: string): Promise<JiraIssue> {
    // Server-specific implementation using API v2
    const url = `${this.baseUrl}/rest/api/2/issue/${key}`;
    // ...
  }
}
```

## Recommended Implementation Strategy

### Phase 2A: Jira Cloud Support
**Priority**: High (more common for small-to-medium businesses)

**Advantages**:
- Standardized API (v3)
- Consistent authentication
- Better documentation
- Predictable behavior
- No SSL certificate issues

**Implementation**:
1. Create `src/providers/jira/cloud/JiraCloudClient.ts`
2. Focus on API v3 endpoints
3. Use email + API token authentication
4. Standard field mappings

### Phase 2B: Jira Server/Data Center Support
**Priority**: Medium (common for large enterprises)

**Advantages**:
- Captures enterprise customers
- More customization options
- On-premise data control

**Challenges**:
- Custom field variations
- Multiple API versions to support
- Self-signed SSL certificates
- Network connectivity issues (firewalls, VPNs)
- Authentication complexity

**Implementation**:
1. Create `src/providers/jira/server/JiraServerClient.ts`
2. Support API v2 (most compatible)
3. Handle multiple auth methods
4. SSL certificate validation options
5. Version detection

### Phase 2C: Unified Jira Provider
**Goal**: Seamless experience regardless of deployment type

```typescript
// Platform detector determines which client to use
export async function getJiraClient(): Promise<BaseJiraClient> {
  const config = vscode.workspace.getConfiguration('devBuddy.jira');
  const deploymentType = config.get<'cloud' | 'server'>('deploymentType');
  
  if (deploymentType === 'cloud') {
    return new JiraCloudClient();
  } else {
    return new JiraServerClient();
  }
}
```

## Configuration Schema

### Settings Structure
```json
{
  "devBuddy.jira.deploymentType": {
    "type": "string",
    "enum": ["cloud", "server"],
    "default": "cloud",
    "description": "Jira deployment type"
  },
  "devBuddy.jira.cloud.siteUrl": {
    "type": "string",
    "description": "Jira Cloud site URL (e.g., mycompany.atlassian.net)"
  },
  "devBuddy.jira.cloud.email": {
    "type": "string",
    "description": "Email for Jira Cloud authentication"
  },
  "devBuddy.jira.server.baseUrl": {
    "type": "string",
    "description": "Jira Server base URL (e.g., https://jira.company.com)"
  },
  "devBuddy.jira.server.authMethod": {
    "type": "string",
    "enum": ["token", "basic"],
    "default": "token",
    "description": "Authentication method for Jira Server"
  }
}
```

## Directory Structure (Phase 2)

```
src/providers/jira/
├── common/
│   ├── types.ts              # Shared Jira types
│   ├── BaseJiraClient.ts     # Common Jira logic
│   └── fieldMapper.ts        # Field mapping utilities
├── cloud/
│   ├── JiraCloudClient.ts    # Cloud-specific client (API v3)
│   ├── auth.ts               # Cloud authentication
│   └── endpoints.ts          # Cloud API endpoints
├── server/
│   ├── JiraServerClient.ts   # Server-specific client (API v2)
│   ├── auth.ts               # Server authentication
│   ├── sslHandler.ts         # SSL certificate handling
│   └── versionDetector.ts    # Detect Jira Server version
└── index.ts                  # Unified export & factory

webview-ui/src/jira/
├── ticket-panel/             # Shared UI for both
├── create-ticket/            # Shared UI for both
└── standup-builder/          # Shared UI for both
```

## Testing Strategy

### Jira Cloud Testing
- Use Atlassian free tier for development
- Test with standard fields
- Verify rate limiting handling

### Jira Server Testing
- Requires access to a test instance
- Test with various versions (8.x, 9.x)
- Test SSL certificate scenarios
- Test custom field handling

## Migration Path

**For existing Linear Buddy users:**
1. Phase 2A: Add Jira Cloud support (most users)
2. Phase 2B: Add Jira Server support (enterprise users)
3. Users select platform + deployment type in settings

**Configuration UI:**
```
Platform: [Linear ▼ | Jira Cloud | Jira Server]

For Jira Cloud:
  - Site URL: mycompany.atlassian.net
  - Email: user@example.com
  - API Token: [Configure Securely]

For Jira Server:
  - Base URL: https://jira.company.com
  - Auth Method: [Personal Access Token ▼]
  - Token: [Configure Securely]
```

## Recommendation

**Start with Jira Cloud (Phase 2A)**:
- Easier to implement
- More predictable behavior
- Larger user base for small-to-medium teams
- Better for initial validation

**Add Jira Server (Phase 2B) after Cloud is stable**:
- More complex implementation
- Captures enterprise market
- Requires more testing scenarios
- Can leverage learnings from Cloud implementation

## Resources

### Jira Cloud
- [REST API v3 Reference](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Authentication Guide](https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/)

### Jira Server/Data Center
- [REST API v2 Reference](https://docs.atlassian.com/software/jira/docs/api/REST/latest/)
- [Authentication Guide](https://developer.atlassian.com/server/jira/platform/basic-authentication/)

