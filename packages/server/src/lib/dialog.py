import argparse
import tkinter as tk
from tkinter import filedialog

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
        file_path = filedialog.askdirectory()
    print(file_path)

parser = argparse.ArgumentParser()
parser.add_argument("--type")
args = parser.parse_args()
open_file_dialog(args.type)