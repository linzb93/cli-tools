import clipboardy from "clipboardy";
import notifier from "node-notifier";
import * as macosOpenFileDialog from "macos-open-file-dialog";
import winDialog from "node-file-dialog";
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
export const showOpenDialog = async (
  options: SystemDialogOptions = {
    properties: ["openDirectory"],
  }
) => {
  let path = "";
  if (isWin) {
    try {
      path = await winDialog({
        type: "directory",
      });
    } catch (error) {
      return {
        canceled: true,
      };
    }
  } else {
    try {
      path = await macosOpenFileDialog.openFolder("选择目录");
    } catch (error) {
      return {
        canceled: true,
      };
    }
  }
  return {
    canceled: false,
    path,
  };
};
