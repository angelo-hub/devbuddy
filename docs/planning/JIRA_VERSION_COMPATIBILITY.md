# Jira Server/Data Center Version Compatibility Strategy

**Context:** Jira Server/Data Center has evolved significantly across versions (7.x → 8.x → 9.x), with API changes, new authentication methods, and feature additions. We need a robust content negotiation strategy to support multiple versions.

---

## Version Landscape

### Major Jira Server Versions (Still in Use)

| Version | Released | End of Life | Market Share | Key Changes |
|---------|----------|-------------|--------------|-------------|
| **7.13 LTS** | Apr 2019 | Feb 2024 (ended) | ~10% | Last v7, legacy auth only |
| **8.5 LTS** | Feb 2020 | Feb 2023 (ended) | ~15% | Improved REST API, PAT support |
| **8.20 LTS** | Feb 2021 | Feb 2024 (ended) | ~25% | Enhanced workflows |
| **9.4 LTS** | Oct 2022 | Oct 2025 | ~30% | REST API v2 improvements |
| **9.12 LTS** | May 2024 | May 2027 | ~20% | Latest LTS, modern features |

**Data Source:** Atlassian marketplace statistics (Nov 2024)

### API Version Consistency

Good news: **All Jira Server versions use REST API v2** (`/rest/api/2/`)

Bad news: **Feature availability and field schemas vary significantly**

---

## Content Negotiation Strategy

### 1. Version Detection on Connection

**Detect version immediately on authentication:**

```typescript
// src/providers/jira/JiraServerClient.ts

interface JiraServerInfo {
  version: string;          // "9.12.0"
  versionNumbers: number[]; // [9, 12, 0]
  buildNumber: number;      // 912000
  deploymentType: string;   // "Server" or "Cloud"
  baseUrl: string;
}

class JiraServerClient extends BaseTicketProvider {
  private serverInfo: JiraServerInfo | null = null;
  private capabilities: JiraCapabilities | null = null;

  async connect(): Promise<boolean> {
    try {
      // Step 1: Detect server version
      this.serverInfo = await this.getServerInfo();
      
      // Step 2: Detect capabilities based on version
      this.capabilities = await this.detectCapabilities();
      
      // Step 3: Validate minimum version
      if (!this.isVersionSupported()) {
        throw new Error(
          `Jira Server ${this.serverInfo.version} is not supported. ` +
          `Minimum version: 8.0.0`
        );
      }
      
      return true;
    } catch (error) {
      logger.error('Jira Server connection failed', error);
      return false;
    }
  }

  private async getServerInfo(): Promise<JiraServerInfo> {
    const response = await this.request('/rest/api/2/serverInfo');
    return {
      version: response.version,
      versionNumbers: response.versionNumbers,
      buildNumber: response.buildNumber,
      deploymentType: response.deploymentType,
      baseUrl: response.baseUrl
    };
  }

  private isVersionSupported(): boolean {
    const [major, minor] = this.serverInfo!.versionNumbers;
    
    // Support Jira Server 8.0+
    return major >= 8;
  }
}
```

### 2. Feature Detection via Capabilities

**Define capability flags based on version:**

```typescript
// src/providers/jira/types/capabilities.ts

interface JiraCapabilities {
  // Core features (all versions)
  basicAuth: boolean;              // All versions
  issueSearch: boolean;            // All versions
  issueCreate: boolean;            // All versions
  issueUpdate: boolean;            // All versions
  comments: boolean;               // All versions
  
  // Authentication
  personalAccessTokens: boolean;   // 8.14+
  oauth2: boolean;                 // 9.0+ (limited)
  
  // Advanced features
  richTextEditor: boolean;         // 8.0+
  advancedRoadmaps: boolean;       // 8.0+ (if licensed)
  automation: boolean;             // 8.13+
  
  // API features
  bulkOperations: boolean;         // 8.5+
  advancedJQL: boolean;            // 8.0+
  customFieldSchemas: boolean;     // 9.0+
  workflowProperties: boolean;     // 8.20+
  
  // Field support
  epicLink: boolean;               // All versions
  sprint: boolean;                 // All versions (if Scrum)
  storyPoints: boolean;            // All versions
  timeTracking: boolean;           // All versions
}

class CapabilityDetector {
  static detect(serverInfo: JiraServerInfo): JiraCapabilities {
    const [major, minor, patch] = serverInfo.versionNumbers;
    
    return {
      // Core (always true for supported versions)
      basicAuth: true,
      issueSearch: true,
      issueCreate: true,
      issueUpdate: true,
      comments: true,
      
      // Version-gated features
      personalAccessTokens: this.checkVersion(major, minor, 8, 14),
      oauth2: major >= 9,
      richTextEditor: major >= 8,
      advancedRoadmaps: major >= 8,
      automation: this.checkVersion(major, minor, 8, 13),
      bulkOperations: this.checkVersion(major, minor, 8, 5),
      advancedJQL: major >= 8,
      customFieldSchemas: major >= 9,
      workflowProperties: this.checkVersion(major, minor, 8, 20),
      
      // Field support (check dynamically)
      epicLink: true,
      sprint: true,
      storyPoints: true,
      timeTracking: true,
    };
  }
  
  private static checkVersion(
    actualMajor: number, 
    actualMinor: number,
    requiredMajor: number, 
    requiredMinor: number
  ): boolean {
    if (actualMajor > requiredMajor) return true;
    if (actualMajor === requiredMajor) return actualMinor >= requiredMinor;
    return false;
  }
}
```

### 3. Adaptive API Calls

**Use capabilities to determine API approach:**

```typescript
// src/providers/jira/JiraServerClient.ts

class JiraServerClient extends BaseTicketProvider {
  async createTicket(data: CreateTicketInput): Promise<Ticket | null> {
    // Adapt API call based on capabilities
    const payload = this.buildCreatePayload(data);
    
    try {
      const response = await this.request('/rest/api/2/issue', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return this.normalizeIssue(response);
    } catch (error) {
      // Fallback for older versions
      if (this.isUnsupportedFieldError(error)) {
        return this.createTicketLegacy(data);
      }
      throw error;
    }
  }
  
  private buildCreatePayload(data: CreateTicketInput): any {
    const payload: any = {
      fields: {
        project: { key: data.projectKey },
        summary: data.title,
        issuetype: { name: data.issueType || 'Task' }
      }
    };
    
    // Add description (format varies by version)
    if (this.capabilities!.richTextEditor) {
      // v8.0+: ADF (Atlassian Document Format)
      payload.fields.description = this.convertToADF(data.description);
    } else {
      // v7.x: Plain text or wiki markup
      payload.fields.description = data.description;
    }
    
    // Add priority (if supported by project)
    if (data.priority) {
      payload.fields.priority = { name: data.priority };
    }
    
    // Add custom fields (version-dependent)
    if (data.customFields && this.capabilities!.customFieldSchemas) {
      payload.fields = { ...payload.fields, ...data.customFields };
    }
    
    return payload;
  }
  
  private async createTicketLegacy(data: CreateTicketInput): Promise<Ticket | null> {
    // Simplified payload for older versions
    const payload = {
      fields: {
        project: { key: data.projectKey },
        summary: data.title,
        description: data.description, // Plain text
        issuetype: { name: 'Task' }
      }
    };
    
    const response = await this.request('/rest/api/2/issue', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    return this.normalizeIssue(response);
  }
}
```

### 4. Authentication Method Negotiation

**Try modern methods first, fallback to legacy:**

```typescript
// src/providers/jira/auth/JiraAuthManager.ts

class JiraAuthManager {
  async authenticate(
    baseUrl: string,
    username: string,
    password: string
  ): Promise<AuthResult> {
    // Step 1: Detect server version
    const serverInfo = await this.getServerInfo(baseUrl);
    const capabilities = CapabilityDetector.detect(serverInfo);
    
    // Step 2: Choose auth method based on capabilities
    if (capabilities.personalAccessTokens) {
      // Try PAT first (most secure)
      const patResult = await this.tryPATAuth(baseUrl, username, password);
      if (patResult.success) {
        return patResult;
      }
    }
    
    // Step 3: Fallback to Basic Auth
    return this.basicAuth(baseUrl, username, password);
  }
  
  private async tryPATAuth(
    baseUrl: string,
    username: string,
    token: string
  ): Promise<AuthResult> {
    try {
      // PAT auth: Bearer token in Authorization header
      const response = await fetch(`${baseUrl}/rest/api/2/myself`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return { success: true, method: 'PAT' };
      }
    } catch (error) {
      logger.debug('PAT auth failed, trying Basic Auth');
    }
    
    return { success: false };
  }
  
  private async basicAuth(
    baseUrl: string,
    username: string,
    password: string
  ): Promise<AuthResult> {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    
    const response = await fetch(`${baseUrl}/rest/api/2/myself`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return { success: true, method: 'Basic' };
    }
    
    throw new Error('Authentication failed');
  }
}
```

---

## Field Mapping Strategy

### Problem: Custom Field IDs Vary

Custom fields have IDs like `customfield_10000`, `customfield_10001`, etc., which are **different per Jira instance**.

### Solution: Dynamic Field Mapping

```typescript
// src/providers/jira/JiraFieldMapper.ts

interface FieldMapping {
  standardFields: Map<string, string>;  // DevBuddy name → Jira field
  customFields: Map<string, string>;    // DevBuddy name → customfield_XXXXX
}

class JiraFieldMapper {
  private mapping: FieldMapping | null = null;
  
  async initialize(projectKey: string): Promise<void> {
    // Step 1: Get all fields for this project
    const fields = await this.client.request(
      `/rest/api/2/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`
    );
    
    // Step 2: Map standard fields
    this.mapping = {
      standardFields: new Map([
        ['title', 'summary'],
        ['description', 'description'],
        ['status', 'status'],
        ['priority', 'priority'],
        ['assignee', 'assignee'],
        ['reporter', 'reporter'],
      ]),
      customFields: new Map()
    };
    
    // Step 3: Detect common custom fields
    for (const field of fields.projects[0].issuetypes[0].fields) {
      if (field.schema?.custom) {
        // Epic Link
        if (field.name === 'Epic Link' || field.key === 'epic') {
          this.mapping.customFields.set('epicLink', field.key);
        }
        
        // Story Points
        if (field.name.includes('Story Points') || field.name.includes('Estimate')) {
          this.mapping.customFields.set('storyPoints', field.key);
        }
        
        // Sprint
        if (field.name === 'Sprint') {
          this.mapping.customFields.set('sprint', field.key);
        }
      }
    }
  }
  
  getFieldId(devBuddyFieldName: string): string | null {
    // Check standard fields first
    const standardField = this.mapping!.standardFields.get(devBuddyFieldName);
    if (standardField) return standardField;
    
    // Check custom fields
    return this.mapping!.customFields.get(devBuddyFieldName) || null;
  }
}
```

---

## Testing Strategy

### Multi-Version Test Matrix

Set up multiple Docker environments for testing:

```bash
test-env/jira-server/
├── v8.5/                    # Jira Server 8.5 LTS
│   └── docker-compose.yml
├── v8.20/                   # Jira Server 8.20 LTS
│   └── docker-compose.yml
├── v9.4/                    # Jira Server 9.4 LTS
│   └── docker-compose.yml
└── v9.12/                   # Jira Server 9.12 LTS (latest)
    └── docker-compose.yml
```

**Test each version:**

```typescript
// src/providers/jira/__tests__/version-compatibility.test.ts

describe('Jira Server Version Compatibility', () => {
  const versions = [
    { version: '8.5.0', port: 8080 },
    { version: '8.20.0', port: 8081 },
    { version: '9.4.0', port: 8082 },
    { version: '9.12.0', port: 8083 },
  ];
  
  for (const { version, port } of versions) {
    describe(`Jira Server ${version}`, () => {
      it('should detect server version', async () => {
        const client = new JiraServerClient(`http://localhost:${port}`);
        await client.connect();
        expect(client.serverInfo.version).toBe(version);
      });
      
      it('should detect capabilities correctly', async () => {
        const client = new JiraServerClient(`http://localhost:${port}`);
        await client.connect();
        
        if (version.startsWith('8.5')) {
          expect(client.capabilities.personalAccessTokens).toBe(false);
        } else {
          expect(client.capabilities.personalAccessTokens).toBe(true);
        }
      });
      
      it('should create issue with appropriate API format', async () => {
        const client = new JiraServerClient(`http://localhost:${port}`);
        await client.connect();
        
        const ticket = await client.createTicket({
          projectKey: 'TEST',
          title: 'Test Issue',
          description: 'Description with **markdown**'
        });
        
        expect(ticket).toBeTruthy();
        expect(ticket.identifier).toMatch(/TEST-\d+/);
      });
    });
  }
});
```

---

## Minimum Supported Version

### Recommendation: Jira Server 8.0+

**Rationale:**

- ✅ **Market Coverage:** ~85% of active installations
- ✅ **Feature Parity:** Rich text editor, modern workflows
- ✅ **Maintenance:** Easier to support 3 major versions vs 5+
- ✅ **Security:** v7.x has known vulnerabilities
- ❌ **Exclusions:** Only excludes v7.x (~10% market, EOL)

**Communication:**

```typescript
if (serverVersion < 8.0) {
  vscode.window.showWarningMessage(
    `Jira Server ${serverVersion} is not supported. ` +
    `DevBuddy requires Jira Server 8.0 or later. ` +
    `Please upgrade your Jira instance or contact support.`,
    'Learn More'
  );
}
```

---

## Implementation Checklist

### Phase 1: Detection & Capabilities
- [ ] Implement server info detection
- [ ] Create capability detection system
- [ ] Define minimum supported version (8.0)
- [ ] Add version warnings for unsupported instances

### Phase 2: Adaptive API Calls
- [ ] Implement version-aware authentication
- [ ] Add description format conversion (ADF vs plain)
- [ ] Handle custom field variations
- [ ] Implement graceful degradation

### Phase 3: Testing
- [ ] Set up multi-version Docker environments
- [ ] Test against Jira 8.5, 8.20, 9.4, 9.12
- [ ] Validate all CRUD operations per version
- [ ] Test authentication methods per version

### Phase 4: Documentation
- [ ] Document supported versions
- [ ] Create version-specific guides
- [ ] Add troubleshooting for version issues
- [ ] Provide upgrade recommendations

---

## Architecture Impact

```typescript
// Updated provider structure

JiraServerProvider
├── JiraServerClient (main API client)
│   ├── serverInfo: JiraServerInfo
│   ├── capabilities: JiraCapabilities
│   └── fieldMapper: JiraFieldMapper
├── JiraAuthManager (version-aware auth)
│   ├── tryPATAuth()
│   └── basicAuth()
├── CapabilityDetector (feature detection)
│   └── detect()
└── JiraFieldMapper (dynamic field mapping)
    ├── initialize()
    └── getFieldId()
```

---

## Summary

**Key Decisions:**

1. ✅ **Detect version on connection** - Via `/rest/api/2/serverInfo`
2. ✅ **Use capability flags** - Enable/disable features based on version
3. ✅ **Adaptive API calls** - Different payloads for different versions
4. ✅ **Dynamic field mapping** - Handle custom field ID variations
5. ✅ **Minimum version: 8.0** - Support ~85% of market
6. ✅ **Graceful degradation** - Fallback for unsupported features

**Benefits:**

- Single codebase supports multiple versions
- Clear error messages for unsupported features
- Easy to add new version support
- Testable with Docker matrix

**Complexity Added:**

- Medium complexity (worth it for market coverage)
- ~500-800 LOC for version negotiation
- Requires multi-version testing setup
- Ongoing maintenance as new versions release

This is a **necessary investment** for enterprise adoption. Companies often run older Jira versions due to upgrade complexity.

