import sys
import win32clipboard
from io import BytesIO
from PIL import Image


def read_clipboard_image():
    try:
        # 打开剪贴板
        win32clipboard.OpenClipboard()
        # 获取剪贴板中的数据，格式为设备无关位图（CF_DIB）
        data = win32clipboard.GetClipboardData(win32clipboard.CF_DIB)
        # 关闭剪贴板
        win32clipboard.CloseClipboard()
        return data
    except Exception as e:
        print(f"读取剪贴板图片时出现错误: {e}")
        return None


def write_clipboard_image(image_buffer):
    try:
        # 打开剪贴板
        win32clipboard.OpenClipboard()
        # 清空剪贴板
        win32clipboard.EmptyClipboard()
        # 将图片数据写入剪贴板，格式为设备无关位图（CF_DIB）
        win32clipboard.SetClipboardData(win32clipboard.CF_DIB, image_buffer)
        # 关闭剪贴板
        win32clipboard.CloseClipboard()
        print("图片数据已成功写入剪贴板。")
    except Exception as e:
        print(f"写入剪贴板图片时出现错误: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("请提供命令行参数 type，值可以为 'read' 或 'write'。")
    else:
        action = sys.argv[1]
        if action == "read":
            image_data = read_clipboard_image()
            if image_data:
                print("成功读取剪贴板图片数据。")
                # 这里可以根据需要进一步处理 image_data，例如保存到文件
                # img = Image.open(BytesIO(image_data))
                # img.save("output.png")
        elif action == "write":
            if len(sys.argv) < 3:
                print("请提供要写入剪贴板的图片文件路径。")
            else:
                file_path = sys.argv[2]
                try:
                    # 打开图片文件
                    with open(file_path, 'rb') as file:
                        image_bytes = file.read()
                    # 将图片数据转换为 PIL 图像对象
                    img = Image.open(BytesIO(image_bytes))
                    # 将图像对象转换为设备无关位图格式的字节流
                    output = BytesIO()
                    img.convert("RGB").save(output, "BMP")
                    dib = output.getvalue()[14:]  # 去除 BMP 文件头
                    # 写入剪贴板
                    write_clipboard_image(dib)
                except Exception as e:
                    print(f"处理图片文件时出现错误: {e}")
        else:
            print("无效的 type 参数，值可以为 'read' 或 'write'。")