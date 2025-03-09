import Clear, { IOptions } from '@/service/clear';
// function generateHelp() {
//   generateHelpDoc({
//     title: "clear",
//     content: `清理文件/文件夹
// clear [file/dir]
// 选项：
// - root: 只在根目录下查询`,
//   });
// }
export default (filename: string, options?: IOptions) => {
    return new Clear().main(filename, options);
};
