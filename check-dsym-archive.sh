#!/bin/bash

# 检查并生成缺失的Hermes dSYM文件
# 使用方法: ./check-dsym-archive.sh [archive_path]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Hermes dSYM Generator ===${NC}"

# 如果没有提供archive路径，则查找最新的ProgressBuild archive
if [ -z "$1" ]; then
    echo "正在查找最新的ProgressBuild archive..."
    ARCHIVE_PATH=$(find ~/Library/Developer/Xcode/Archives -name "ProgressBuild*.xcarchive" -type d | sort -r | head -1)
    
    if [ -z "$ARCHIVE_PATH" ]; then
        echo -e "${RED}错误: 没有找到ProgressBuild的archive文件${NC}"
        echo "请确保已经成功创建了archive，或者手动指定archive路径:"
        echo "  $0 /path/to/your/archive.xcarchive"
        exit 1
    fi
else
    ARCHIVE_PATH="$1"
fi

echo -e "${GREEN}检查 Archive: ${ARCHIVE_PATH}${NC}"

# 检查archive是否存在
if [ ! -d "$ARCHIVE_PATH" ]; then
    echo -e "${RED}错误: Archive不存在: $ARCHIVE_PATH${NC}"
    exit 1
fi

# 检查dSYM目录
DSYM_DIR="$ARCHIVE_PATH/dSYMs"
if [ ! -d "$DSYM_DIR" ]; then
    echo -e "${RED}错误: dSYMs目录不存在: $DSYM_DIR${NC}"
    exit 1
fi

echo "检查现有的dSYM文件..."
ls -la "$DSYM_DIR"

# 检查是否已经有hermes.framework.dSYM
HERMES_DSYM="$DSYM_DIR/hermes.framework.dSYM"
if [ -d "$HERMES_DSYM" ]; then
    echo -e "${GREEN}✓ hermes.framework.dSYM 已存在${NC}"
    
    # 检查UUID
    HERMES_DWARF="$HERMES_DSYM/Contents/Resources/DWARF/hermes"
    if [ -f "$HERMES_DWARF" ]; then
        echo "检查UUID:"
        dwarfdump --uuid "$HERMES_DWARF"
    fi
    
    echo -e "${GREEN}dSYM检查完成！${NC}"
    exit 0
fi

echo -e "${YELLOW}hermes.framework.dSYM 不存在，开始生成...${NC}"

# 查找hermes.framework
HERMES_FRAMEWORK=$(find "$ARCHIVE_PATH" -name "hermes.framework" -type d)
if [ -z "$HERMES_FRAMEWORK" ]; then
    echo -e "${RED}错误: 在archive中没有找到hermes.framework${NC}"
    exit 1
fi

echo "找到 hermes.framework: $HERMES_FRAMEWORK"

# 查找hermes二进制文件
HERMES_BINARY="$HERMES_FRAMEWORK/hermes"
if [ ! -f "$HERMES_BINARY" ]; then
    echo -e "${RED}错误: hermes二进制文件不存在: $HERMES_BINARY${NC}"
    exit 1
fi

echo "检查hermes二进制文件的UUID..."
dwarfdump --uuid "$HERMES_BINARY"

echo -e "${YELLOW}开始生成hermes.framework.dSYM...${NC}"

# 使用dsymutil生成dSYM文件
if dsymutil "$HERMES_BINARY" -o "$HERMES_DSYM"; then
    echo -e "${GREEN}✓ 成功生成 hermes.framework.dSYM${NC}"
    
    # 验证生成的dSYM文件
    HERMES_DWARF="$HERMES_DSYM/Contents/Resources/DWARF/hermes"
    if [ -f "$HERMES_DWARF" ]; then
        echo "验证生成的dSYM文件UUID:"
        dwarfdump --uuid "$HERMES_DWARF"
    fi
    
    echo -e "${GREEN}最终dSYM文件列表:${NC}"
    ls -la "$DSYM_DIR"
    
    echo -e "${GREEN}✓ 完成！现在您可以重新上传到App Store Connect${NC}"
else
    echo -e "${RED}错误: 生成hermes.framework.dSYM失败${NC}"
    exit 1
fi
