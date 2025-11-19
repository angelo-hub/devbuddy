# Jira Server Data Flow: From Client to Webview

This document explains how Jira Server issues flow from the API to the UI webviews.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      VS Code Extension                           │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 1. CONFIGURATION (platformDetector.ts)                     │  │
│  │    - getCurrentPlatform() → "jira"                         │  │
│  │    - getJiraDeploymentType() → "server" or "cloud"        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                            ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 2. CLIENT SELECTION (platformDetector.ts)                  │  │
│  │    getPlatformClient()                                     │  │
│  │      if jira.type === "cloud" → JiraCloudClient           │  │
│  │      if jira.type === "server" → JiraServerClient         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                            ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 3. DATA PROVIDER (UniversalTicketsProvider.ts)            │  │
│  │    - Singleton tree view provider                          │  │
│  │    - Routes to getJiraChildren()                          │  │
│  │    - Calls client.getMyIssues()                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                            ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 4. API CLIENT (JiraServerClient.ts / JiraCloudClient.ts) │  │
│  │    - Makes authenticated HTTP requests                     │  │
│  │    - Cloud: /rest/api/3/search                            │  │
│  │    - Server: /rest/api/2/search                           │  │
│  │    - Returns: JiraIssue[]                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                            ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 5. WEBVIEW PANEL (JiraIssuePanel.ts)                      │  │
│  │    - Opens when user clicks issue in tree                  │  │
│  │    - Loads JiraServerClient or JiraCloudClient            │  │
│  │    - Calls client.getIssue(key) for details               │  │
│  │    - Sends data via postMessage() to React app            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                            ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 6. REACT WEBVIEW (webview-ui/src/jira/ticket-panel/)     │  │
│  │    - Receives issue data via message handler               │  │
│  │    - Renders UI (summary, description, status, etc.)       │  │
│  │    - User actions → postMessage() back to extension        │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Data Flow

### 1. Configuration Detection

**File:** `src/shared/utils/platformDetector.ts`

```typescript
// Check which platform is active
export function getCurrentPlatform(): PlatformType {
  const config = vscode.workspace.getConfiguration("devBuddy");
  return config.get<string>("provider", "linear") as PlatformType;
  // Returns: "linear" | "jira" | ...
}

// Check which Jira type (Cloud vs Server)
export function getJiraDeploymentType(): JiraDeploymentType {
  const config = vscode.workspace.getConfiguration("devBuddy");
  return config.get<string>("jira.type", "cloud") as JiraDeploymentType;
  // Returns: "cloud" | "server"
}
```

**Settings checked:**
- `devBuddy.provider` → Determines platform ("jira")
- `devBuddy.jira.type` → Determines Jira deployment ("server" or "cloud")

### 2. Client Selection

**File:** `src/shared/utils/platformDetector.ts`

```typescript
export async function getPlatformClient(): Promise<BaseTicketProvider | BaseJiraClient> {
  const platform = getCurrentPlatform();

  switch (platform) {
    case "linear":
      return await LinearClient.create();
    
    case "jira": {
      const jiraType = getJiraDeploymentType();
      if (jiraType === "cloud") {
        return await JiraCloudClient.create();  // ← Cloud client
      } else {
        return await JiraServerClient.create(); // ← Server client
      }
    }
    
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
```

**This function is used everywhere** to get the right client instance.

### 3. Tree View Provider (Sidebar)

**File:** `src/shared/views/UniversalTicketsProvider.ts`

The tree view in the sidebar gets issues from:

```typescript
export class UniversalTicketsProvider implements vscode.TreeDataProvider<UniversalTicketTreeItem> {
  private currentPlatform: Platform = null;

  // Called when tree needs data
  async getChildren(element?: UniversalTicketTreeItem): Promise<UniversalTicketTreeItem[]> {
    // Detect platform from settings
    if (!this.currentPlatform) {
      return this.getSetupInstructions();
    }

    // Route to appropriate platform
    if (this.currentPlatform === "linear") {
      return this.getLinearChildren(element);
    } else if (this.currentPlatform === "jira") {
      return this.getJiraChildren(element);  // ← Goes here for Jira
    }

    return [];
  }

  // Jira-specific implementation
  private async getJiraChildren(element?: UniversalTicketTreeItem): Promise<UniversalTicketTreeItem[]> {
    try {
      // Get the right Jira client (Cloud or Server)
      const jiraType = getJiraDeploymentType();
      const client = jiraType === "cloud" 
        ? await JiraCloudClient.create()   // ← Cloud
        : await JiraServerClient.create(); // ← Server

      if (!client.isConfigured()) {
        return this.getJiraSetupInstructions();
      }

      // Root level - show sections
      if (!element) {
        return this.getJiraRootSections();
      }

      // My Issues section
      if (element.contextValue === "jiraSection:myIssues") {
        return this.getJiraMyIssues(client);  // ← Fetches issues
      }

      // ... other sections
    } catch (error) {
      logger.error("Failed to load Jira children:", error);
      return [];
    }
  }

  // Fetch user's assigned issues
  private async getJiraMyIssues(client: BaseJiraClient): Promise<UniversalTicketTreeItem[]> {
    try {
      // This calls the client's getMyIssues() method
      const issues = await client.getMyIssues();  // ← API CALL HERE
      
      if (issues.length === 0) {
        const noIssuesItem = new UniversalTicketTreeItem(
          "No assigned issues",
          vscode.TreeItemCollapsibleState.None,
          "jira"
        );
        noIssuesItem.iconPath = new vscode.ThemeIcon("info");
        return [noIssuesItem];
      }

      // Convert to tree items
      return issues.map((issue) => this.createJiraIssueItem(issue));
    } catch (error) {
      logger.error("Failed to fetch Jira issues:", error);
      return [];
    }
  }
}
```

### 4. API Client (Makes HTTP Requests)

**For Jira Server:**

**File:** `src/providers/jira/server/JiraServerClient.ts`

```typescript
export class JiraServerClient extends BaseJiraClient {
  private baseUrl: string = "";  // http://localhost:8080
  private username: string = "";
  private password: string = "";  // or PAT
  
  // API base URL (REST API v2)
  protected getApiBaseUrl(): string {
    return `${this.baseUrl}/rest/api/2`;  // Note: v2, not v3
  }

  // Authentication headers
  protected getAuthHeaders(): Record<string, string> {
    if (this.authMethod === "pat") {
      // Personal Access Token (Jira 8.14+)
      return {
        "Authorization": `Bearer ${this.password}`,
      };
    } else {
      // Basic Auth (all versions)
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString("base64");
      return {
        "Authorization": `Basic ${credentials}`,
      };
    }
  }

  // Fetch user's assigned issues
  async getMyIssues(): Promise<JiraIssue[]> {
    try {
      // JQL query: assignee = currentUser() AND resolution = Unresolved
      const jql = "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC";
      
      // Make API request to /rest/api/2/search
      const response = await this.request<any>(`/search?jql=${encodeURIComponent(jql)}&maxResults=100`);
      
      // Normalize Jira API response to internal format
      return response.issues.map((apiIssue: any) => this.normalizeIssue(apiIssue));
    } catch (error) {
      logger.error("Failed to fetch my issues from Jira Server:", error);
      throw error;
    }
  }

  // HTTP request helper
  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.getApiBaseUrl()}${endpoint}`;
    
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}
```

**For Jira Cloud (for comparison):**

**File:** `src/providers/jira/cloud/JiraCloudClient.ts`

```typescript
export class JiraCloudClient extends BaseJiraClient {
  private siteUrl: string = "";  // https://yoursite.atlassian.net
  private email: string = "";
  private apiToken: string = "";

  // API base URL (REST API v3)
  protected getApiBaseUrl(): string {
    return `${this.siteUrl}/rest/api/3`;  // Note: v3, not v2
  }

  // Authentication headers
  protected getAuthHeaders(): Record<string, string> {
    // Cloud: Email + API Token encoded as Basic Auth
    const credentials = Buffer.from(`${this.email}:${this.apiToken}`).toString("base64");
    return {
      "Authorization": `Basic ${credentials}`,
    };
  }

  // Rest of implementation similar to Server
  async getMyIssues(): Promise<JiraIssue[]> {
    // Same JQL logic, different API endpoint
  }
}
```

### 5. Webview Panel (Detail View)

**File:** `src/providers/jira/cloud/JiraIssuePanel.ts`

When a user clicks on an issue in the tree view, this panel opens:

```typescript
export class JiraIssuePanel {
  private _jiraClient: BaseJiraClient | null = null;
  private _issue: JiraIssue | null = null;

  // Initialize client based on Jira type
  private async initializeClient(): Promise<void> {
    try {
      const jiraType = getJiraDeploymentType();
      
      if (jiraType === "cloud") {
        this._jiraClient = await JiraCloudClient.create();  // ← Cloud
      } else {
        this._jiraClient = await JiraServerClient.create(); // ← Server
      }
      
      logger.debug(`Jira ${jiraType} client initialized in issue panel`);
    } catch (error) {
      logger.error("Failed to initialize Jira client:", error);
    }
  }

  // Load full issue details
  private async loadIssueDetails(issueKey: string): Promise<void> {
    if (!this._jiraClient) {
      throw new Error("Jira client not initialized");
    }

    // Fetch full issue from API
    this._issue = await this._jiraClient.getIssue(issueKey);  // ← API CALL
    
    if (!this._issue) {
      throw new Error(`Issue ${issueKey} not found`);
    }

    // Send data to webview
    this._panel.webview.postMessage({
      command: "updateIssue",
      issue: this._issue,  // ← Sent to React app
    });
  }

  // Handle messages from webview
  private async handleUpdateStatus(transitionId: string): Promise<void> {
    if (!this._jiraClient || !this._issue) return;

    // User clicked "Update Status" in webview
    await this._jiraClient.transitionIssue(this._issue.key, transitionId);  // ← API CALL
    
    // Refresh issue data
    await this.loadIssueDetails(this._issue.key);
  }

  private async handleAddComment(body: string): Promise<void> {
    if (!this._jiraClient || !this._issue) return;

    // User submitted comment in webview
    await this._jiraClient.addComment(this._issue.key, body);  // ← API CALL
    
    // Refresh issue data
    await this.loadIssueDetails(this._issue.key);
  }
}
```

### 6. React Webview (UI)

**File:** `webview-ui/src/jira/ticket-panel/App.tsx` (would need to be created)

```typescript
// React component that receives and displays issue data
export const App = () => {
  const [issue, setIssue] = useState<JiraIssue | null>(null);
  const vscode = useVSCode();

  // Listen for messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.command) {
        case "updateIssue":
          setIssue(message.issue);  // ← Receive issue data
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // User clicks "Update Status"
  const handleStatusChange = (transitionId: string) => {
    vscode.postMessage({
      command: "updateStatus",
      transitionId,
    });  // ← Send to extension
  };

  // Render UI
  return (
    <div>
      <h1>{issue?.key}: {issue?.summary}</h1>
      <p>{issue?.description}</p>
      <button onClick={() => handleStatusChange("31")}>
        Mark as Done
      </button>
    </div>
  );
};
```

## Summary: Where Webview Gets Jira Server Issues

### Sidebar Tree View
```
User opens sidebar
  → UniversalTicketsProvider.getJiraChildren()
    → getJiraDeploymentType() checks "devBuddy.jira.type"
      → if "server": JiraServerClient.create()
      → if "cloud": JiraCloudClient.create()
    → client.getMyIssues()
      → HTTP GET to /rest/api/2/search (Server) or /rest/api/3/search (Cloud)
      → Returns JiraIssue[]
    → Displays as tree items in sidebar
```

### Detail Panel (Webview)
```
User clicks issue in sidebar
  → JiraIssuePanel.createOrShow(issue)
    → initializeClient()
      → getJiraDeploymentType() checks "devBuddy.jira.type"
        → if "server": JiraServerClient.create()
        → if "cloud": JiraCloudClient.create()
    → client.getIssue(key)
      → HTTP GET to /rest/api/2/issue/{key} (Server)
      → Returns JiraIssue with full details
    → postMessage({ command: "updateIssue", issue })
      → React webview receives data
      → Renders UI
```

## Key Configuration Settings

The data flow is controlled by these VS Code settings:

```json
{
  // Which platform to use
  "devBuddy.provider": "jira",
  
  // Which Jira deployment (THIS IS THE KEY SETTING)
  "devBuddy.jira.type": "server",  // or "cloud"
  
  // Server-specific settings
  "devBuddy.jira.server.baseUrl": "http://localhost:8080",
  "devBuddy.jira.server.username": "admin",
  
  // Cloud-specific settings
  "devBuddy.jira.cloud.siteUrl": "https://yoursite.atlassian.net",
  "devBuddy.jira.cloud.email": "you@company.com"
}
```

## Credentials Storage

API credentials are stored securely in VS Code Secret Storage:

```typescript
// Server (password or PAT)
await context.secrets.store("jiraServerPassword", password);
const password = await context.secrets.get("jiraServerPassword");

// Cloud (API token)
await context.secrets.store("jiraCloudApiToken", token);
const token = await context.secrets.get("jiraCloudApiToken");
```

## Next Steps for Implementation

If `JiraServerClient.getMyIssues()` is not yet implemented (still shows `throw new Error("Method not implemented.")`), you need to:

1. **Implement the method** in `JiraServerClient.ts`:
   ```typescript
   async getMyIssues(): Promise<JiraIssue[]> {
     const jql = "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC";
     const response = await this.request<any>(`/search?jql=${encodeURIComponent(jql)}&maxResults=100`);
     return response.issues.map((apiIssue: any) => this.normalizeIssue(apiIssue));
   }
   ```

2. **Test it** by:
   - Setting `devBuddy.jira.type` to `"server"`
   - Configuring server URL and credentials
   - Opening the DevBuddy sidebar
   - Issues should appear in the tree

That's the complete data flow! The webview gets Jira Server issues through the **client selection pattern** based on the `devBuddy.jira.type` setting.

