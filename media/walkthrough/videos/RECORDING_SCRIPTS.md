# DevBuddy Demo Recording Scripts

This guide provides detailed scripts for recording GIFs and videos showcasing DevBuddy's most unique and differentiating features.

## Recording Setup

### Tools Recommendation

**macOS:**
- Kap (recommended) - https://getkap.co/
- Gifox - https://gifox.io/

**Windows:**
- ShareX - https://getsharex.com/
- ScreenToGif - https://www.screentogif.com/

**Linux:**
- Peek - https://github.com/phw/peek
- SimpleScreenRecorder

### Recording Settings

**For GIFs (< 30 seconds):**
- Resolution: 1920x1080 (will display well at smaller sizes)
- Frame rate: 30 fps
- Format: GIF
- Target size: < 5MB (optimize with ezgif.com if larger)

**For Videos (> 30 seconds or narrated):**
- Resolution: 1920x1080 or 2560x1440
- Frame rate: 60 fps
- Format: MP4 or WebM
- Target size: < 20MB for marketplace

### VS Code Setup

**Theme:** Dark+ (default dark theme) - most popular and recognizable

**Settings:**
- Font size: 16pt (readable in GIFs)
- Zoom level: 100% or 110%
- Hide minimap: Yes
- Hide activity bar: Optional (cleaner look)
- Sidebar visible: Yes for ticket demos

**Clean Workspace:**
- Use example data, not real projects
- Close unnecessary panels
- No personal information visible
- Fresh workspace with no errors/warnings

### Demo Data Standards

**Repository:** Use "example-app" or "demo-monorepo"

**Ticket IDs:** 
- Linear: ENG-123, ENG-456, ENG-789
- Jira: ENG-123, PROJ-456

**Branch names:** 
- `feature/eng-123-add-auth`
- `fix/eng-456-rate-limiting`

**File paths:**
- `src/auth/login.ts`
- `src/middleware/auth.ts`
- `src/services/userService.ts`
- `packages/mobile-app/src/screens/Login.tsx`
- `packages/api-client/src/auth.ts`

---

## Script 1: Complete TODO Workflow (PRIORITY)

**File:** `todo-converter-demo.gif`  
**Duration:** 30-45 seconds  
**Platform:** Linear only

### Setup
- Open `src/auth/login.ts` in VS Code
- File should have a TODO comment at line 145
- Connected to Linear with API key configured
- GitHub/GitLab remote configured

### Step-by-Step Actions

**00:00-00:03** - Show file with TODO
```typescript
// Line 140-150 visible
async function handleLogin(credentials) {
  // Validate credentials
  if (!credentials.email || !credentials.password) {
    throw new Error('Invalid credentials');
  }
  // TODO: Add rate limiting for failed login attempts
  return await authenticateUser(credentials);
}
```
- **Action:** Cursor blinking on TODO line
- **Pause:** 2 seconds (let viewer read TODO)

**00:03-00:05** - Trigger conversion
- **Action:** Right-click on TODO line
- **Pause:** 1 second (context menu appears)

**00:05-00:07** - Select convert option
- **Action:** Click "Convert TODO to Linear Ticket"
- **Transition:** Ticket creation form opens

**00:07-00:15** - Show ticket form (KEY MOMENT)
- **Action:** Scroll to show pre-filled fields
  - Title: "Add rate limiting for failed login attempts"
  - Description with permalink section visible
- **Zoom:** Zoom into permalink section briefly (2 seconds)
- **Highlight:** Show GitHub URL, file path, code context
- **Pause:** 3 seconds (let viewer read)

**00:15-00:17** - Create ticket
- **Action:** Click "Create Ticket" button
- **Transition:** Loading indicator (1-2 seconds)

**00:17-00:22** - Success notification (CRITICAL PART)
- **Action:** Success message appears:
  ```
  ✅ Created ticket ENG-456: Add rate limiting
  [Replace TODO] [Add More TODOs] [Link Existing TODOs] [Open Ticket]
  ```
- **Pause:** 3 seconds (show all four buttons clearly)
- **Highlight:** "Add More TODOs" button should be emphasized

**00:22-00:25** - Click Add More TODOs
- **Action:** Click "Add More TODOs" button
- **Transition:** Modal appears

**00:25-00:28** - Show clipboard modal
- **Display:** Modal shows:
  ```
  📋 Ticket reference copied!
  // ENG-456: Track at https://linear.app/team/issue/ENG-456
  
  Navigate to another file and paste (Cmd+V)
  
  [Add Another] [Done]
  ```
- **Pause:** 2 seconds

**00:28-00:32** - Navigate to second file
- **Action:** Press Cmd+P (Quick Open)
- **Type:** "middleware"
- **Select:** `src/middleware/auth.ts`
- **Transition:** File opens

**00:32-00:35** - Paste in second location
- **Action:** Navigate to line 67
- **Action:** Press Cmd+V
- **Display:** `// ENG-456: Track at https://linear.app/team/issue/ENG-456` appears
- **Pause:** 1 second

**00:35-00:37** - Modal reappears
- **Display:** Modal shows again with same options
- **Action:** Click "Add Another"

**00:37-00:40** - Navigate to third file
- **Action:** Cmd+P → type "user" → select `src/services/userService.ts`
- **Action:** Navigate to line 89, paste (Cmd+V)
- **Pause:** 1 second

**00:40-00:42** - Finish workflow
- **Action:** Click "Done" button
- **Transition:** Modal closes

**00:42-00:45** - Show results
- **Action:** Quick montage showing all 3 files with ENG-456 reference
  - src/auth/login.ts (original TODO now has ticket reference)
  - src/middleware/auth.ts (new reference)
  - src/services/userService.ts (new reference)
- **Fade out**

### Notes for Recording
- Move cursor slowly and deliberately
- Pause 1 second after each click to show result
- Zoom into important UI elements (permalink, buttons)
- Keep modal visible long enough to read
- Final montage should be smooth (0.5 sec per file)

---

## Script 2: Add More TODOs Workflow (KEY DIFFERENTIATOR)

**File:** `add-more-todos.gif`  
**Duration:** 40-50 seconds  
**Platform:** Linear only

This is a focused version emphasizing the multi-file workflow.

### Setup
- Start from success notification (after ticket ENG-456 created)
- Have 3 files ready to navigate to

### Step-by-Step Actions

**00:00-00:03** - Show success message
- **Display:** Success notification with 4 buttons visible
- **Highlight:** "Add More TODOs" button
- **Pause:** 2 seconds

**00:03-00:05** - Click button
- **Action:** Click "Add More TODOs"
- **Transition:** Modal opens

**00:05-00:09** - Show modal with clipboard notification
- **Display:** Full modal content
- **Emphasize:** "Ticket reference copied!" message
- **Pause:** 3 seconds (critical moment)

**00:09-00:12** - Navigate to file 1
- **Action:** Cmd+P → type "middleware" → Enter
- **Transition:** File opens to line 67

**00:12-00:14** - Paste reference
- **Action:** Cmd+V
- **Display:** Ticket reference appears
- **Pause:** 1 second

**00:14-00:16** - Modal reappears
- **Display:** Modal shows "Add Another" and "Done"
- **Action:** Click "Add Another"

**00:16-00:19** - Navigate to file 2
- **Action:** Cmd+P → type "token" → Enter
- **Transition:** Opens token.ts at line 23

**00:19-00:21** - Paste reference
- **Action:** Cmd+V
- **Display:** Ticket reference appears
- **Pause:** 1 second

**00:21-00:23** - Click Add Another again
- **Action:** Click "Add Another" button

**00:23-00:26** - Navigate to file 3
- **Action:** Cmd+P → type "config" → Enter
- **Transition:** Opens config/jwt.ts at line 12

**00:26-00:28** - Paste reference
- **Action:** Cmd+V
- **Display:** Ticket reference appears
- **Pause:** 1 second

**00:28-00:30** - Click Done
- **Action:** Click "Done" button
- **Transition:** Modal closes

**00:30-00:45** - Show all files side-by-side
- **Split screen or quick cuts:**
  - File 1: src/auth/login.ts with ENG-456
  - File 2: src/middleware/auth.ts with ENG-456
  - File 3: src/services/token.ts with ENG-456
  - File 4: src/config/jwt.ts with ENG-456
- **Text overlay:** "4 files, 1 ticket, 45 seconds"
- **Fade out**

### Notes for Recording
- This is THE key differentiator - make it crystal clear
- Show the modal prominently
- Fast but not rushed navigation
- Final side-by-side should emphasize the connection

---

## Script 3: PR Summary with Monorepo Detection

**File:** `pr-summary-demo.gif`  
**Duration:** 45-60 seconds  
**Platform:** Linear (full AI features)

### Setup
- Open monorepo with visible structure:
  ```
  packages/
    mobile-app/
    api-client/
    shared-utils/
  ```
- Have recent commits affecting 2 packages
- Git changes staged or committed

### Step-by-Step Actions

**00:00-00:05** - Show monorepo structure
- **Action:** Show Explorer view with packages folder expanded
- **Display:** packages/mobile-app, packages/api-client visible
- **Pause:** 3 seconds

**00:05-00:08** - Open Command Palette
- **Action:** Cmd+Shift+P
- **Type:** "DevBuddy: Generate PR Summary"
- **Select:** Command

**00:08-00:15** - Show analysis in progress
- **Display:** Progress notification:
  ```
  DevBuddy: Analyzing changes...
  - Detecting affected packages
  - Analyzing commits
  - Generating summary with AI
  ```
- **Pause:** 5 seconds (can show loading indicator)

**00:15-00:35** - Show generated PR summary
- **Action:** Summary appears in new editor
- **Scroll slowly through content:**
  ```markdown
  ## Overview
  This PR adds user authentication to the mobile app using JWT tokens.
  
  ## Changes
  ### packages/mobile-app
  - Added Login and Signup screens
  - Implemented JWT token storage with secure storage
  - Added authentication context provider
  
  ### packages/api-client
  - Created authentication API endpoints
  - Added token refresh logic
  - Updated TypeScript types for auth
  
  ## Testing
  - [ ] Manual testing on iOS
  - [ ] Manual testing on Android
  - [ ] Unit tests passing
  
  ## Related Tickets
  - Closes ENG-123
  ```
- **Pause:** 10 seconds (let viewer read key sections)
- **Highlight:** Package breakdown section (00:20-00:25)

**00:35-00:40** - Show package detection
- **Action:** Scroll back to top
- **Zoom:** Zoom into package sections
- **Text overlay:** "Automatically detected 2 affected packages"

**00:40-00:45** - Copy to clipboard
- **Action:** Click "Copy" button or Cmd+A, Cmd+C
- **Display:** "PR summary copied to clipboard!" notification
- **Fade out**

### Notes for Recording
- Make monorepo structure obvious
- Emphasize package detection (unique feature)
- Generated content should look realistic
- Show enough content to demonstrate value

---

## Script 4: AI Standup Builder

**File:** `standup-demo.gif`  
**Duration:** 30-40 seconds  
**Platform:** Linear

### Setup
- Have recent commits (last 24 hours)
- Have Linear tickets updated recently
- Standup Builder panel not yet open

### Step-by-Step Actions

**00:00-00:03** - Open Standup Builder
- **Action:** Click notebook icon in DevBuddy sidebar
  OR Command Palette → "DevBuddy: Open Standup Builder"
- **Transition:** Panel opens

**00:03-00:10** - Show data collection
- **Display:** Standup Builder UI showing:
  - "Recent Commits" section with 3-4 commits listed
  - "Active Tickets" section with 2 Linear tickets
  - Time range selector showing "Last 24 hours"
- **Pause:** 5 seconds (let viewer see data sources)

**00:10-00:13** - Click Generate with AI
- **Action:** Click "Generate with AI" button
- **Transition:** Loading indicator

**00:13-00:25** - Show generated standup
- **Display:** Generated content appears:
  ```markdown
  ## Yesterday
  - Completed ENG-123: User authentication flow
    - Implemented JWT token refresh mechanism
    - Added password reset functionality
  - Fixed bug in payment processing (ENG-124)
  - Reviewed 3 pull requests from team members
  
  ## Today
  - Starting ENG-125: Dashboard redesign
  - Code review session at 2pm
  - Update API documentation
  
  ## Blockers
  - Waiting on design assets for dashboard
  ```
- **Scroll slowly:** Through all sections
- **Pause:** 8 seconds total

**00:25-00:30** - Copy standup
- **Action:** Click "Copy to Clipboard" button
- **Display:** "Standup copied!" notification
- **Pause:** 2 seconds

**00:30-00:35** - Show Slack/paste destination
- **Action:** Switch to Slack (or show clipboard icon)
- **Text overlay:** "Ready to paste in Slack, email, or standup tool"
- **Fade out**

### Notes for Recording
- Show data sources clearly (commits + tickets)
- Generated content should be realistic
- Emphasize how quickly it happens
- Final destination optional but helps show use case

---

## Script 5: Linear Sidebar Demo

**File:** `linear-sidebar-demo.gif`  
**Duration:** 25 seconds  
**Platform:** Linear

### Setup
- DevBuddy configured with Linear
- Have 4-5 tickets assigned to you in various states
- Sidebar not yet visible

### Step-by-Step Actions

**00:00-00:03** - Open DevBuddy sidebar
- **Action:** Click DevBuddy icon in Activity Bar (checklist icon)
- **Transition:** Sidebar expands

**00:03-00:10** - Show ticket organization
- **Display:** Tickets grouped by status:
  - In Progress (2 tickets)
  - Todo (2 tickets)
  - Done (1 ticket)
- **Show:** Priority indicators, ticket IDs, titles
- **Pause:** 5 seconds

**00:10-00:13** - Click a ticket
- **Action:** Click on "ENG-456: Add rate limiting"
- **Transition:** Rich webview panel opens on right

**00:13-00:20** - Show ticket detail panel
- **Display:** Ticket panel showing:
  - Title and description
  - Status dropdown
  - Assignee
  - Priority, labels
  - Comments section
  - Action buttons at bottom
- **Scroll slowly:** Through panel
- **Pause:** 5 seconds

**00:20-00:23** - Show inline actions
- **Action:** Hover over ticket in sidebar
- **Display:** Inline action buttons appear (branch icon, status icon)
- **Pause:** 2 seconds

**00:23-00:25** - Update status
- **Action:** Click status dropdown in panel
- **Display:** Status options appear (Todo, In Progress, Done, Canceled)
- **Select:** "In Progress"
- **Fade out**

### Notes for Recording
- Show the organization clearly
- Webview panel should be prominent
- Inline actions are important to show
- Keep it quick and focused

---

## Script 6: Jira Sidebar Demo

**File:** `jira-sidebar-demo.gif`  
**Duration:** 25 seconds  
**Platform:** Jira Cloud

### Setup
- DevBuddy configured with Jira
- Provider setting set to "jira"
- Have 4-5 Jira issues assigned

### Step-by-Step Actions

**00:00-00:03** - Show provider setting
- **Action:** Quick flash of settings showing `"devBuddy.provider": "jira"`
- **Transition:** Fade to VS Code

**00:03-00:05** - Open DevBuddy sidebar
- **Action:** Click DevBuddy icon in Activity Bar
- **Transition:** Sidebar expands

**00:05-00:12** - Show Jira issues
- **Display:** Issues grouped by status:
  - To Do (2 issues)
  - In Progress (2 issues)
  - Done (1 issue)
- **Show:** Issue keys (ENG-123), types (Task, Bug), priorities
- **Pause:** 5 seconds

**00:12-00:15** - Click an issue
- **Action:** Click on "ENG-123: Setup authentication"
- **Transition:** Browser opens to Jira Cloud
- **Show:** Brief flash of Jira web interface

**00:15-00:18** - Return to VS Code
- **Action:** Switch back to VS Code
- **Display:** Sidebar still showing issues

**00:18-00:22** - Show inline actions
- **Action:** Right-click on issue
- **Display:** Context menu with:
  - Update Status
  - Add Comment
  - Copy Issue Key
  - Open in Browser
- **Pause:** 3 seconds

**00:22-00:25** - Update status
- **Action:** Click "Update Status"
- **Display:** Quick pick showing workflow transitions
- **Select:** "In Progress"
- **Display:** Success notification
- **Fade out**

### Notes for Recording
- Make platform switch clear
- Show that clicking opens browser (temporary)
- Emphasize available actions
- Note about webview coming soon (optional text overlay)

---

## Post-Recording Checklist

### For Each GIF/Video

1. **Review playback** - Watch at normal speed
   - Is everything readable?
   - Are pauses long enough?
   - Any jarring movements?

2. **Optimize file size**
   - Use ezgif.com for GIF optimization
   - Target: < 5MB for GIFs
   - Use video compression for MP4

3. **Test in different contexts**
   - View in VS Code walkthrough
   - View in GitHub README
   - View on marketplace page

4. **Name consistently**
   - Use exact names from scripts
   - Example: `todo-converter-demo.gif`

### Quality Standards

- **Readability:** All text should be readable at 50% size
- **Smoothness:** No lag or stuttering
- **Timing:** Pauses should feel natural, not rushed
- **Focus:** Cursor movements should guide attention
- **Polish:** No visible errors, warnings, or personal info

### File Organization

```
media/walkthrough/videos/
  ├── todo-converter-demo.gif (Script 1)
  ├── add-more-todos.gif (Script 2)
  ├── pr-summary-demo.gif (Script 3)
  ├── standup-demo.gif (Script 4)
  ├── linear-sidebar-demo.gif (Script 5)
  ├── jira-sidebar-demo.gif (Script 6)
  └── RECORDING_SCRIPTS.md (this file)
```

---

## Tips for Great Recordings

### Cursor Movement
- Move slowly and deliberately
- Pause briefly at destinations
- Don't overshoot targets
- Use smooth acceleration/deceleration

### Timing
- Allow 1 second after each click
- Allow 2-3 seconds for reading text
- Allow 1 second for transitions
- Total duration estimates include all pauses

### Zoom Effects
- Zoom into critical UI elements (permalinks, buttons)
- Hold zoom for 2-3 seconds
- Zoom out smoothly
- Use sparingly (1-2 times per demo)

### Text Overlays (Optional)
- Use for key messages ("4 files, 1 ticket, 45 seconds")
- Keep on screen 2-3 seconds minimum
- Use readable font (system font, 24pt+)
- Place in bottom third of screen

### Common Mistakes to Avoid
- Moving too fast
- Not showing results of actions
- Text too small to read
- Cursor jumps (move smoothly)
- Recording errors or warnings
- Personal/sensitive information visible
- Inconsistent data (different ticket IDs)

---

## Recording Day Preparation

### 1 Day Before
- [ ] Install recording software
- [ ] Test recording quality
- [ ] Set up clean demo workspace
- [ ] Create example files with TODOs
- [ ] Verify Linear/Jira connection
- [ ] Make commits for PR/standup demos

### Recording Day
- [ ] Close all unneeded applications
- [ ] Clear VS Code recent files
- [ ] Reset zoom to 100%
- [ ] Set font size to 16pt
- [ ] Switch to Dark+ theme
- [ ] Hide notifications (Do Not Disturb)
- [ ] Practice cursor movements
- [ ] Review scripts one more time

### Post-Recording
- [ ] Optimize all GIFs
- [ ] Test in VS Code walkthrough
- [ ] Commit to repository
- [ ] Update markdown files with GIF references
- [ ] Update package.json with media paths

---

**Ready to record? Follow the scripts step-by-step and create amazing demos!**

