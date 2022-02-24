/**
 * 公司项目的代码部署到Jenkins测试环境与生产环境，默认测试环境
 * eg:
 * mycli git deploy 测试环境
 * mycli git deploy prod 生产环境
 * 也可以部署github的
 */
import BaseCommand from '../../util/BaseCommand.js';
import gitTag from './tag/index.js';
import lodash from 'lodash';
import readPkg from 'read-pkg';
import { CommandItem } from '../../util/pFunc';
const { get: objectGet } = lodash;

interface Options {
  commit: string;
}
class Deploy extends BaseCommand {
  private data: string[];
  private options: Options;
  constructor(data: string[], options: Options) {
    super();
    this.data = data;
    this.options = options;
  }
  async run() {
    const { data } = this;
    this.helper.validate(
      {
        data: data[0]
      },
      {
        data: [
          {
            type: 'enum',
            enum: ['test', 'prod'],
            message: '请输入正确的部署环境，测试环境可以不写，生产环境为prod'
          }
        ]
      }
    );
    if ((await this.git.remote()).includes('github.com')) {
      this.deployToGithub();
    } else {
      this.deployToWork();
    }
  }
  private async deployToGithub() {
    const { options } = this;
    const flow: (string | CommandItem)[] = [
      {
        message: 'git pull',
        retries: 20
      },
      {
        message: 'git push',
        retries: 20
      }
    ];
    const gitStatus = await this.git.getPushStatus();
    if (gitStatus === 1) {
      flow.unshift('git add .', `git commit -m ${options.commit || 'update'}`);
    } else if (gitStatus === 3) {
      flow.pop();
      const pkgData = await readPkg();
      if (objectGet(pkgData, 'scripts.postpull')) {
        flow.push({
          message: 'npm run postpull',
          suffix: objectGet(pkgData, 'scripts.postpull')
        });
      }
    }
    try {
      await this.helper.sequenceExec(flow);
    } catch (error) {
      this.logger.error((error as Error).message);
      return;
    }
    this.logger.success('部署成功');
  }
  private async deployToWork() {
    const { data, options } = this;
    const env = data[0];
    const curBranch = await this.git.getCurrentBranch();
    let newTag = '';
    if (env === 'prod') {
      newTag = await gitTag({
        silent: true,
        type: 'update'
      });
    }
    if (curBranch === 'release' && env === 'prod') {
      this.logger.warn('不能从release部署到生产环境，请切换回开发分支');
      return;
    }
    if (curBranch === 'master') {
      this.logger.warn('检查下有没有测试代码没删掉！！！');
      newTag = await gitTag({
        silent: true,
        type: 'patch'
      });
      try {
        const flow = [
          'git add .',
          {
            message: `git commit -m ${options.commit || 'update'}`,
            onError() {
              throw new Error('没有需要提交的代码');
            }
          },
          {
            message: 'git pull',
            onError() {}
          },
          'git push'
        ];
        if (newTag !== '') {
          flow.push(`git tag ${newTag}`, `git push origin ${newTag}`);
        }
        await this.helper.sequenceExec(flow);
      } catch (error) {
        this.logger.error((error as Error).message);
        return;
      }
    } else {
      try {
        const flow = [
          'git add .',
          {
            message: `git commit -m ${options.commit || 'update'}`,
            onError() {
              if (env !== 'prod') {
                throw new Error('没有需要提交的代码');
              }
            }
          },
          {
            message: 'git pull',
            onError() {}
          },
          {
            message: 'git push',
            onError() {}
          },
          `git checkout ${env === 'prod' ? 'master' : 'release'}`,
          {
            message: `git merge ${curBranch}`,
            onError: async () => {
              const ans = await this.helper.inquirer.prompt([
                {
                  message: '代码合并失败，检测到代码有冲突，是否已解决？',
                  type: 'confirm',
                  default: true,
                  name: 'resolved'
                }
              ]);
              if (!ans.resolved) {
                throw new Error('exit');
              }
              await this.helper.sequenceExec([
                'git add .',
                'git commit -m conflict-fixed'
              ]);
            }
          },
          'git pull',
          'git push'
        ];
        if (env === 'prod') {
          flow.push(`git tag ${newTag}`, `git push origin ${newTag}`);
        } else {
          flow.push(`git checkout ${curBranch}`);
        }
        await this.helper.sequenceExec(flow);
      } catch (error) {
        this.logger.error((error as Error).message);
        return;
      }
    }
    this.logger.success('操作成功');
  }
}

export default (data: string[], options: Options) => {
  new Deploy(data, options).run();
};
