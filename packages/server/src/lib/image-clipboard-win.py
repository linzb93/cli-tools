import win32clipboard
from PIL import Image
from io import BytesIO
import base64

def get_image_from_clipboard():
    # 打开剪贴板
    win32clipboard.OpenClipboard()
    try:
        # 获取剪贴板中的数据
        data = win32clipboard.GetClipboardData(win32clipboard.CF_DIB)
        # 关闭剪贴板
        win32clipboard.CloseClipboard()
    except:
        return None
    # 使用PIL库将数据转换为图像
    image = Image.open(BytesIO(data))
    return image

def image_to_base64(image, format="PNG"):
    """
    将Pillow图像对象转换为Base64字符串
    :param image: Pillow图像对象
    :param format: 图片格式，默认为PNG
    :return: Base64编码的字符串
    """
    buffer = BytesIO()
    image.save(buffer, format=format)
    buffer.seek(0)  # 将指针移动到缓冲区开头
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

# 指定保存路径
image = get_image_from_clipboard()
if image:
    # 将图片转换为Base64字符串
    base64_data = image_to_base64(image, format="PNG")
    
    # 输出Base64数据
    print({
        "success":'true',
        "data":base64_data
    })
else:
    print({
        "success":'false',
        "message":"no image found"
    })