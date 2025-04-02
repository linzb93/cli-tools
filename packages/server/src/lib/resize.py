from PIL import Image
from tkinter import filedialog
import argparse
import os
from tkinter import Frame,Label
from tkinterdnd2 import TkinterDnD, DND_FILES

def add_drop_dialog(title = '拖入图片', on_drop_wrap = None):
    root = TkinterDnD.Tk()
    root.title(title)
    frame = Frame(root)
    frame.pack(pady = 20)
    label = Label(frame, text="将图片拖拽到此处")
    label.pack()
    status_label = Label(frame, text="")
    status_label.pack()
    root.drop_target_register(DND_FILES)
    on_drop = on_drop_wrap(root)
    root.dnd_bind('<<Drop>>', on_drop)
    root.mainloop()

def on_drop_wrap(root):
    def on_drop(event):
        
        file_path = event.data.strip('{}')  # 去除拖拽路径中的大括号
        file_name = file_path.split('/')[-1]
        parser = argparse.ArgumentParser()
        parser.add_argument("--size", type=str, help="图片大小")
        
        try:
            with Image.open(file_path) as img:
                width, height = img.size
                args = parser.parse_args()
                newWidth = int(args.size)
                newHeight = int(newWidth * height / width)
                img = img.resize((newWidth, newHeight))
                desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
                save_path = filedialog.asksaveasfilename(
                    title = "保存图片",
                    initialdir=desktop_path,
                    initialfile=file_name,
                )
                if not save_path:
                    root.after(2000, lambda: root.destroy())
                    return
                img.save(save_path)
                # status_label.config(text="图片已保存")
                root.after(2000, lambda: root.destroy())
        except Exception as e:
            print(e)
            root.destroy()
    return on_drop

add_drop_dialog(
    title = '图片拖拽缩放',
    on_drop_wrap = on_drop_wrap
)