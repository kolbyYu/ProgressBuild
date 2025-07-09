#!/bin/bash

# Fix Hermes dSYM issue by rebuilding archive properly
set -e

echo "🔧 Fixing Hermes dSYM issue..."

# Clean build directory (already done)
echo "🧹 Build directory already cleaned"

# Build and archive with proper dSYM generation
echo "🔨 Creating new archive with dSYM..."
cd ios

# Clean first
xcodebuild clean -workspace ProgressBuild.xcworkspace -scheme ProgressBuild -configuration Release

# Archive with dSYM
xcodebuild archive \
    -workspace ProgressBuild.xcworkspace \
    -scheme ProgressBuild \
    -configuration Release \
    -archivePath build/ProgressBuild.xcarchive \
    -destination 'generic/platform=iOS' \
    -allowProvisioningUpdates \
    DEBUG_INFORMATION_FORMAT=dwarf-with-dsym

cd ..

# Verify the result
echo "🔍 Verifying archive..."
if [ -d "ios/build/ProgressBuild.xcarchive" ]; then
    echo "✅ Archive created successfully"
    
    # Check dSYM
    if [ -d "ios/build/ProgressBuild.xcarchive/dSYMs/hermes.framework.dSYM" ]; then
        echo "✅ hermes.framework.dSYM included"
        
        # Check UUID
        DWARF_FILE="ios/build/ProgressBuild.xcarchive/dSYMs/hermes.framework.dSYM/Contents/Resources/DWARF/hermes"
        if [ -f "$DWARF_FILE" ]; then
            echo "🔍 UUID check:"
            dwarfdump --uuid "$DWARF_FILE"
        fi
    else
        echo "❌ hermes.framework.dSYM missing"
    fi
else
    echo "❌ Archive creation failed"
fi

echo ""
echo "🎉 Done! You can now upload the archive to App Store Connect." 