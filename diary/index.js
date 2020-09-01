const moment = require('moment');
const shell = require('shelljs');
const fs = require('fs-extra');
const {errorLogger, successLogger} = require('../lib/util');
const root = `${process.env.HOME}/Documents/日记/生活日记`;

const now = moment().format('YYYY-MM-DD');
const year = new Date().getFullYear();

module.exports = async () => {
  const template = `
# ${now} 日记
## 心态

##行为
### 习惯
* 起床时间：
* 睡觉时间：
* 睡觉前后玩手机的时间有超过15分钟吗：

### 锻炼

### 工作
<!--今天预计做什么，实际上做完了吗，没做完的话是因为什么？-->

### 其他

## 思考

标签：
`;

  // main
  const dirExists = await fs.pathExists(`${root}/${year}`);
  if (!dirExists) {
    await fs.mkdir(`${root}/${year}`);
  }
  try {
    await fs.writeFile(`${root}/${year}/${now}.md`, template);
  } catch (e) {
    errorLogger(e);
  }
  successLogger(`今日日记模板创建成功`);
  shell.exec(`cd ${root}/${year} && open -a typora ${now}.md`);
}