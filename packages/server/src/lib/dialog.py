import argparse
import tkinter as tk
from tkinter import filedialog
import io
import sys
import re

sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')
parser = argparse.ArgumentParser()
parser.add_argument("--type")
parser.add_argument("--root")
args = parser.parse_args()
def open_file_dialog(type):
    root = tk.Tk()
    root.withdraw() 
    if type == "file":
        file_path = filedialog.askopenfilename()
    elif type == "files":
        file_path_tuple = filedialog.askopenfilenames()
        file_path = ''
        for path in file_path_tuple:
            file_path += path + ','
    elif type == "save":
        file_path = filedialog.asksaveasfilename()
    elif type == "directory":
        file_path = filedialog.askdirectory(
            initialdir = f"{re.escape(args.root)}",
            title = "Select a directory"
        )
    print(file_path)


open_file_dialog(args.type)