#!/bin/bash

# Xcode构建阶段脚本：自动生成Hermes dSYM文件
# 此脚本用于在Archive过程中自动检查和生成hermes.framework.dSYM

set -e

# 只在Release配置和Archive构建中运行
if [ "$CONFIGURATION" != "Release" ] || [ "$ACTION" != "install" ]; then
    echo "跳过 Hermes dSYM 生成（仅在 Release Archive 中运行）"
    exit 0
fi

echo "🔍 检查 Hermes dSYM 文件..."

# 查找hermes.framework
HERMES_FRAMEWORK_PATH=""
for framework in $(find "$BUILT_PRODUCTS_DIR" -name "hermes.framework" -type d); do
    if [ -f "$framework/hermes" ]; then
        HERMES_FRAMEWORK_PATH="$framework"
        break
    fi
done

if [ -z "$HERMES_FRAMEWORK_PATH" ]; then
    echo "⚠️  未找到 hermes.framework，跳过 dSYM 生成"
    exit 0
fi

echo "✅ 找到 hermes.framework: $HERMES_FRAMEWORK_PATH"

# 检查hermes二进制文件
HERMES_BINARY="$HERMES_FRAMEWORK_PATH/hermes"
if [ ! -f "$HERMES_BINARY" ]; then
    echo "❌ hermes 二进制文件不存在: $HERMES_BINARY"
    exit 1
fi

# 检查是否有调试符号
if ! dwarfdump --uuid "$HERMES_BINARY" | grep -q "UUID"; then
    echo "⚠️  hermes 二进制文件没有调试符号，跳过 dSYM 生成"
    exit 0
fi

echo "📋 hermes 二进制文件 UUID:"
dwarfdump --uuid "$HERMES_BINARY"

# 生成dSYM文件
DSYM_OUTPUT="$DWARF_DSYM_FOLDER_PATH/hermes.framework.dSYM"
echo "🔧 生成 dSYM 文件到: $DSYM_OUTPUT"

if dsymutil "$HERMES_BINARY" -o "$DSYM_OUTPUT"; then
    echo "✅ 成功生成 hermes.framework.dSYM"
    
    # 验证生成的dSYM文件
    HERMES_DWARF="$DSYM_OUTPUT/Contents/Resources/DWARF/hermes"
    if [ -f "$HERMES_DWARF" ]; then
        echo "✅ 验证生成的 dSYM 文件:"
        dwarfdump --uuid "$HERMES_DWARF"
    fi
else
    echo "❌ 生成 hermes.framework.dSYM 失败"
    exit 1
fi

echo "✅ Hermes dSYM 生成完成" 