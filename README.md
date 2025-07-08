# ProgressBuild

专业的项目管理和进度追踪应用

## 构建状态

本项目使用Xcode Cloud进行自动化构建和部署。

## 发布流程

1. 提交代码到main分支
2. Xcode Cloud自动构建
3. 自动上传到App Store Connect
4. 在App Store Connect中配置应用信息
5. 提交审核

## 本地开发

```bash
# 安装依赖
cd ios
pod install

# 运行应用
npx react-native run-ios
```

## SDK要求

- iOS 18+ SDK (通过Xcode Cloud自动提供)
- Xcode 16+ (仅云端构建需要)

## App Store信息

- Bundle ID: co.nz.pb.app
- 团队: Eastern Innovation Technologies Co., Ltd.
- 开发者: PB
