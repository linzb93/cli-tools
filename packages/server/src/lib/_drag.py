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