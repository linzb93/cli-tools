# Minimax API 文档

## 概述

本项目通过 MiniMax API 获取用户的编程计划用量信息。

## 认证方式

使用 **Bearer Token** 认证：

```
Authorization: Bearer {token}
```

## API 端点

### 1. 获取用量状态

**端点**: `GET https://www.minimaxi.com/v1/api/openplatform/coding_plan/remains`

**用途**: 获取当前用量、剩余额度及重置时间

**响应字段说明**:

| 字段 | 含义 |
|------|------|
| `model_remains[].current_interval_total_count` | 当前周期总次数 |
| `model_remains[].current_interval_usage_count` | 当前周期剩余次数 |
| `model_remains[].start_time` | 当前周期开始时间 |
| `model_remains[].end_time` | 当前周期结束时间（下次重置时间） |
| `model_remains[].remains_time` | 距离重置的剩余时间（毫秒） |
| `model_remains[].current_weekly_total_count` | 每周总次数 |
| `model_remains[].current_weekly_usage_count` | 每周剩余次数 |
| `model_remains[].weekly_remains_time` | 每周剩余时间（毫秒） |
| `model_remains[].model_name` | 模型名称 |

**计算方式**:
- **当前用量** = `current_interval_total_count` - `current_interval_usage_count`
- **剩余用量** = `current_interval_usage_count`
- **下次重置时间** = `end_time`（时间戳格式）

### 2. 获取订阅详情

**端点**: `GET https://www.minimaxi.com/v1/api/openplatform/charge/combo/cycle_audio_resource_package`

**参数**:
- `biz_line`: 2
- `cycle_type`: 1
- `resource_package_type`: 7

**用途**: 获取订阅到期时间

**响应字段**:
- `current_subscribe.current_subscribe_end_time` - 订阅到期时间

## 返回数据结构

`parseUsageData()` 方法返回的结构：

```javascript
{
  modelName: "模型名称",
  timeWindow: {
    start: "HH:mm",      // 周期开始时间
    end: "HH:mm",        // 周期结束时间（重置时间）
    timezone: "UTC+8"
  },
  remaining: {
    hours: 0,            // 剩余小时
    minutes: 0,          // 剩余分钟
    text: "Reset in Xm"  // 可读文本
  },
  usage: {
    used: 0,             // 已使用次数
    remaining: 0,        // 剩余次数
    total: 0,            // 总次数
    percentage: 0        // 使用百分比
  },
  weekly: {
    used: 0,             // 每周已使用
    total: 0,            // 每周总额
    percentage: 0,       // 每周使用百分比
    days: 0,             // 剩余天数
    hours: 0,            // 剩余小时
    unlimited: false,    // 是否无限
    text: "Reset in Xd Xh"
  },
  expiry: {
    date: "ISO日期",     // 到期日期
    daysRemaining: 0,    // 剩余天数
    text: "X days remaining"
  }
}
```
