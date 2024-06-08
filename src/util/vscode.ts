import fs from "fs-extra";
import { execaCommand as execa } from "execa";
import logger from "./logger";

/**
 * 在 VSCode 中打开
 * @param {string} project 项目地址
 * @param {object} options
 * @param {boolean} options.isGoto 是否跳转到文件指定位置
 * @param {boolean} options.reuse 是否在当前编辑器打开
 * @returns {Promise<void>}
 */
const openCode = async (
  project: string,
  options?: {
    isGoto?: boolean;
    reuse?: boolean;
  }
): Promise<void> => {
  try {
    await execa(
      `code ${options?.isGoto ? "-g" : ""} ${project} ${
        options?.reuse ? "-r" : ""
      }`
    );
  } catch (cmdError) {
    try {
      await fs.access(project);
    } catch (accessError) {
      logger.error("项目路径不存在");
      return;
    }
    logger.error("打开失败，未检测到有安装VSCode");
  }
};

/**
 * 是否在VSCode编辑器环境中
 */
const isIn = process.env.TERM_PROGRAM === "vscode";

export default {
  open: openCode,
  isIn,
};
