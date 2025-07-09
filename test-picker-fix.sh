#!/bin/bash

# 测试 iOS Picker 修复的脚本
# 用于验证时间选择器数字显示问题是否已解决

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== iOS Picker 修复测试 ===${NC}"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 检查是否有 ios 目录
if [ ! -d "ios" ]; then
    echo -e "${RED}错误: 没有找到 ios 目录${NC}"
    exit 1
fi

# 检查修复是否已应用
echo -e "${YELLOW}检查修复是否已应用...${NC}"

# 检查 NewRecordScreen.tsx 中的修复
if grep -q 'color="#333"' src/screens/NewRecordScreen.tsx; then
    echo -e "${GREEN}✓ Picker.Item color 属性已添加${NC}"
else
    echo -e "${RED}✗ Picker.Item color 属性未找到${NC}"
    exit 1
fi

if grep -q 'itemStyle={styles.pickerItem}' src/screens/NewRecordScreen.tsx; then
    echo -e "${GREEN}✓ Picker itemStyle 属性已添加${NC}"
else
    echo -e "${RED}✗ Picker itemStyle 属性未找到${NC}"
    exit 1
fi

if grep -q 'pickerItem:' src/screens/NewRecordScreen.tsx; then
    echo -e "${GREEN}✓ pickerItem 样式已定义${NC}"
else
    echo -e "${RED}✗ pickerItem 样式未找到${NC}"
    exit 1
fi

# 检查依赖
echo -e "${YELLOW}检查依赖...${NC}"
if grep -q '@react-native-picker/picker' package.json; then
    echo -e "${GREEN}✓ @react-native-picker/picker 依赖存在${NC}"
else
    echo -e "${RED}✗ @react-native-picker/picker 依赖不存在${NC}"
    exit 1
fi

# 清理并重新安装依赖
echo -e "${YELLOW}清理并重新安装依赖...${NC}"
npm ci

# 安装 iOS 依赖
echo -e "${YELLOW}安装 iOS 依赖...${NC}"
cd ios
pod install
cd ..

# 检查是否有 iOS 模拟器可用
echo -e "${YELLOW}检查 iOS 模拟器...${NC}"
if command -v xcrun &> /dev/null; then
    SIMULATORS=$(xcrun simctl list devices | grep -c "iPhone.*Booted" || echo "0")
    if [ "$SIMULATORS" -gt 0 ]; then
        echo -e "${GREEN}✓ 发现运行中的 iOS 模拟器${NC}"
    else
        echo -e "${YELLOW}⚠️  没有运行中的 iOS 模拟器${NC}"
        echo -e "${YELLOW}请启动 iOS 模拟器或连接 iOS 设备${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Xcode 工具未找到${NC}"
fi

# 构建项目
echo -e "${YELLOW}构建项目...${NC}"
if command -v npx &> /dev/null; then
    echo -e "${BLUE}开始构建 iOS 项目...${NC}"
    npx react-native run-ios --configuration Release
else
    echo -e "${RED}错误: npx 未找到${NC}"
    exit 1
fi

echo -e "${GREEN}=== 构建完成 ===${NC}"
echo -e "${BLUE}测试步骤:${NC}"
echo "1. 打开应用"
echo "2. 进入 New Work Record 页面"
echo "3. 点击 Begin Time 或 End Time"
echo "4. 检查时间选择器中的数字是否正常显示"
echo ""
echo -e "${YELLOW}如果数字仍然不显示，请查看 IOS_PICKER_FIX.md 中的替代方案${NC}" 