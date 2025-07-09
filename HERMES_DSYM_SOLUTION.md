# Hermes dSYM 问题解决方案

## 问题描述

在React Native项目中使用Hermes引擎时，每次Archive都会出现以下错误：
```
The archive did not include a dSYM for the hermes.framework with the UUIDs [UUID]
```

这是因为Hermes framework的dSYM文件不会自动包含在Xcode Archive中，需要手动生成。

## 解决方案

我们提供了3种解决方案：

### 方案1：手动检查和生成（推荐）

使用 `check-dsym-archive.sh` 脚本：

```bash
# 检查最新的archive并生成缺失的dSYM
./check-dsym-archive.sh

# 或者指定特定的archive路径
./check-dsym-archive.sh /path/to/your/archive.xcarchive
```

**使用时机**：每次Archive后，上传到App Store Connect前。

### 方案2：完整的构建和导出流程

使用 `rebuild-and-upload.sh` 脚本：

```bash
# 执行完整的构建流程（清理、构建、检查dSYM、导出IPA）
./rebuild-and-upload.sh
```

**功能**：
- 清理项目和依赖
- 重新构建Archive
- 自动检查和生成Hermes dSYM
- 导出IPA文件
- 提供上传指导

### 方案3：Xcode构建阶段自动化（高级）

将 `ios/generate-hermes-dsym.sh` 脚本添加到Xcode构建阶段：

1. 打开Xcode项目
2. 选择项目 → Targets → ProgressBuild
3. 选择 "Build Phases" 标签
4. 点击 "+" 按钮 → "New Run Script Phase"
5. 将新脚本拖拽到 "Copy Bundle Resources" 之后
6. 在脚本内容中输入：
   ```bash
   ${SRCROOT}/generate-hermes-dsym.sh
   ```
7. 在 "Input Files" 中添加：
   ```
   $(SRCROOT)/generate-hermes-dsym.sh
   ```

**优点**：Archive时自动生成dSYM文件，无需手动操作。

## 推荐工作流程

### 对于当前问题
1. 运行 `./check-dsym-archive.sh` 检查最新的archive
2. 如果dSYM已生成，直接上传到App Store Connect
3. 如果没有生成，脚本会自动生成

### 对于未来的Archive
选择以下方案之一：

**方案A：手动检查（简单可靠）**
- 每次Archive后运行 `./check-dsym-archive.sh`
- 然后使用Xcode Organizer上传

**方案B：使用完整构建脚本（自动化）**
- 使用 `./rebuild-and-upload.sh` 替代手动Archive
- 脚本会自动处理所有步骤

**方案C：Xcode构建阶段（透明化）**
- 设置一次后，Archive时自动处理
- 无需记住额外步骤

## 脚本功能说明

### check-dsym-archive.sh
- 自动查找最新的ProgressBuild archive
- 检查是否存在hermes.framework.dSYM
- 如果不存在，自动生成
- 验证UUID匹配

### rebuild-and-upload.sh
- 完整清理项目
- 重新构建Archive
- 自动检查和生成dSYM
- 导出IPA文件
- 提供上传指导

### ios/generate-hermes-dsym.sh
- 专为Xcode构建阶段设计
- 只在Release Archive时运行
- 自动查找hermes.framework
- 生成dSYM到正确位置

## 验证方法

检查dSYM文件是否正确生成：

```bash
# 检查archive中的dSYM文件
ls -la ~/Library/Developer/Xcode/Archives/*/ProgressBuild*.xcarchive/dSYMs/

# 检查UUID
dwarfdump --uuid /path/to/hermes.framework.dSYM/Contents/Resources/DWARF/hermes
```

## 常见问题

### Q: 为什么每次都要手动生成dSYM？
A: 这是React Native + Hermes的已知问题，Hermes的dSYM不会自动包含在Archive中。

### Q: 可以一次性解决吗？
A: 可以，使用方案3（Xcode构建阶段），设置一次后自动处理。

### Q: 脚本安全吗？
A: 是的，脚本只读取项目文件和生成dSYM，不会修改源代码或发送数据。

### Q: 如果脚本失败怎么办？
A: 检查错误信息，通常是路径问题或权限问题。可以手动运行dsymutil命令。

## 技术细节

### 问题原因
1. Hermes是Facebook开发的JavaScript引擎
2. 在React Native中作为framework集成
3. Xcode Archive时不自动生成其dSYM文件
4. App Store Connect需要完整的dSYM文件集

### 解决原理
1. 使用dsymutil工具从二进制文件生成dSYM
2. 将生成的dSYM文件放到Archive的dSYMs目录
3. 确保UUID匹配

### 依赖工具
- dsymutil (Xcode自带)
- dwarfdump (Xcode自带)
- xcodebuild (Xcode自带)

## 更新日志

- **2025-07-09**: 创建初始版本
- **2025-07-09**: 添加完整构建脚本
- **2025-07-09**: 添加Xcode构建阶段脚本

## 支持

如果遇到问题，请：
1. 检查Xcode版本（建议12.0+）
2. 确保React Native版本支持Hermes
3. 验证项目配置中USE_HERMES=true
4. 检查脚本执行权限 