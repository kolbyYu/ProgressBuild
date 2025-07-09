#!/bin/bash

# 完整的构建和上传流程
# 包含清理、构建、dSYM检查和导出IPA

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ProgressBuild 自动构建和导出 ===${NC}"

# 项目配置
PROJECT_NAME="ProgressBuild"
SCHEME_NAME="ProgressBuild"
WORKSPACE_PATH="ios/ProgressBuild.xcworkspace"
EXPORT_OPTIONS_PATH="ios/ExportOptions.plist"

# 检查必要文件
echo -e "${YELLOW}检查项目文件...${NC}"
if [ ! -f "$WORKSPACE_PATH" ]; then
    echo -e "${RED}错误: workspace文件不存在: $WORKSPACE_PATH${NC}"
    exit 1
fi

if [ ! -f "$EXPORT_OPTIONS_PATH" ]; then
    echo -e "${RED}错误: ExportOptions.plist不存在: $EXPORT_OPTIONS_PATH${NC}"
    exit 1
fi

# 步骤1: 清理
echo -e "${YELLOW}步骤1: 清理项目...${NC}"
echo "清理派生数据..."
rm -rf ~/Library/Developer/Xcode/DerivedData/ProgressBuild-*

echo "清理构建文件..."
cd ios
xcodebuild clean -workspace ProgressBuild.xcworkspace -scheme ProgressBuild -configuration Release
cd ..

echo "重新安装依赖..."
cd ios && pod install --clean-install && cd ..

echo -e "${GREEN}✓ 清理完成${NC}"

# 步骤2: 构建 Archive
echo -e "${YELLOW}步骤2: 创建 Archive...${NC}"
ARCHIVE_PATH="$(pwd)/build/ProgressBuild.xcarchive"
mkdir -p build

echo "开始 Archive 构建..."
cd ios
xcodebuild archive \
    -workspace ProgressBuild.xcworkspace \
    -scheme ProgressBuild \
    -configuration Release \
    -archivePath "../build/ProgressBuild.xcarchive" \
    -destination "generic/platform=iOS" \
    -quiet

cd ..

if [ ! -d "$ARCHIVE_PATH" ]; then
    echo -e "${RED}错误: Archive 创建失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Archive 创建成功: $ARCHIVE_PATH${NC}"

# 步骤3: 检查和生成 Hermes dSYM
echo -e "${YELLOW}步骤3: 检查和生成 Hermes dSYM...${NC}"

# 检查dSYM目录
DSYM_DIR="$ARCHIVE_PATH/dSYMs"
if [ ! -d "$DSYM_DIR" ]; then
    echo -e "${RED}错误: dSYMs目录不存在${NC}"
    exit 1
fi

echo "现有dSYM文件:"
ls -la "$DSYM_DIR"

# 检查是否已经有hermes.framework.dSYM
HERMES_DSYM="$DSYM_DIR/hermes.framework.dSYM"
if [ -d "$HERMES_DSYM" ]; then
    echo -e "${GREEN}✓ hermes.framework.dSYM 已存在${NC}"
else
    echo -e "${YELLOW}生成 hermes.framework.dSYM...${NC}"
    
    # 查找hermes.framework
    HERMES_FRAMEWORK=$(find "$ARCHIVE_PATH" -name "hermes.framework" -type d)
    if [ -z "$HERMES_FRAMEWORK" ]; then
        echo -e "${RED}错误: 在archive中没有找到hermes.framework${NC}"
        exit 1
    fi
    
    # 查找hermes二进制文件
    HERMES_BINARY="$HERMES_FRAMEWORK/hermes"
    if [ ! -f "$HERMES_BINARY" ]; then
        echo -e "${RED}错误: hermes二进制文件不存在: $HERMES_BINARY${NC}"
        exit 1
    fi
    
    echo "检查hermes二进制文件的UUID..."
    dwarfdump --uuid "$HERMES_BINARY"
    
    # 生成dSYM文件
    if dsymutil "$HERMES_BINARY" -o "$HERMES_DSYM"; then
        echo -e "${GREEN}✓ 成功生成 hermes.framework.dSYM${NC}"
        
        # 验证生成的dSYM文件
        HERMES_DWARF="$HERMES_DSYM/Contents/Resources/DWARF/hermes"
        if [ -f "$HERMES_DWARF" ]; then
            echo "验证生成的dSYM文件UUID:"
            dwarfdump --uuid "$HERMES_DWARF"
        fi
    else
        echo -e "${RED}错误: 生成hermes.framework.dSYM失败${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}最终dSYM文件列表:${NC}"
ls -la "$DSYM_DIR"

# 步骤4: 导出IPA
echo -e "${YELLOW}步骤4: 导出 IPA...${NC}"
EXPORT_PATH="$(pwd)/build/export"
mkdir -p "$EXPORT_PATH"

echo "开始导出 IPA..."
xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$EXPORT_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS_PATH" \
    -quiet

# 检查导出的IPA文件
IPA_FILE="$EXPORT_PATH/ProgressBuild.ipa"
if [ -f "$IPA_FILE" ]; then
    echo -e "${GREEN}✓ IPA 导出成功: $IPA_FILE${NC}"
    
    # 显示IPA文件信息
    echo "IPA文件大小: $(ls -lh "$IPA_FILE" | awk '{print $5}')"
else
    echo -e "${RED}错误: IPA 导出失败${NC}"
    exit 1
fi

echo -e "${GREEN}=== 构建和导出完成！ ===${NC}"
echo -e "${GREEN}✓ Archive: $ARCHIVE_PATH${NC}"
echo -e "${GREEN}✓ IPA: $IPA_FILE${NC}"
echo -e "${GREEN}✓ 包含完整的 dSYM 文件（包括 hermes.framework.dSYM）${NC}"

echo -e "${BLUE}上传到 App Store Connect:${NC}"
echo "方法1: 使用 Xcode Organizer"
echo "  1. 打开 Xcode → Window → Organizer"
echo "  2. 选择 Archives 标签"
echo "  3. 选择刚才创建的 archive"
echo "  4. 点击 'Distribute App' → 'App Store Connect' → 'Upload'"
echo ""
echo "方法2: 使用命令行 (需要配置 Apple ID 和 App-specific password)"
echo "  xcrun altool --upload-app -f \"$IPA_FILE\" -t ios -u \"your-apple-id@example.com\" -p \"your-app-specific-password\""
echo ""
echo "方法3: 使用 Transporter App"
echo "  1. 从 Mac App Store 下载 Transporter"
echo "  2. 打开 Transporter，登录 Apple ID"
echo "  3. 拖拽 IPA 文件到 Transporter"
echo "  4. 点击 'Deliver' 上传"
