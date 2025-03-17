import tkinter as tk
from tkinterdnd2 import TkinterDnD, DND_FILES
from PIL import Image
import base64
import io
import pyperclip
import argparse

def on_drop(event):
    file_path = event.data.strip('{}')  # 去除拖拽路径中的大括号
    parser = argparse.ArgumentParser()
    parser.add_argument("--size", type=str, help="图片大小")
    
    try:
        with Image.open(file_path) as img:
            buffered = io.BytesIO()
            args = parser.parse_args()
            img = img.resize((int(args.size),int(args.size)))
            img.save(buffered, format="PNG")
            buffered.seek(0)  # 将指针移动到缓冲区开头
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            pyperclip.copy(f"data:image/png;base64,{img_base64}")
            status_label.config(text="Base64编码已复制到剪贴板")
            root.after(2000, lambda: root.destroy())
    except Exception as e:
        print(e)
        root.destroy()

root = TkinterDnD.Tk()
root.title("图片拖拽生成Base64")

frame = tk.Frame(root)
# 窗口宽度为300，高度为200
root.geometry("300x200")
frame.pack(pady=20)

label = tk.Label(frame, text="将图片拖拽到此处")
label.pack()

status_label = tk.Label(frame, text="")
status_label.pack()

root.drop_target_register(DND_FILES)
root.dnd_bind('<<Drop>>', on_drop)

root.mainloop()