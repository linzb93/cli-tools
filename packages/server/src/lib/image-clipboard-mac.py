import sys
import Cocoa # type: ignore
from PIL import Image
from io import BytesIO


def read_clipboard_image():
    try:
        pasteboard = Cocoa.NSPasteboard.generalPasteboard()
        image_data = pasteboard.dataForType_(Cocoa.NSPasteboardTypePNG)
        if image_data is None:
            image_data = pasteboard.dataForType_(Cocoa.NSPasteboardTypeTIFF)
        if image_data is not None:
            return image_data.bytes().tobytes()
        else:
            print("剪贴板中没有图像数据。")
            return None
    except Exception as e:
        print(f"读取剪贴板图片时出现错误: {e}")
        return None


def write_clipboard_image(image_buffer):
    try:
        pasteboard = Cocoa.NSPasteboard.generalPasteboard()
        pasteboard.clearContents()
        data_provider = Cocoa.NSData.alloc().initWithBytes_length_(image_buffer, len(image_buffer))
        pasteboard.writeObjects_([data_provider])
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
        elif action == "write":
            if len(sys.argv) < 3:
                print("请提供要写入剪贴板的图片文件路径。")
            else:
                file_path = sys.argv[2]
                try:
                    with open(file_path, 'rb') as file:
                        image_bytes = file.read()
                    img = Image.open(BytesIO(image_bytes))
                    output = BytesIO()
                    img.save(output, "PNG")
                    image_buffer = output.getvalue()
                    write_clipboard_image(image_buffer)
                except Exception as e:
                    print(f"处理图片文件时出现错误: {e}")
        else:
            print("无效的 type 参数，值可以为 'read' 或 'write'。")