#!/usr/bin/env node
const {errorLogger} = require('./lib/util');

process.on('uncaughtException', err => {
  errorLogger(err);
  process.exit(0);
});
process.on('uncaughtRejection', err => {
  errorLogger(err);
  process.exit(0);
});
const cli = process.argv.slice(2);
const type = cli[0];
let args, flag;
if (cli[1] && cli[1].indexOf('-') === 0) {
  args = cli.slice(2);
  flag = cli[1].replace('-', '');
} else {
  args = cli.slice(1);
}
const typeMap = {
  'npm': 'npm',          // npm相关
  'access': 'access',    // 公司“精彩链接”能否正常访问
  'gh': 'gh',            // 本地node-demo代码同步相关
  'mock': 'mock',        // 接口mock
  'diary': 'diary',      // 复制日记模板
  'yuque': 'yuque',      // 语雀cli app
};
if (typeMap[type]) {
  require(`./${typeMap[type]}`)(args, flag);
} else {
  errorLogger('命令输入有误，请重新输入！');
}