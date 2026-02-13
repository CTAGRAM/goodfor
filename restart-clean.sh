#!/bin/bash

# Restart Expo with Clean Cache
# This script ensures all old cached code is cleared

echo "🧹 Cleaning cache and restarting Expo..."

# Kill any running Expo/Metro processes
pkill -f "expo start" 2>/dev/null
pkill -f "metro" 2>/dev/null
sleep 2

# Clear watchman cache
echo "Clearing watchman cache..."
watchman watch-del-all 2>/dev/null || echo "Watchman not installed (OK to skip)"

# Clear Metro cache
echo "Clearing Metro bundler cache..."
rm -rf $TMPDIR/metro-* 2>/dev/null
rm -rf $TMPDIR/haste-* 2>/dev/null
rm -rf $TMPDIR/react-* 2>/dev/null

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# Start fresh
echo ""
echo "✅ Cache cleared!"
echo "🚀 Starting Expo with --clear flag..."
echo ""

npx expo start --clear
