import open from "open";
import fs from "fs-extra";
import { execaCommand as execa } from "execa";

export const openWeb = async (url: string) => {
  await open(url);
};

export const openPath = async (url: string) => {
  await open(url);
};

export const openInVSCode = async (
  project: string,
  options?: {
    isGoto?: boolean;
    reuse?: boolean;
  }
) => {
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
      throw new Error("项目路径不存在");
    }
  }
};
/**
 * 是否在VSCode编辑器环境中
 */
export const isIn = process.env.TERM_PROGRAM === "vscode";
