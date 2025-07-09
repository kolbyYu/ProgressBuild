#!/bin/bash

# Fix React Native New Architecture build issues
# This script properly generates codegen files and rebuilds the project

set -e

echo "🔧 Fixing React Native New Architecture build issues..."

# Navigate to project root
cd "$(dirname "$0")"

# 1. Clean React Native cache
echo "🧹 Cleaning React Native cache..."
npx react-native clean

# 2. Clean iOS specific files
echo "🧹 Cleaning iOS build artifacts..."
cd ios
rm -rf Pods
rm -rf build
rm -rf DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData/ProgressBuild*

# 3. Install CocoaPods (check if available)
if command -v pod >/dev/null 2>&1; then
    echo "📦 Installing CocoaPods dependencies..."
    pod install --repo-update
else
    echo "❌ CocoaPods not found. Installing via gem..."
    gem install cocoapods
    pod install --repo-update
fi

cd ..

# 4. Generate codegen files manually
echo "🔨 Generating New Architecture codegen files..."
npx react-native codegen --platform ios --outputPath ios/build/generated/ios

# 5. Ensure codegen files are properly structured
echo "🔍 Verifying codegen files..."
if [ -d "ios/build/generated/ios" ]; then
    echo "✅ Codegen files generated successfully"
    ls -la ios/build/generated/ios/
else
    echo "❌ Codegen generation failed"
    exit 1
fi

# 6. Build the project
echo "🔨 Building the project..."
cd ios

# First, clean build
xcodebuild clean -workspace ProgressBuild.xcworkspace -scheme ProgressBuild -configuration Release

# Then build
xcodebuild build -workspace ProgressBuild.xcworkspace -scheme ProgressBuild -configuration Release -destination 'generic/platform=iOS' -allowProvisioningUpdates

# Finally, archive
xcodebuild archive \
    -workspace ProgressBuild.xcworkspace \
    -scheme ProgressBuild \
    -configuration Release \
    -archivePath build/ProgressBuild.xcarchive \
    -destination 'generic/platform=iOS' \
    -allowProvisioningUpdates \
    DEBUG_INFORMATION_FORMAT=dwarf-with-dsym

cd ..

# 7. Verify the result
echo "🔍 Verifying build results..."
if [ -d "ios/build/ProgressBuild.xcarchive" ]; then
    echo "✅ Archive created successfully"
    
    # Check dSYM
    if [ -d "ios/build/ProgressBuild.xcarchive/dSYMs/hermes.framework.dSYM" ]; then
        echo "✅ hermes.framework.dSYM included"
    else
        echo "⚠️  hermes.framework.dSYM not found, but archive was created"
    fi
    
    echo "📋 Archive details:"
    echo "   Path: ios/build/ProgressBuild.xcarchive"
    echo "   Size: $(du -h ios/build/ProgressBuild.xcarchive | cut -f1)"
    echo "   Created: $(date)"
else
    echo "❌ Archive creation failed"
    exit 1
fi

echo ""
echo "🎉 Build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Open Xcode Organizer (Window → Organizer)"
echo "2. Select your new archive"
echo "3. Click 'Distribute App'"
echo "4. Choose 'App Store Connect' → 'Upload'"
echo "5. Complete the upload process" 