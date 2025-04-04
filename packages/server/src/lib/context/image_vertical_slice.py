from tkinter import simpledialog, messagebox, filedialog
import sys
from PIL import Image
import os

def main():
    if len(sys.argv) < 2:
        messagebox.showerror("错误", "没有选择文件!")
        return

    image_path = sys.argv[1]
    try:
        with Image.open(image_path) as img:
            # 获取图片宽高
            width, height = img.size
            
            # 每1500像素裁切一次
            slice_height = 1500
            
            # 计算需要裁切的次数
            slice_count = height // slice_height # 整除
            if height % slice_height > 0:
                slice_count += 1
                
            # 获取原始文件名（不含扩展名）
            file_name = os.path.splitext(os.path.basename(image_path))[0]
            file_ext = os.path.splitext(image_path)[1]
            
            # 选择保存目录
            desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
            save_dir = filedialog.askdirectory(
                title="选择保存目录",
                initialdir=desktop_path
            )
            
            if not save_dir:
                sys.exit()
            
            # 裁切并保存图片
            for i in range(slice_count):
                top = i * slice_height
                bottom = min((i + 1) * slice_height, height)
                
                # 裁切图片
                slice_img = img.crop((0, top, width, bottom))
                
                # 保存裁切后的图片
                save_path = os.path.join(save_dir, f"{file_name}_slice_{i+1}{file_ext}")
                slice_img.save(save_path)
            
            messagebox.showinfo('提示', f'图片裁切完成，共生成{slice_count}张图片')
    except Exception as e:
        messagebox.showerror('错误', f'图片裁切失败: {e}')

if __name__ == "__main__":
    main()