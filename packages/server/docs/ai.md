# ai

命令行调用 ai 的工具。

## ocr

### 使用方法

```bash
$ mycli ai ocr
```

上面这条命令是调用 ai 的 ocr 功能，识别剪贴板中的图片或线上图片地址，并转化成文字。如果图片中有表格，则会转化成 markdown 格式。

### 选项

#### url

线上图片地址。

类型：`string`。

默认值：``。

## regexp

解析正则表达式。

### 使用方法

```bash
$ mycli ai regexp '/^[a-z]+$/'
```
