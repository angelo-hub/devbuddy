# Create Ticket Feature

## Overview

Added a comprehensive ticket creation UI with Linear template support, accessible via a "+" icon in the sidebar.

## Features

### 1. **Quick Access**
- Added a "+" icon to the sidebar top bar (navigation area)
- Single click opens the ticket creation panel
- Command: `linearBuddy.createTicket`

### 2. **Team Selection**
- Choose from your available Linear teams
- Auto-selects if only one team exists
- Loads team-specific templates and data

### 3. **Template Support**
- Fetches and displays team-specific Linear templates
- Select a template to pre-fill ticket fields:
  - Title
  - Description
  - Priority
  - Labels
  - Project
  - Initial status
- Template descriptions shown for context

### 4. **Comprehensive Ticket Form**

#### Required Fields
- **Team**: Select the Linear team
- **Title**: Ticket title

#### Optional Fields
- **Template**: Choose from team templates
- **Description**: Rich text description
- **Priority**: None, 🔴 Urgent, 🟠 High, 🟡 Medium, 🟢 Low
- **Status**: Choose initial workflow state
- **Assignee**: Assign to team member
- **Project**: Link to a project
- **Labels**: Multi-select labels with color indicators

### 5. **Smart Behavior**
- Auto-loads team members, projects, labels, and workflow states
- Template values can be overridden
- Real-time validation
- Loading states during creation
- Success notifications with option to open created ticket

### 6. **Integration**
- Automatically refreshes sidebar after ticket creation
- Option to immediately open created ticket
- Seamless workflow integration

## Usage

### Via Sidebar
1. Click the "+" icon in the Linear Buddy sidebar
2. Select your team
3. (Optional) Choose a template
4. Fill in ticket details
5. Click "Create Ticket"

### Via Command Palette
1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type: `Linear Buddy: Create New Ticket`
3. Follow the same flow

## Technical Implementation

### Backend (TypeScript)
- **New File**: `src/views/createTicketPanel.ts`
  - Manages webview panel lifecycle
  - Handles message passing between extension and UI
  - Coordinates with Linear API

- **Updated File**: `src/utils/linearClient.ts`
  - Added `LinearTemplate` interface
  - Added `getTeamTemplates()` method
  - Added `getTeamLabels()` method
  - Enhanced `createIssue()` with more fields support:
    - `projectId`
    - `labelIds`
    - `stateId`

- **Updated File**: `src/extension.ts`
  - Registered `linearBuddy.createTicket` command
  - Imported `CreateTicketPanel`

- **Updated File**: `package.json`
  - Added command definition
  - Added to sidebar view/title menu

### Frontend (React)
- **New Directory**: `webview-ui/src/create-ticket/`
  - `index.tsx`: Entry point
  - `App.tsx`: Main application component
  - `App.module.css`: Application styles
  - `components/TicketForm.tsx`: Comprehensive form component
  - `components/TicketForm.module.css`: Form styles

- **Updated File**: `webview-ui/build.js`
  - Added `create-ticket` entry point

### UI Components Used
- **Shared Components**:
  - `Input`: Text input fields
  - `TextArea`: Multi-line description
  - `Select`: Dropdown menus
  - `Button`: Action buttons

### Message Protocol

#### Extension → Webview
```typescript
{
  command: "teamsLoaded" | "templatesLoaded" | "teamDataLoaded" | 
           "usersLoaded" | "issueCreated" | "issueCreationFailed",
  teams?: Array<Team>,
  templates?: Array<Template>,
  workflowStates?: Array<WorkflowState>,
  labels?: Array<Label>,
  projects?: Array<Project>,
  users?: Array<User>,
  issue?: LinearIssue,
  error?: string
}
```

#### Webview → Extension
```typescript
{
  command: "loadTeams" | "loadTemplates" | "loadTeamData" | 
           "loadUsers" | "createIssue",
  teamId?: string,
  input?: IssueInput
}
```

## API Additions

### Linear GraphQL Queries

#### Get Team Templates
```graphql
query {
  team(id: "teamId") {
    templates {
      nodes {
        id
        name
        description
        templateData
      }
    }
  }
}
```

#### Get Team Labels
```graphql
query {
  team(id: "teamId") {
    labels {
      nodes {
        id
        name
        color
      }
    }
  }
}
```

#### Enhanced Issue Creation
```graphql
mutation {
  issueCreate(
    input: {
      teamId: "..."
      title: "..."
      description: "..."
      priority: 1
      assigneeId: "..."
      projectId: "..."
      stateId: "..."
      labelIds: ["...", "..."]
    }
  ) {
    success
    issue {
      id
      identifier
      title
      url
      ...
    }
  }
}
```

## Benefits

1. **Streamlined Workflow**: Create tickets without leaving VS Code
2. **Template Consistency**: Use team templates for consistent ticket structure
3. **Rich Metadata**: Full control over ticket properties from creation
4. **Visual Feedback**: Clear UI with color-coded priorities and labels
5. **Quick Access**: Prominent "+" button in sidebar for easy discovery
6. **Flexible**: Can use templates or create from scratch

## Future Enhancements

Potential improvements:
- Template preview before applying
- Save custom templates
- Bulk ticket creation
- Clone existing tickets
- Keyboard shortcuts for quick creation
- Recent templates list
- Template favorites

## Testing Checklist

- [x] Command registration
- [x] Sidebar button appears
- [x] Panel opens correctly
- [x] Teams load
- [x] Templates load (if team has them)
- [x] Form validation works
- [x] Template application works
- [x] Labels are selectable
- [x] Ticket creation succeeds
- [x] Sidebar refreshes after creation
- [x] Error handling for failures
- [x] TypeScript compilation passes
- [x] Build generates all files

## Related Files

### Source Files
- `src/views/createTicketPanel.ts`
- `src/utils/linearClient.ts`
- `src/extension.ts`
- `package.json`

### Webview Files
- `webview-ui/src/create-ticket/index.tsx`
- `webview-ui/src/create-ticket/App.tsx`
- `webview-ui/src/create-ticket/App.module.css`
- `webview-ui/src/create-ticket/components/TicketForm.tsx`
- `webview-ui/src/create-ticket/components/TicketForm.module.css`
- `webview-ui/build.js`

### Generated Files
- `out/views/createTicketPanel.js`
- `out/webview/create-ticket.js`
- `out/webview/create-ticket.css`

