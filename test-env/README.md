# Test Environment for DevBuddy

This directory contains Docker-based test environments for developing and testing DevBuddy integrations with various platforms.

**IMPORTANT:** This directory is **excluded from the extension bundle** via `.vscodeignore` and should never be packaged with the VSIX.

## Directory Structure

```
test-env/
├── README.md                    # This file
├── jira-server/                 # Jira Server/Data Center (Enterprise)
│   ├── docker-compose.yml       # Docker setup for Jira Server
│   ├── .env.example             # Environment template
│   ├── .env                     # Local config (git-ignored)
│   └── README.md                # Jira Server setup guide
├── jira-cloud/                  # Jira Cloud test account info
│   └── README.md                # Cloud testing guide
├── linear/                      # Linear test data/mocks
│   └── README.md                # Linear testing guide
└── shared/                      # Shared test utilities
    └── mock-data/               # Mock API responses
```

## Isolation Strategy

### 1. Build System Isolation

- **Location:** `test-env/` at repository root
- **Excluded from VSIX:** Via `.vscodeignore` pattern
- **Excluded from Git (sensitive files):** Via `.gitignore` patterns
- **No code imports:** Extension code never imports from `test-env/`

### 2. What Gets Excluded

```
test-env/**           # Entire test environment directory
**/docker-compose.yml # All Docker configs
**/.env*              # All environment files
**/Dockerfile         # Docker build files
```

### 3. Verification

After setup, verify exclusion:

```bash
# Build extension
npm run package

# Extract and check contents
unzip -l dev-buddy-*.vsix | grep test-env

# Should return: (empty - no matches)
```

## Quick Start

### Jira Server (Enterprise)

```bash
cd test-env/jira-server
cp .env.example .env
docker-compose up -d
```

Access: http://localhost:8080

### Jira Cloud

See `test-env/jira-cloud/README.md` for setting up a free Jira Cloud test site.

### Linear

Use your existing Linear workspace or create a test workspace at https://linear.app

## Environment Variables

Each test environment has its own `.env` file:

```bash
test-env/jira-server/.env     # Jira Server credentials
test-env/jira-cloud/.env      # Jira Cloud API tokens
test-env/linear/.env          # Linear API keys
```

**These are git-ignored and NEVER packaged.**

## Development Workflow

1. **Start test environment:**
   ```bash
   cd test-env/jira-server
   docker-compose up -d
   ```

2. **Configure VS Code settings:**
   ```json
   {
     "devBuddy.provider": "jira",
     "devBuddy.jira.type": "server",
     "devBuddy.jira.server.baseUrl": "http://localhost:8080"
   }
   ```

3. **Develop and test:**
   - Press F5 to launch Extension Development Host
   - Test with local Jira Server instance

4. **Stop test environment:**
   ```bash
   docker-compose down
   ```

## Security Notes

- ✅ All Docker configs excluded from VSIX
- ✅ Environment files git-ignored
- ✅ No production credentials in test environments
- ✅ Test data isolated from production
- ✅ Local-only network access (no external exposure)

## Troubleshooting

### Docker Issues

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f jira

# Reset environment
docker-compose down -v
docker-compose up -d
```

### Port Conflicts

If port 8080 is in use:

1. Edit `docker-compose.yml`
2. Change `8080:8080` to `8081:8080`
3. Update your VS Code settings accordingly

## Adding New Test Environments

To add a new platform test environment:

1. Create directory: `test-env/[platform-name]/`
2. Add Docker setup files
3. Create platform-specific README
4. Update this README with quick start
5. Verify exclusion patterns in `.vscodeignore`

---

**Remember:** This directory exists only for development and testing. It should never be packaged with the extension or contain production credentials.

