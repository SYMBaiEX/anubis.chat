#!/bin/bash

# ISIS Chat Development Server Script
# This script ensures the dev server stays running

echo "Starting ISIS Chat development servers..."
echo "========================================="
echo ""
echo "Web App: http://localhost:3001"
echo "Documentation: http://localhost:4000"
echo "Convex Dashboard: https://dashboard.convex.dev"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "========================================="
echo ""

# Run turbo dev and keep it running
exec bun run dev