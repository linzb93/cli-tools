const isWin = process.platform === "win32";

export default {
  /**
   * 获取文件名
   * @param path 文件路径
   * @returns 文件名
   */
  basename(path: string) {
    return path.split(isWin ? "\\" : "/").at(-1);
  },
  /**
   *
   * @param path 文件路径
   * @returns 后缀名，不含`.`号
   */
  extname(path: string) {
    const base = this.basename(path) as string;
    return base.split(".")[1] ? base.split(".")[1].toLowerCase() : '';
  },
};
