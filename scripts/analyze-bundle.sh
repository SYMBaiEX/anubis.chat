#!/bin/bash

# Bundle Analysis Script
# Builds the project and opens bundle analyzer

echo "🔍 Building project with bundle analysis..."

# Set environment variable to enable bundle analyzer
export ANALYZE=true

# Build the project
cd "$(dirname "$0")/.."
bun run build

echo "📊 Bundle analysis complete! Check the opened browser window for results."