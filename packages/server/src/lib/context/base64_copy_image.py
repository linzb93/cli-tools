
from tkinter import simpledialog,messagebox
import sys
import base64
from PIL import Image
import io
import pyperclip
def get_input():
    input_text = simpledialog.askinteger("温馨提醒", "请输入图片宽度，按回车键完成（无输入表示使用图片默认宽度）")
    return input_text

def main():
    if len(sys.argv) < 2:
        messagebox.showerror("错误", "没有选择文件!")
        return
    
    image_path = sys.argv[1]
    try:
        with Image.open(image_path) as img:
                buffered = io.BytesIO()
                # 获取图片宽高
                width, height = img.size
                input_value = get_input()
                new_width = int(input_value) if input_value else width
                new_height = int(new_width * height / width)
                img = img.resize((new_width,new_height))
                img.save(buffered, format="PNG")
                buffered.seek(0)  # 将指针移动到缓冲区开头
                img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                pyperclip.copy(f"data:image/png;base64,{img_base64}")
                messagebox.showinfo('标题','复制成功')
    except Exception as e:
        messagebox.showerror('错误',f'复制失败:{e}')

if __name__ == "__main__":
    main()