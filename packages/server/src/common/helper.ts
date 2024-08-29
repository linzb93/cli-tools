import clipboardy from "clipboardy";
import notifier from "node-notifier";
import * as macosOpenFileDialog from "macos-open-file-dialog";
import winDialog from "node-file-dialog";
import iconv from "iconv-lite";
// import {root} from './constant';
// import path from 'node:path';
export const isWin = process.platform !== "darwin";
export const copy = (text: string) => {
  clipboardy.writeSync(text);
};
export const readCopy = () => {
  return clipboardy.readSync();
};
export const notify = (content: string) => {
  notifier.notify({
    title: "店客多通知",
    // icon: path.join(root, "source/dkd-logo.png"),
    message: content,
  });
};
interface SystemDialogOptions {
  properties: ("openDirectory" | "multiSelections")[];
  multiSelections?: boolean;
}
