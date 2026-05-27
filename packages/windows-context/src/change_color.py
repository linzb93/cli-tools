from tkinter import simpledialog,messagebox,filedialog
import sys
from PIL import Image
import numpy as np
import os

def hex_to_rgb(hex_color):
    """
    将HEX颜色格式转换为RGB元组
    支持格式: #RRGGBB、RRGGBB、#RGB、RGB
    """
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join(c * 2 for c in hex_color)
    if len(hex_color) != 6:
        raise ValueError(f"无效的HEX颜色格式: {hex_color}，应为3位或6位十六进制数")

    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    return (r, g, b)

def get_color_input():
    input_text = simpledialog.askstring("温馨提醒", "请输入HEX颜色值（如 #FF6200），按回车键完成")
    if not input_text:
        sys.exit()
    return input_text

def change_color_pil(input_path, output_path, hex_color):
    new_color = hex_to_rgb(hex_color)

    img = Image.open(input_path)
    img = img.convert('RGBA')
    data = np.array(img)

    alpha = data[:, :, 3]
    non_transparent = alpha > 0

    for i in range(3):
        data[non_transparent, i] = new_color[i]

    new_img = Image.fromarray(data, 'RGBA')
    new_img.save(output_path)

def main():
    if len(sys.argv) < 2:
        messagebox.showerror("错误", "没有选择文件!")
        return

    image_path = sys.argv[1]
    try:
        with Image.open(image_path) as img:
            seg = '/'
            if (os.name == 'nt'):
                seg = '\\'
            file_name = image_path.split(seg)[-1]
            hex_color = get_color_input()
            hex_to_rgb(hex_color)

            name, ext = os.path.splitext(file_name)
            color_suffix = hex_color.lstrip('#')
            default_name = f"{name}-{color_suffix}{ext}"

            desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
            save_path = filedialog.asksaveasfilename(
                title = "保存图片",
                initialdir=desktop_path,
                initialfile=default_name,
            )
            if not save_path:
                sys.exit()
            change_color_pil(image_path, save_path, hex_color)
            messagebox.showinfo('提示','图片颜色替换成功')
    except Exception as e:
        messagebox.showerror('错误',f'图片颜色替换失败:{e}')

if __name__ == "__main__":
    main()
