import fs from "fs-extra";
import path from "node:path";
import { Plugin } from "vite";

// 创建插件函数
function copyFilesPlugin(filePath: string): Plugin {
  return {
    name: "copy-files-plugin",
    apply: "build",
    enforce: "post",
    // 在构建结束后执行复制操作
    async closeBundle() {
      try {
        // 遍历要复制的文件和目标路径
        const src = path.resolve(process.cwd(), "dist");
        const dest = path.resolve(process.cwd(), filePath);

        // 确保目标目录存在
        await fs.mkdir(path.dirname(dest), { recursive: true });

        // 复制文件
        await fs.copy(src, dest);
        console.log(`Copied ${src} to ${dest}`);
      } catch (err) {
        console.error("Error copying files:", err);
      }
    },
  };
}

export default copyFilesPlugin;
