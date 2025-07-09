#!/bin/bash

# 检查隐私权限配置脚本
set -e

echo "🔍 检查隐私权限配置..."

INFO_PLIST="ios/ProgressBuild/Info.plist"

if [ ! -f "$INFO_PLIST" ]; then
    echo "❌ Info.plist 文件不存在: $INFO_PLIST"
    exit 1
fi

echo "✅ Info.plist 文件存在"

# 检查必需的权限
echo ""
echo "📋 检查必需的隐私权限..."

# 1. NSPhotoLibraryUsageDescription
if grep -q "NSPhotoLibraryUsageDescription" "$INFO_PLIST"; then
    echo "✅ NSPhotoLibraryUsageDescription 存在"
    PHOTO_DESC=$(grep -A 1 "NSPhotoLibraryUsageDescription" "$INFO_PLIST" | grep "<string>" | sed 's/<[^>]*>//g' | xargs)
    if [ -n "$PHOTO_DESC" ] && [ "$PHOTO_DESC" != "" ]; then
        echo "   📝 说明: $PHOTO_DESC"
    else
        echo "   ❌ 说明为空"
    fi
else
    echo "❌ NSPhotoLibraryUsageDescription 缺失"
fi

# 2. NSLocationWhenInUseUsageDescription
if grep -q "NSLocationWhenInUseUsageDescription" "$INFO_PLIST"; then
    echo "✅ NSLocationWhenInUseUsageDescription 存在"
    LOCATION_DESC=$(grep -A 1 "NSLocationWhenInUseUsageDescription" "$INFO_PLIST" | grep "<string>" | sed 's/<[^>]*>//g' | xargs)
    if [ -n "$LOCATION_DESC" ] && [ "$LOCATION_DESC" != "" ]; then
        echo "   📝 说明: $LOCATION_DESC"
    else
        echo "   ❌ 说明为空"
    fi
else
    echo "❌ NSLocationWhenInUseUsageDescription 缺失"
fi

# 3. NSLocationAlwaysAndWhenInUseUsageDescription
if grep -q "NSLocationAlwaysAndWhenInUseUsageDescription" "$INFO_PLIST"; then
    echo "✅ NSLocationAlwaysAndWhenInUseUsageDescription 存在"
    LOCATION_ALWAYS_DESC=$(grep -A 1 "NSLocationAlwaysAndWhenInUseUsageDescription" "$INFO_PLIST" | grep "<string>" | sed 's/<[^>]*>//g' | xargs)
    if [ -n "$LOCATION_ALWAYS_DESC" ] && [ "$LOCATION_ALWAYS_DESC" != "" ]; then
        echo "   📝 说明: $LOCATION_ALWAYS_DESC"
    else
        echo "   ❌ 说明为空"
    fi
else
    echo "❌ NSLocationAlwaysAndWhenInUseUsageDescription 缺失"
fi

# 检查版本号
echo ""
echo "📋 检查版本信息..."
VERSION=$(grep -A 1 "CFBundleShortVersionString" "$INFO_PLIST" | grep "<string>" | sed 's/<[^>]*>//g' | xargs)
BUILD=$(grep -A 1 "CFBundleVersion" "$INFO_PLIST" | grep "<string>" | sed 's/<[^>]*>//g' | xargs)

echo "   📱 版本号: $VERSION"
echo "   🔢 构建号: $BUILD"

echo ""
echo "🎯 检查完成！"
echo ""
echo "📋 如果所有检查都通过，您可以运行:"
echo "   ./rebuild-and-upload.sh"
echo ""
echo "🚀 然后在 Xcode 中上传到 App Store"
