#!/bin/bash

# Manual fix for React Native New Architecture codegen issues
# This script generates the missing codegen files

set -e

echo "🔧 Manually fixing React Native New Architecture codegen..."

# Navigate to project root
cd "$(dirname "$0")"

# 1. Clean React Native cache
echo "🧹 Cleaning React Native cache..."
npx react-native clean

# 2. Generate codegen files manually
echo "🔨 Generating New Architecture codegen files..."
npx react-native codegen --platform ios --outputPath ios/build/generated/ios

# 3. Verify codegen files
echo "🔍 Verifying codegen files..."
if [ -d "ios/build/generated/ios" ]; then
    echo "✅ Codegen files generated successfully"
    echo "📁 Generated files:"
    find ios/build/generated/ios -name "*.cpp" -o -name "*.mm" -o -name "*.h" | head -20
    echo "   ... and more"
else
    echo "❌ Codegen generation failed"
    exit 1
fi

echo ""
echo "🎉 Codegen files generated successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Open Xcode and open ios/ProgressBuild.xcworkspace"
echo "2. Clean Build Folder (Product → Clean Build Folder)"
echo "3. Archive the project (Product → Archive)"
echo "4. The codegen files should now be properly included"
echo ""
echo "⚠️  If you still get errors, make sure to:"
echo "- Use the .xcworkspace file, not .xcodeproj"
echo "- Select 'Any iOS Device (arm64)' as the destination"
echo "- Ensure Release configuration is selected for Archive" 