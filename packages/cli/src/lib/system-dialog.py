import argparse
import tkinter as tk
from tkinter import messagebox
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')
parser = argparse.ArgumentParser()
parser.add_argument("--title")
parser.add_argument("--message")
args = parser.parse_args()

root = tk.Tk()
root.withdraw()
messagebox.showinfo(args.title, args.message)
