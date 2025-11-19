# Jira Server/Data Center Test Environment

This Docker setup provides a local Jira Server instance for developing and testing the DevBuddy Jira Enterprise integration.

## Prerequisites

- Docker Desktop (4GB+ RAM recommended)
- 10GB+ free disk space
- macOS/Linux: Docker Compose V2
- Windows: WSL2 + Docker Desktop

## Quick Start

### 1. Initial Setup

```bash
# Navigate to this directory
cd test-env/jira-server

# Copy environment template
cp .env.example .env

# Start containers (first run takes ~5-10 minutes)
docker-compose up -d

# Watch startup progress
docker-compose logs -f jira
```

### 2. Access Jira

Open browser: http://localhost:8080

**First-time setup wizard:**

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
   - Mode: Private (recommended for testing)
   - Base URL: `http://localhost:8080`

3. **License**
   - Option 1: Generate evaluation license (90 days)
     - Go to https://my.atlassian.com/license/evaluation
     - Product: Jira Software (Server)
     - Organization: "DevBuddy Testing"
   - Option 2: Use existing license key

4. **Administrator Account**
   - Username: `admin`
   - Password: `admin` (or your choice)
   - Email: your-email@example.com

5. **Email Notifications**
   - Skip for testing (can configure later)

6. **Create Test Project**
   - Name: "Test Project"
   - Key: `TEST`
   - Template: Scrum or Kanban

### 3. Configure DevBuddy

In VS Code settings (`.vscode/settings.json` or User Settings):

```json
{
  "devBuddy.provider": "jira",
  "devBuddy.jira.type": "server",
  "devBuddy.jira.server.baseUrl": "http://localhost:8080",
  "devBuddy.jira.server.username": "admin",
  "devBuddy.jira.defaultProject": "TEST"
}
```

**API Token:** DevBuddy will prompt for your password (or PAT) on first use.

### 4. Create Test Data

Create sample issues for testing:

```bash
# Access Jira: http://localhost:8080
# Project: TEST

Issues to create:
- TEST-1: "Set up authentication" (To Do)
- TEST-2: "Implement ticket fetching" (In Progress) 
- TEST-3: "Add comment support" (To Do)
- TEST-4: "Test workflow transitions" (Done)
```

## Testing Workflow

### Start Development Session

```bash
# Start Jira Server
docker-compose up -d

# Verify it's ready
curl http://localhost:8080/status

# Open VS Code
code /path/to/developer-buddy

# Press F5 to launch Extension Development Host
```

### Test Features

1. **Basic Connection**
   - Command: "DevBuddy: Configure Jira"
   - Verify: Can fetch issues from TEST project

2. **View Tickets**
   - Open DevBuddy sidebar
   - Should show TEST-1, TEST-2, TEST-3, TEST-4

3. **Update Status**
   - Right-click ticket → "Update Status"
   - Verify status changes in Jira

4. **Create Ticket**
   - Command: "DevBuddy: Create Ticket"
   - Should create new TEST-X issue

5. **TODO Converter**
   - Add TODO comment in code
   - Right-click → "DevBuddy: Convert TODO to Ticket"
   - Should create Jira issue with permalink

### Stop Development Session

```bash
# Stop containers (preserves data)
docker-compose stop

# Or completely remove (deletes all data)
docker-compose down -v
```

## Jira REST API Testing

The Jira Server REST API is available at:

```
http://localhost:8080/rest/api/2/
```

### Test API Endpoints

```bash
# Get server info
curl -u admin:admin http://localhost:8080/rest/api/2/serverInfo

# Get current user
curl -u admin:admin http://localhost:8080/rest/api/2/myself

# Search issues (JQL)
curl -u admin:admin \
  "http://localhost:8080/rest/api/2/search?jql=project=TEST"

# Get issue details
curl -u admin:admin \
  http://localhost:8080/rest/api/2/issue/TEST-1

# Get transitions (workflow states)
curl -u admin:admin \
  http://localhost:8080/rest/api/2/issue/TEST-1/transitions

# Create issue
curl -u admin:admin \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": {"key": "TEST"},
      "summary": "New issue from API",
      "description": "Created via REST API",
      "issuetype": {"name": "Task"}
    }
  }' \
  http://localhost:8080/rest/api/2/issue
```

## API Differences: Server vs Cloud

| Feature | Jira Server (v9) | Jira Cloud |
|---------|------------------|------------|
| **API Version** | `/rest/api/2/` | `/rest/api/3/` |
| **Authentication** | Basic (username:password) or PAT | OAuth 2.0 or API token |
| **Base URL** | Self-hosted (localhost:8080) | `{site}.atlassian.net` |
| **Custom Fields** | `customfield_10000` | Different IDs |
| **Rate Limits** | None (self-hosted) | Yes (Cloud) |
| **Webhooks** | Manual setup | Cloud-managed |
| **API Tokens** | Personal Access Token (v7.9+) | Cloud API token |

## Common Issues

### Port 8080 Already in Use

```bash
# Option 1: Change port in docker-compose.yml
ports:
  - "8081:8080"  # Use 8081 instead

# Option 2: Find and stop conflicting service
lsof -i :8080
kill <PID>
```

### Container Won't Start

```bash
# Check logs
docker-compose logs jira

# Common causes:
# - Insufficient memory (increase Docker Desktop RAM)
# - Port conflict (see above)
# - Corrupted volume (docker-compose down -v)
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

### Jira is Slow

```bash
# Increase memory in docker-compose.yml
environment:
  JVM_MINIMUM_MEMORY: 2048m
  JVM_MAXIMUM_MEMORY: 4096m

# Restart container
docker-compose restart jira
```

### Reset Everything

```bash
# Stop and remove all data
docker-compose down -v

# Remove Docker images (optional)
docker rmi atlassian/jira-software:9.12.0
docker rmi postgres:14

# Start fresh
docker-compose up -d
```

## Versions Supported

This setup uses **Jira Software 9.12.0** (latest LTS as of Nov 2024).

To test different versions:

```yaml
# In docker-compose.yml, change:
image: atlassian/jira-software:9.12.0

# To:
image: atlassian/jira-software:8.20.0  # Older LTS
image: atlassian/jira-software:9.4.0   # Previous LTS
```

Available versions: https://hub.docker.com/r/atlassian/jira-software/tags

## Data Persistence

Data is stored in Docker volumes:

```bash
# List volumes
docker volume ls | grep devbuddy

# Backup volume
docker run --rm -v devbuddy-jira-data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/jira-backup.tar.gz /data

# Restore volume
docker run --rm -v devbuddy-jira-data:/data -v $(pwd):/backup \
  ubuntu tar xzf /backup/jira-backup.tar.gz -C /
```

## Resources

- **Jira Server Admin Docs**: https://confluence.atlassian.com/adminjiraserver/
- **Jira REST API v2**: https://docs.atlassian.com/software/jira/docs/api/REST/9.12.0/
- **Docker Image**: https://hub.docker.com/r/atlassian/jira-software
- **Evaluation License**: https://my.atlassian.com/license/evaluation

## Next Steps

After setup is complete:

1. ✅ Jira Server running on http://localhost:8080
2. ✅ Test project created (TEST)
3. ✅ Sample issues created
4. 📋 Implement `JiraServerProvider` (extends `BaseTicketProvider`)
5. 📋 Test authentication flow
6. 📋 Test CRUD operations
7. 📋 Test workflow transitions
8. 📋 Test TODO converter with permalinks

---

**Remember:** This is a test environment. Never use production credentials or data.

