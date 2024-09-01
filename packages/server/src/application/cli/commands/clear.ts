import Clear, { IOptions } from "@/service/clear";
import { generateHelpDoc } from "@/common/helper";
function generateHelp() {
  generateHelpDoc({
    title: "clear",
    content: `清理文件/文件夹
clear [file/dir]
选项：
- root: 只在根目录下查询`,
  });
}
export default (filename: string, options?: IOptions) => {
  if (options.help) {
    generateHelp();
    return;
  }
  return new Clear().main(filename, options);
};
