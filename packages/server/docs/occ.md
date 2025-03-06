# occ

occ 是管理公司客户购买记录的平台。occ 命令用来使用 occ 平台的功能，包括获取店铺 token，打开应用等。

## 使用方法

```bash
$ mycli occ [appName] [shopId] [options]
```

在某个平台使用 occ 功能。例如，获取美团评价神器，店铺 id 是`1234567`的店铺 token，并将 token 写入剪贴板。

```bash
$ mycli occ pj 1234567 --token
```

## 参数

### appName

各平台应用的简写。

类型`string`。

默认: `jysq`。

所有支持的平台简写如下：

-   jysq: 美团经营神器
-   zx: 美团装修神器
-   pj: 美团评价神器
-   im: 美团 IM 神器
-   yx: 美团营销神器
-   dj: 美团点金大师
-   ai: 美团 AI 爆单神器
-   ele: 饿了么经营神器
-   chain: 美团连锁品牌
-   outer: 站外应用
-   spbj: 商品搬家

## 选项

### 默认

打开对应的应用。

### token

获取应用的 token，并将 token 写入剪贴板。

类型：`boolean`.

默认：`false`.

### test

访问测试站数据。

类型：`boolean`.

默认：`false`.

### pc

打开对应的应用的 PC 版。

类型：`boolean`.

默认：`false`.

### fix <url>

为一个网站补齐登录信息。

类型：`string`.

### user

调用获取用户信息相关接口并展示接口返回值。

类型：`boolean`.

默认：`false`.

### copy

复制店铺完整地址（含未处理的 token）

类型：`boolean`.

默认：`false`.
