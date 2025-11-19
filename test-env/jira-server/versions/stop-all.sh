#!/bin/bash
# Stop all Jira Server versions

echo "⏹️  Stopping all Jira Server test environments..."
echo ""

# Function to stop a version
stop_version() {
  local version=$1
  
  echo "Stopping Jira ${version}..."
  cd "v${version}" && docker-compose stop && cd ..
  
  if [ $? -eq 0 ]; then
    echo "✅ Jira ${version} stopped"
  else
    echo "❌ Failed to stop Jira ${version}"
  fi
  echo ""
}

# Stop all versions
stop_version "8.5"
stop_version "8.20"
stop_version "9.4"
stop_version "9.12"

echo "✅ All versions stopped"
echo ""
echo "To restart: ./start-all.sh"
echo "To remove all data: ./clean-all.sh"

