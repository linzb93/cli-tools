import Fork from '@/service/fork';

// function generateHelp() {
//   generateHelpDoc({
//     title: "fork",
//     content: `fork一个子进程，解除父子进程的关联，独立子进程。一般用于本机HTTP服务。
// 使用方法：
// fork app.js`,
//   });
// }

export default (filename: string) => {
    new Fork().main(filename);
};
