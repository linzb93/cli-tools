import Agent, { Options } from '@/service/agent';
// function generateHelp() {
//   generateHelpDoc({
//     title: "agent",
//     content: `生成代理服务器。会将代理信息存入数据库文件中。
// 使用方法：
// ${chalk.cyan(`agent --proxy=https://www.example.com --port=5050`)}
// 选项：
// - proxy：代理的地址。如果没有输入的话，会从数据库文件中读取已存储的代理列表让用户选择。
// - port: 端口号

// ${chalk.cyan(
//   `agent stop --port=5050`
// )} - 关闭代理服务，如果port没有输入的话，会让用户选择。
// `,
//   });
// }

export default (subCommand: string, options: Options) => {
    new Agent().main(subCommand, options);
};
