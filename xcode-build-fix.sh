#!/bin/bash

# Fix for React Native New Architecture build in Xcode
# This script prepares the project for proper Xcode building

set -e

echo "🔧 Preparing React Native New Architecture build for Xcode..."

# Navigate to project root
cd "$(dirname "$0")"

# 1. Clean everything first
echo "🧹 Cleaning all build artifacts..."
rm -rf ios/build
rm -rf ios/DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData/ProgressBuild*

# 2. Clear React Native cache
echo "🧹 Clearing React Native cache..."
npx react-native clean --include metro,haste,react-native

# 3. Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# 4. Reinstall node_modules
echo "📦 Reinstalling node_modules..."
rm -rf node_modules
npm install

echo ""
echo "✅ Project prepared for Xcode build!"
echo ""
echo "📋 Next steps in Xcode:"
echo "1. Open Xcode"
echo "2. Open ios/ProgressBuild.xcworkspace (NOT .xcodeproj)"
echo "3. Select 'Any iOS Device (arm64)' as destination"
echo "4. Go to Product → Clean Build Folder (⌘⇧K)"
echo "5. Go to Product → Archive"
echo ""
echo "⚠️  Important notes:"
echo "- The first build will take longer as it generates codegen files"
echo "- If you get CocoaPods errors, install CocoaPods: sudo gem install cocoapods"
echo "- If you get 'pod install' errors, run: cd ios && pod install"
echo ""
echo "🎯 The New Architecture codegen files will be generated during the Xcode build process!" 