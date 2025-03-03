import io
import base64
from PIL import Image
from AppKit import NSPasteboard, NSPasteboardTypePNG, NSPasteboardTypeTIFF

def get_image_from_clipboard():
    # 获取剪贴板
    pasteboard = NSPasteboard.generalPasteboard()
    
    # 检查剪贴板中是否有图片数据
    if pasteboard.types().containsObject_(NSPasteboardTypePNG):
        image_data = pasteboard.dataForType_(NSPasteboardTypePNG)
    elif pasteboard.types().containsObject_(NSPasteboardTypeTIFF):
        image_data = pasteboard.dataForType_(NSPasteboardTypeTIFF)
    else:
        print("剪贴板中没有图片数据")
        return None
    
    # 将图片数据转换为Pillow图像对象
    image = Image.open(io.BytesIO(image_data))
    return image

def image_to_base64(image, format="PNG"):
    """
    将Pillow图像对象转换为Base64字符串
    :param image: Pillow图像对象
    :param format: 图片格式，默认为PNG
    :return: Base64编码的字符串
    """
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    buffer.seek(0)  # 将指针移动到缓冲区开头
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

# 获取剪贴板中的图片
image = get_image_from_clipboard()

if image:
    # 将图片转换为Base64字符串
    base64_data = image_to_base64(image, format="PNG")
    
    # 输出Base64数据
    print(base64_data)