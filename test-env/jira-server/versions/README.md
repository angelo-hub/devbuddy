# Multi-Version Jira Server Testing

This directory contains Docker Compose configurations for testing DevBuddy against multiple Jira Server versions.

## Available Versions

Each version runs on a different port to allow parallel testing:

| Version | Docker Compose | Port | Status | Notes |
|---------|----------------|------|--------|-------|
| **9.12 LTS** | `v9.12/docker-compose.yml` | 8083 | Latest | Current LTS, May 2027 EOL |
| **9.4 LTS** | `v9.4/docker-compose.yml` | 8082 | Active | Oct 2025 EOL |
| **8.20 LTS** | `v8.20/docker-compose.yml` | 8081 | EOL | Feb 2024 EOL (still widely used) |
| **8.5 LTS** | `v8.5/docker-compose.yml` | 8080 | EOL | Feb 2023 EOL (legacy testing) |

## Quick Start

### Start All Versions (Parallel Testing)

```bash
# Start all versions at once
./start-all.sh

# Access:
# - v8.5:  http://localhost:8080
# - v8.20: http://localhost:8081
# - v9.4:  http://localhost:8082
# - v9.12: http://localhost:8083
```

### Start Single Version

```bash
# Start specific version
cd v9.12
docker-compose up -d

# Access
open http://localhost:8083
```

### Stop All Versions

```bash
./stop-all.sh
```

## Testing Strategy

### 1. Feature Compatibility Testing

Test each major feature against all versions:

```bash
# Run automated tests against all versions
npm run test:jira-versions

# Manual testing checklist:
- [ ] Authentication (Basic Auth vs PAT)
- [ ] Fetch issues
- [ ] Create issue (with/without custom fields)
- [ ] Update status
- [ ] Add comments
- [ ] TODO converter with permalinks
```

### 2. API Endpoint Testing

Key differences to test:

| Feature | v8.5 | v8.20 | v9.4 | v9.12 |
|---------|------|-------|------|-------|
| Personal Access Tokens | ❌ | ✅ | ✅ | ✅ |
| Rich Text (ADF) | ✅ | ✅ | ✅ | ✅ |
| Bulk Operations | ✅ | ✅ | ✅ | ✅ |
| Workflow Properties | ❌ | ✅ | ✅ | ✅ |
| Custom Field Schemas | ❌ | ❌ | ✅ | ✅ |

### 3. Automated Test Suite

```typescript
// Run tests against all running versions
describe('Multi-Version Compatibility', () => {
  const testVersions = [
    { version: '8.5.0', port: 8080 },
    { version: '8.20.0', port: 8081 },
    { version: '9.4.0', port: 8082 },
    { version: '9.12.0', port: 8083 },
  ];
  
  testVersions.forEach(({ version, port }) => {
    describe(`Jira ${version}`, () => {
      it('should create issue', async () => {
        // Test implementation
      });
    });
  });
});
```

## Memory Requirements

Running multiple versions requires significant RAM:

| Versions Running | RAM Needed | Recommendation |
|------------------|------------|----------------|
| 1 version | 2-3 GB | Minimum for development |
| 2 versions | 4-5 GB | Reasonable for testing |
| 4 versions | 8-10 GB | Full compatibility testing |

**Adjust Docker Desktop memory allocation accordingly.**

## Setup Scripts

### start-all.sh

```bash
#!/bin/bash
# Start all Jira Server versions

echo "Starting Jira Server test environments..."

cd v8.5 && docker-compose up -d && cd ..
cd v8.20 && docker-compose up -d && cd ..
cd v9.4 && docker-compose up -d && cd ..
cd v9.12 && docker-compose up -d && cd ..

echo "✅ All versions started"
echo ""
echo "Access URLs:"
echo "  v8.5:  http://localhost:8080"
echo "  v8.20: http://localhost:8081"
echo "  v9.4:  http://localhost:8082"
echo "  v9.12: http://localhost:8083"
echo ""
echo "Note: First startup takes 5-10 minutes per instance"
```

### stop-all.sh

```bash
#!/bin/bash
# Stop all Jira Server versions

echo "Stopping all Jira Server test environments..."

cd v8.5 && docker-compose stop && cd ..
cd v8.20 && docker-compose stop && cd ..
cd v9.4 && docker-compose stop && cd ..
cd v9.12 && docker-compose stop && cd ..

echo "✅ All versions stopped"
echo ""
echo "To remove all data: ./clean-all.sh"
```

### clean-all.sh

```bash
#!/bin/bash
# Remove all Jira Server containers and volumes

echo "⚠️  WARNING: This will delete ALL data from all versions"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
  cd v8.5 && docker-compose down -v && cd ..
  cd v8.20 && docker-compose down -v && cd ..
  cd v9.4 && docker-compose down -v && cd ..
  cd v9.12 && docker-compose down -v && cd ..
  
  echo "✅ All environments cleaned"
else
  echo "Cancelled"
fi
```

## CI/CD Integration

For automated testing in CI:

```yaml
# .github/workflows/test-jira-compatibility.yml
name: Jira Version Compatibility

on: [push, pull_request]

jobs:
  test-jira-versions:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        jira-version: ['8.20', '9.4', '9.12']
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Start Jira ${{ matrix.jira-version }}
        run: |
          cd test-env/jira-server/versions/v${{ matrix.jira-version }}
          docker-compose up -d
          
      - name: Wait for Jira
        run: |
          timeout 300 bash -c 'until curl -f http://localhost:8080/status; do sleep 5; done'
          
      - name: Run tests
        run: |
          npm run test:jira-server -- --version=${{ matrix.jira-version }}
```

## Version-Specific Notes

### Jira 8.5 LTS
- **Auth:** Basic Auth only (no PAT)
- **Fields:** Use plain text descriptions
- **Testing Focus:** Baseline compatibility

### Jira 8.20 LTS
- **Auth:** Basic Auth or PAT (from 8.14+)
- **Fields:** ADF support, workflow properties
- **Testing Focus:** Modern enterprise baseline

### Jira 9.4 LTS
- **Auth:** PAT recommended
- **Fields:** Full ADF, custom field schemas
- **Testing Focus:** Current enterprise standard

### Jira 9.12 LTS
- **Auth:** PAT recommended
- **Fields:** Latest ADF features
- **Testing Focus:** Latest features, future-proofing

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :8080

# Change port in docker-compose.yml
ports:
  - "8084:8080"  # Use different external port
```

### Container Won't Start

```bash
# Check logs for specific version
cd v9.12
docker-compose logs -f

# Common issues:
# - Insufficient memory (increase Docker Desktop RAM)
# - Port conflict (change port mapping)
# - Volume corruption (docker-compose down -v)
```

### Out of Memory

```bash
# Check Docker stats
docker stats

# If memory usage is high, stop some versions:
cd v8.5 && docker-compose stop && cd ..
cd v8.20 && docker-compose stop && cd ..

# Keep only the versions you're actively testing
```

---

**Remember:** This is for testing only. These scripts create fresh Jira instances - never use production data here.

