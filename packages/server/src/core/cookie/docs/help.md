# cookie

解析 Http header 中的 cookie 信息的命令。支持输入 cookie 字符串，或者从剪贴板读取。剪贴板可以是 curl 格式的字符串。

## 使用方法

```bash
$ mycli cookie [cookieValue] [options]
```

将 cookie 字符串解析成对应格式的数据。例如：将 cookie 字符串解析成 json 格式的数据。

```bash
$ mycli cookie "a=b;c=d" --type=json
```

输出结果：

```json
{
    "a": "b",
    "c": "d"
}
```

## 参数

### cookieValue

cookie 字符串。
类型：`string`。

## 选项

### type

cookie 字符串的格式。
类型：`string`。
支持的类型如下：

-   json: json 格式
-   key: 只输出 key 的数组。

### copy

将解析结果复制到剪贴板。
类型：`boolean`。
默认：`false`。