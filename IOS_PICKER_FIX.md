# iOS Picker 组件数字不显示问题修复

## 问题描述

在 iOS 上的 App Store 版本中，`newworkrecord` 页面选择时间时，下方弹出的时间选择器中没有显示任何数字。

## 问题原因

这是 React Native 中 `@react-native-picker/picker` 组件在 iOS 上的已知问题：
1. iOS 上的 `Picker.Item` 默认文本颜色可能透明或与背景色相同
2. 缺少必要的样式属性导致文本不可见
3. iOS 系统的深色模式可能影响显示

## 解决方案

### 已实施的修复

1. **为 Picker.Item 添加 color 属性**：
   ```jsx
   <Picker.Item 
     key={hour} 
     label={hour.toString().padStart(2, '0')} 
     value={hour} 
     color="#333"  // 明确指定文本颜色
   />
   ```

2. **为 Picker 添加 itemStyle 属性**：
   ```jsx
   <Picker
     selectedValue={tempStartHour}
     style={styles.picker}
     itemStyle={styles.pickerItem}  // 添加项目样式
     onValueChange={(itemValue) => setTempStartHour(itemValue)}
   >
   ```

3. **添加 pickerItem 样式定义**：
   ```jsx
   pickerItem: {
     fontSize: 18,
     color: '#333',
     textAlign: 'center',
   },
   ```

### 修复范围

修复应用于以下时间选择器：
- ✅ 开始时间选择器（小时和分钟）
- ✅ 结束时间选择器（小时和分钟）

## 替代方案

如果问题仍然存在，可以考虑以下替代方案：

### 方案1：使用 iOS 原生 DatePicker

```jsx
import DatePicker from '@react-native-community/datetimepicker';

// 替换自定义 Picker 为原生 DatePicker
{showStartTimePicker && (
  <DatePicker
    value={beginTime}
    mode="time"
    is24Hour={true}
    display="spinner"
    onChange={(event, selectedDate) => {
      setShowStartTimePicker(false);
      if (selectedDate) {
        setStartTime(selectedDate);
      }
    }}
  />
)}
```

### 方案2：使用 WheelPicker 组件

```jsx
import { WheelPicker } from 'react-native-wheel-picker-android';

// 使用第三方轮盘选择器
<WheelPicker
  selectedItem={tempStartHour}
  data={hours.map(h => h.toString().padStart(2, '0'))}
  onItemSelected={(index) => setTempStartHour(index)}
  style={styles.wheelPicker}
/>
```

### 方案3：使用 Modal + ScrollView

```jsx
// 自定义滚动选择器
<Modal visible={showStartTimePicker}>
  <View style={styles.customPickerModal}>
    <ScrollView>
      {hours.map(hour => (
        <TouchableOpacity
          key={hour}
          style={styles.timeOption}
          onPress={() => setTempStartHour(hour)}
        >
          <Text style={styles.timeOptionText}>
            {hour.toString().padStart(2, '0')}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
</Modal>
```

## 验证方法

1. **开发环境验证**：
   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios
   ```

2. **测试步骤**：
   - 打开应用
   - 进入 New Work Record 页面
   - 点击 Begin Time 或 End Time
   - 检查时间选择器中的数字是否正常显示

3. **Archive 测试**：
   - 创建 Release Archive
   - 在真机上测试时间选择功能

## 常见问题

### Q: 修复后数字还是不显示？
A: 尝试以下方案：
1. 检查 iOS 系统版本兼容性
2. 清理缓存并重新构建
3. 使用替代方案（原生 DatePicker）

### Q: 颜色在深色模式下不合适？
A: 添加动态颜色支持：
```jsx
import { useColorScheme } from 'react-native';

const isDarkMode = useColorScheme() === 'dark';
const textColor = isDarkMode ? '#fff' : '#333';

<Picker.Item color={textColor} />
```

### Q: 在 Android 上会有问题吗？
A: 不会，这些修复对 Android 也是兼容的，不会影响 Android 的显示效果。

## 更新日志

- **2025-07-09**: 修复 iOS Picker 组件数字不显示问题
- **2025-07-09**: 添加 pickerItem 样式和 color 属性
- **2025-07-09**: 更新开始时间和结束时间选择器

## 相关依赖

- `@react-native-picker/picker`: ^2.4.10
- `react-native`: ^0.80.1

## 支持

如果问题仍然存在，请：
1. 检查控制台错误信息
2. 尝试替代方案
3. 考虑升级到最新版本的 picker 组件 