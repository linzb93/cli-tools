/**
 * 公司项目的代码部署到Jenkins测试环境与生产环境，默认测试环境
 * eg:
 * mycli git deploy 测试环境
 * mycli git deploy prod 生产环境
 * 也可以部署github的
 */
import lodash from 'lodash';
import clipboard from 'clipboardy';
import fs from 'fs-extra';
import open from 'open';
import readPkg from 'read-pkg';
import { CommandItem } from '../../util/pFunc';
import BaseCommand from '../../util/BaseCommand.js';
import { AnyObject } from '../../util/types.js';
const { get: objectGet } = lodash;

interface Options {
  commit: string;
  tag: string;
}
interface JenkinsProject {
  name: string;
  id: string;
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
    const remote = await this.git.remote();
    const curBranch = await this.git.getCurrentBranch();
    const targetBranch =
      (curBranch === 'master' && data[0] === 'test') || data[0] !== 'prod'
        ? 'release'
        : 'master';
    if (!this.options.commit) {
      this.logger.warn('不建议不写提交信息，请认真填写');
    }
    this.createWorkflow([
      {
        condition: remote.includes('github.com'),
        action: this.deployToGithub
      },
      {
        condition: targetBranch === 'release' && curBranch !== 'master', // dev -> release
        action: this.deployToRelease
      },
      {
        condition: targetBranch === 'release' && curBranch === 'master', // master -> release
        action: this.deployMasterToRelease
      },
      {
        condition: targetBranch === curBranch && curBranch === 'release',
        action: () => {
          this.helper.sequenceExec([
            'git add ',
            `git commit -m ${this.options.commit || 'update'}`,
            {
              message: `git pull`,
              onError: () => {}
            },
            `git push`
          ]);
        }
      },
      {
        condition: targetBranch === 'master',
        action: this.deployToProduction
      }
    ]);
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
      flow.unshift('git add .', {
        message: `git commit -m ${options.commit || 'update'}`,
        onError: () => {}
      });
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
    if (!options.commit) {
      this.logger.warn('不建议不写提交信息，请认真填写');
    }
    const projectConf = await this.getProjectConfig();
    let jenkins;
    if (projectConf) {
      jenkins = projectConf.jenkins as JenkinsProject;
    }
    if (curBranch === 'master') {
      if (env === 'test') {
        this.deployMasterToRelease();
      } else {
        this.deployToProduction();
      }
    } else {
      this.deployToRelease();
    }
    if (env === 'prod') {
      clipboard.writeSync(
        `${jenkins?.name} 的 ${jenkins?.id}_online。tag:${options.tag}`
      );
    }
    if (jenkins && curBranch !== 'master') {
      const { name, id } = jenkins;
      await open(
        `http://${
          this.helper.isWin ? '192.168.0.32:8080' : '218.66.91.50:13379'
        }/view/${name}/job/${id}/`
      );
    }
    this.logger.success(
      `操作成功${env === 'prod' ? '，已复制部署信息' : '。'}`
    );
  }
  private async deployMasterToRelease() {
    const { options } = this;
    const flow = [
      'git add .',
      {
        message: `git commit -m ${options.commit || 'update'}`,
        onError() {
          throw new Error('没有需要提交的代码');
        }
      },
      'git checkout release',
      'git merge master',
      {
        message: 'git pull',
        onError() {}
      },
      'git push'
    ];
    await this.helper.sequenceExec(flow);
    await this.openDeployPage();
  }
  private async deployToProduction() {
    const { options } = this;
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
      if (options.tag !== '') {
        flow.push(`git tag ${options.tag}`, `git push origin ${options.tag}`);
      }
      await this.helper.sequenceExec(flow);
    } catch (error) {
      this.logger.error((error as Error).message);
      return;
    }
  }
  private async deployToRelease() {
    const { options } = this;
    const curBranch = await this.git.getCurrentBranch();
    try {
      const flow = [
        'git add .',
        {
          message: `git commit -m ${options.commit || 'update'}`,
          onError() {}
        },
        {
          message: 'git pull',
          onError() {}
        },
        {
          message: 'git push',
          onError() {}
        },
        `git checkout release`,
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
      flow.push(`git checkout ${curBranch}`);
      await this.helper.sequenceExec(flow);
      await this.openDeployPage();
    } catch (error) {
      this.logger.error((error as Error).message);
      return;
    }
  }
  private async getProjectConfig(): Promise<AnyObject | null> {
    try {
      const data = await fs.readJSON('project.config.json');
      return data;
    } catch (error) {
      return null;
    }
  }
  private createWorkflow(
    flowList: {
      condition: Boolean;
      action: Function;
    }[]
  ): void {
    for (const flow of flowList) {
      if (flow.condition) {
        flow.action.call(this);
        return;
      }
    }
  }
  private async openDeployPage() {
    const projectConf = await this.getProjectConfig();
    let jenkins;
    if (projectConf) {
      jenkins = projectConf.jenkins as JenkinsProject;
    }
    if (jenkins) {
      const { name, id } = jenkins;
      await open(
        `http://${
          this.helper.isWin ? '192.168.0.32:8080' : '218.66.91.50:13379'
        }/view/${name}/job/${id}/`
      );
    }
  }
}
export default (data: string[], options: Options) => {
  new Deploy(data, options).run();
};
