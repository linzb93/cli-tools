import { ElMessage } from "element-plus";
import request from ".";
/**
 * 复制文本
 * @param {string} text 复制的文本
 */
export const copy = (text: string) => {
  request("/copy", {text});
  ElMessage.success("复制成功");
};

/**
 * 下载文件，支持单个或批量下载
 * @param {string | string[]} url 下载地址
 * @returns
 */
export const download = async (url: string | string[]) => {
  try {
    await request("/download", {url});
  } catch (error) {
    return;
  }
  ElMessage.success("下载成功");
};
/**
 * 打开网站或者文件
 * @param url 网址或者本地文件地址
 */
export const open = (
  type: "vscode" | "path" | "web",
  url: string | string[]
) => {
  request("/open", {
    type,
    url,
  });
};
