from tkinter import simpledialog,messagebox,filedialog
import sys
from PIL import Image
import os

def get_input():
    input_text = simpledialog.askinteger("温馨提醒", "请输入图片宽度，按回车键完成")
    # 如果输入内容为空，直接结束程序
    if not input_text:
        sys.exit()
    return input_text

def main():
    if len(sys.argv) < 2:
        messagebox.showerror("错误", "没有选择文件!")
        return

    image_path = sys.argv[1]
    try:
        with Image.open(image_path) as img:
            file_name = image_path.split('/')[-1]
            # 获取图片宽高
            width, height = img.size
            input_value = get_input()
            new_width = int(input_value) if input_value else width
            new_height = int(new_width * height / width)
            img = img.resize((new_width,new_height)) # 将指针移动到缓冲区开头
            desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
            save_path = filedialog.asksaveasfilename(
                title = "保存图片",
                initialdir=desktop_path,
                initialfile=file_name,
            )
            if not save_path:
                sys.exit()
            img.save(save_path)
            messagebox.showinfo('提示',f'图片调整尺寸成功')
    except Exception as e:
        messagebox.showerror('错误',f'图片调整尺寸失败:{e}')

if __name__ == "__main__":
    main()