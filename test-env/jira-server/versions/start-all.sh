#!/bin/bash
# Start all Jira Server versions for compatibility testing

echo "🚀 Starting Jira Server test environments..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to start a version
start_version() {
  local version=$1
  local port=$2
  
  echo -e "${YELLOW}Starting Jira ${version} on port ${port}...${NC}"
  cd "v${version}" && docker-compose up -d && cd ..
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Jira ${version} started${NC}"
  else
    echo "❌ Failed to start Jira ${version}"
  fi
  echo ""
}

# Start all versions
start_version "8.5" "8080"
start_version "8.20" "8081"
start_version "9.4" "8082"
start_version "9.12" "8083"

echo -e "${GREEN}✅ All versions started${NC}"
echo ""
echo "Access URLs:"
echo "  Jira 8.5:  http://localhost:8080"
echo "  Jira 8.20: http://localhost:8081"
echo "  Jira 9.4:  http://localhost:8082"
echo "  Jira 9.12: http://localhost:8083"
echo ""
echo -e "${YELLOW}⚠️  Note: First startup takes 5-10 minutes per instance${NC}"
echo ""
echo "Check status: docker-compose ps"
echo "View logs: docker-compose logs -f jira"
echo "Stop all: ./stop-all.sh"

