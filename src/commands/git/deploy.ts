/**
 * 公司项目的代码部署到Jenkins测试环境与生产环境，默认测试环境
 * eg:
 * mycli git deploy 测试环境
 * mycli git deploy prod 生产环境
 * 也可以部署github的
 */
import BaseCommand from '../../util/BaseCommand.js';
import inquirer from 'inquirer';
import GitTag from './tag/index.js';

interface Options {
  commit?: string;
}
export default class extends BaseCommand {
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
    const flow: any[] = [
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
    const newTag =
      env === 'prod' || curBranch === 'master'
        ? await new GitTag({ silent: true }).run()
        : '';
    if (curBranch === 'release' && env === 'prod') {
      this.logger.warn('不能从release部署到生产环境，请切换回开发分支');
      return;
    }
    if (curBranch === 'master') {
      try {
        await this.helper.sequenceExec([
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
          'git push',
          `git tag ${newTag}`,
          `git push origin ${newTag}`
        ]);
      } catch (error) {
        this.logger.error((error as Error).message);
        return;
      }
    } else {
      try {
        await this.helper.sequenceExec([
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
          {
            message: 'git push',
            onError: async () => {
              await this.git.push({
                branch: curBranch
              });
            }
          },
          `git checkout ${env === 'prod' ? 'release' : 'master'}`,
          {
            message: `git merge ${curBranch}`,
            onError: async () => {
              const ans = await inquirer.prompt([
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
          'git push',
          ...(env === 'prod'
            ? [`git tag ${newTag}`, `git push origin ${newTag}`]
            : [`git checkout ${curBranch}`])
        ]);
      } catch (error) {
        this.logger.error((error as Error).message);
        return;
      }
    }

    this.logger.success('操作成功');
  }
}
