# Jira Server/Data Center Testing Guide

This guide will help you test the DevBuddy Jira Server/Data Center integration.

## Prerequisites

- Docker Desktop installed and running
- VS Code with DevBuddy extension source code
- At least 4GB RAM available for Docker
- 10GB free disk space

## Quick Start: Single Version Testing

### 1. Start Jira Server 9.12 (Latest LTS)

```bash
cd test-env/jira-server
docker-compose up -d

# Wait 5-10 minutes for Jira to start
docker-compose logs -f jira
```

### 2. Initial Jira Setup

Open browser: `http://localhost:8080`

Follow the setup wizard:

1. **Database Setup**
   - Connection: "My Own Database"
   - Database: PostgreSQL
   - Hostname: `postgres`
   - Port: `5432`
   - Database: `jiradb`
   - Username: `jirauser`
   - Password: `jirapassword`

2. **Application Properties**
   - Application Title: "DevBuddy Test Jira"
   - Mode: Private
   - Base URL: `http://localhost:8080`

3. **License**
   - Generate evaluation license at: https://my.atlassian.com/license/evaluation
   - Product: Jira Software (Server)
   - Organization: "DevBuddy Testing"

4. **Administrator Account**
   - Username: `admin`
   - Password: `admin123`
   - Email: `admin@example.com`

5. **Create Test Project**
   - Name: "Test Project"
   - Key: `TEST`
   - Template: Scrum

### 3. Create Test Data

Create these test issues in Jira UI:

```
TEST-1: "Set up authentication" (To Do)
TEST-2: "Implement ticket fetching" (In Progress, assign to yourself)
TEST-3: "Add comment support" (To Do)
TEST-4: "Test workflow transitions" (Done)
TEST-5: "Multi-version compatibility" (In Progress, assign to yourself)
```

### 4. Configure VS Code

In VS Code, press F5 to launch Extension Development Host.

In the Extension Development Host, run:
```
Command Palette → DevBuddy: Setup Jira Server/Data Center
```

Enter:
- **Server URL**: `http://localhost:8080`
- **Username**: `admin`
- **Auth Method**: Password (or PAT if you created one)
- **Password**: `admin123`

### 5. Test Core Features

#### Test 1: View Tickets
- Open DevBuddy sidebar
- Should show TEST-1 through TEST-5
- Should show correct statuses

✅ **Expected**: All 5 tickets visible, grouped by status

#### Test 2: Server Info
```
Command Palette → DevBuddy: Show Jira Server Info
```

✅ **Expected**: Shows version 9.12.0, capabilities, server details

#### Test 3: Fetch My Issues
- Should see TEST-2 and TEST-5 (assigned to you)
- Click on TEST-2 to view details

✅ **Expected**: Issue details panel opens, shows correct data

#### Test 4: Update Status
- Right-click TEST-3
- Select "Update Status"
- Choose "In Progress"

✅ **Expected**: Status changes in both DevBuddy and Jira UI

#### Test 5: Add Comment
- Right-click TEST-2
- Select "Add Comment"
- Type: "Testing comments from DevBuddy"

✅ **Expected**: Comment appears in Jira UI

#### Test 6: Create Ticket
```
Command Palette → DevBuddy: Create Ticket
```

- Title: "New ticket from DevBuddy"
- Description: "Created via Jira Server integration"
- Type: Task

✅ **Expected**: New ticket TEST-6 created and visible

#### Test 7: TODO Converter (if implemented)
```typescript
// TODO: Test Jira Server integration
```

Right-click TODO → "DevBuddy: Convert TODO to Ticket"

✅ **Expected**: Creates ticket with permalink to code

### 6. Check Logs

View DevBuddy logs:
```
View → Output → Select "DevBuddy"
```

✅ **Expected**: No errors, shows successful API calls

---

## Multi-Version Testing

### Overview

Test against 4 LTS versions to ensure compatibility:
- Jira 8.5 LTS (port 8080)
- Jira 8.20 LTS (port 8081)
- Jira 9.4 LTS (port 8082)
- Jira 9.12 LTS (port 8083)

### 1. Start All Versions

```bash
cd test-env/jira-server/versions
./start-all.sh
```

Wait ~20 minutes for all to start (they start sequentially to avoid overwhelming your system).

### 2. Setup Each Version

Run setup wizard for each:

**Jira 8.5** (http://localhost:8080)
**Jira 8.20** (http://localhost:8081)
**Jira 9.4** (http://localhost:8082)
**Jira 9.12** (http://localhost:8083)

For each:
1. Database: Same settings, but use unique database name
   - Database: `jiradb_85`, `jiradb_820`, `jiradb_94`, `jiradb_912`
2. Admin: `admin` / `admin123`
3. Project: Create TEST project with same issues

### 3. Test Against Each Version

For each version, update VS Code settings:

```json
{
  "devBuddy.jira.server.baseUrl": "http://localhost:8080", // Change port for each version
  "devBuddy.jira.server.username": "admin"
}

Then run:
```bash
Command Palette → DevBuddy: Test Jira Server Connection
```

### 4. Version-Specific Tests

#### Jira 8.5 LTS
- ✅ Basic Auth (no PAT support)
- ✅ Plain text descriptions (ADF may not work)
- ✅ Core CRUD operations
- ❌ Personal Access Tokens (not supported)

#### Jira 8.20 LTS
- ✅ Basic Auth
- ✅ PAT support (8.14+)
- ✅ ADF (Rich Text)
- ✅ Workflow properties
- ✅ All core features

#### Jira 9.4 LTS
- ✅ Full PAT support
- ✅ ADF (Rich Text)
- ✅ Custom field schemas
- ✅ All features

#### Jira 9.12 LTS
- ✅ Latest features
- ✅ All capabilities
- ✅ Best performance

### 5. Capability Detection Test

For each version, check that DevBuddy correctly detects capabilities:

```bash
Command Palette → DevBuddy: Show Jira Server Info
```

Verify:
- **8.5**: personalAccessTokens = false
- **8.20**: personalAccessTokens = true
- **9.4**: customFieldSchemas = true
- **9.12**: All capabilities = true

---

## Automated Testing (Future)

### Test Script Template

```typescript
// tests/jira-server.test.ts
describe('Jira Server Integration', () => {
  const versions = [
    { version: '8.5', port: 8080, pat: false },
    { version: '8.20', port: 8081, pat: true },
    { version: '9.4', port: 8082, pat: true },
    { version: '9.12', port: 8083, pat: true },
  ];

  versions.forEach(({ version, port, pat }) => {
    describe(`Jira ${version}`, () => {
      it('should detect server version', async () => {
        const client = await JiraServerClient.create();
        const serverInfo = client.getServerInfo();
        expect(serverInfo?.version).toContain(version);
      });

      it('should detect PAT capability', async () => {
        const client = await JiraServerClient.create();
        const capabilities = client.getCapabilities();
        expect(capabilities?.personalAccessTokens).toBe(pat);
      });

      it('should fetch issues', async () => {
        const client = await JiraServerClient.create();
        const issues = await client.getMyIssues();
        expect(issues.length).toBeGreaterThan(0);
      });

      it('should create issue', async () => {
        const client = await JiraServerClient.create();
        const issue = await client.createIssue({
          projectKey: 'TEST',
          summary: `Test issue for ${version}`,
          issueTypeName: 'Task',
        });
        expect(issue).not.toBeNull();
        expect(issue?.key).toMatch(/TEST-\d+/);
      });
    });
  });
});
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080
kill <PID>

# Or change port in docker-compose.yml
ports:
  - "8081:8080"
```

### Docker Out of Memory

```bash
# Increase Docker Desktop memory
# Docker Desktop → Settings → Resources → Memory (4GB minimum, 8GB recommended)

# Or stop other containers
docker stop $(docker ps -q)
```

### Jira Won't Start

```bash
# Check logs
docker-compose logs jira

# Common issues:
# 1. Insufficient memory → Increase Docker RAM
# 2. Database connection failed → Check postgres container
# 3. Port conflict → Change port mapping

# Reset everything
docker-compose down -v
docker-compose up -d
```

### Connection Test Fails

1. **Check URL**: Should be `http://localhost:8080` (not https)
2. **Check credentials**: Username `admin`, password `admin123`
3. **Check Jira is ready**: May take 5-10 minutes to fully start
4. **Check logs**: View → Output → DevBuddy

### Authentication Errors

**401 Unauthorized**:
- Wrong username or password
- Try Basic Auth instead of PAT

**403 Forbidden**:
- User doesn't have permissions
- Make sure admin account is used

### API Version Errors

If you see errors about missing API endpoints:
- Check server version: `DevBuddy: Show Jira Server Info`
- Some features require newer versions
- Fallback to basic features if needed

---

## Testing Checklist

### Basic Functionality
- [ ] Setup wizard completes successfully
- [ ] Connection test passes
- [ ] Server info displays correctly
- [ ] Version detection works
- [ ] Capability detection is accurate

### Issue Operations
- [ ] Fetch my issues
- [ ] View issue details
- [ ] Create new issue
- [ ] Update issue (title, description)
- [ ] Update status (workflow transitions)
- [ ] Add comment
- [ ] Assign issue
- [ ] Copy issue key
- [ ] Copy issue URL

### UI Features
- [ ] Sidebar shows issues
- [ ] Issues grouped by status
- [ ] Icons display correctly
- [ ] Context menus work
- [ ] Webview panels open

### Multi-Version
- [ ] Works on Jira 8.5
- [ ] Works on Jira 8.20
- [ ] Works on Jira 9.4
- [ ] Works on Jira 9.12
- [ ] Capabilities detected correctly for each version

### Error Handling
- [ ] Graceful handling of network errors
- [ ] Helpful error messages
- [ ] Logs show useful debug info
- [ ] No crashes or uncaught exceptions

### Performance
- [ ] Issues load in < 2 seconds
- [ ] No UI freezing
- [ ] Logs don't show excessive API calls

---

## Cleanup

### Stop Jira Server

```bash
cd test-env/jira-server
docker-compose stop
```

### Remove All Data (Reset)

```bash
docker-compose down -v
```

### Stop All Versions

```bash
cd test-env/jira-server/versions
./stop-all.sh

# Or remove all data
./clean-all.sh
```

---

## Next Steps

1. ✅ Complete single-version testing (9.12)
2. ✅ Fix any issues found
3. ✅ Test multi-version compatibility
4. ✅ Document any version-specific quirks
5. 📋 Create automated tests
6. 📋 Test with real Jira Server installations
7. 📋 Performance testing with large datasets
8. 📋 Security audit of authentication

---

## Resources

- **Jira Server REST API v2**: https://docs.atlassian.com/software/jira/docs/api/REST/9.12.0/
- **Version Compatibility**: `docs/planning/JIRA_VERSION_COMPATIBILITY.md`
- **Docker Setup**: `test-env/jira-server/README.md`
- **Implementation Details**: `src/providers/jira/server/README.md`

---

**Last Updated**: November 2024  
**Status**: Ready for Testing  
**Contact**: Check logs if you encounter issues


