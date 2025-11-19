#!/bin/bash
# Remove all Jira Server containers and volumes

echo "⚠️  WARNING: This will delete ALL data from all test environments"
echo "This includes:"
echo "  - All Jira issues and projects"
echo "  - All database data"
echo "  - All container volumes"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Cancelled"
  exit 0
fi

echo ""
echo "🗑️  Removing all Jira Server test environments..."
echo ""

# Function to clean a version
clean_version() {
  local version=$1
  
  echo "Cleaning Jira ${version}..."
  cd "v${version}" && docker-compose down -v && cd ..
  
  if [ $? -eq 0 ]; then
    echo "✅ Jira ${version} cleaned"
  else
    echo "❌ Failed to clean Jira ${version}"
  fi
  echo ""
}

# Clean all versions
clean_version "8.5"
clean_version "8.20"
clean_version "9.4"
clean_version "9.12"

echo "✅ All environments cleaned"
echo ""
echo "To start fresh: ./start-all.sh"

