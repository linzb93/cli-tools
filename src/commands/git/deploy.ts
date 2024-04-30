/**
 * 公司项目的代码部署到Jenkins测试环境与生产环境，默认测试环境
 * eg:
 * mycli git deploy 测试环境
 * mycli git deploy prod 生产环境
 * 也可以部署github的
 */
import lodash from 'lodash';
import fs from 'fs-extra';
import open from 'open';
import readPkg from 'read-pkg';
import notifier from 'node-notifier';
import { CommandItem } from '../../util/pFunc';
import BaseCommand from '../../util/BaseCommand.js';
import { getNewestTag } from './tag/index.js';
import clipboard from 'clipboardy';
import { connectService } from '../../util/service/index.js';
import path from 'path';
import dayjs from 'dayjs';
const { get: objectGet } = lodash;

interface Options {
  commit: string;
  tag: string;
  debug: boolean;
  current: boolean;
}
interface JenkinsProject {
  name: string;
  id: string;
}
interface GitDeploy {
  name: string;
  publishTime: string;
}
class Deploy extends BaseCommand {
  constructor(private data: string[], private options: Options) {
    super();
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
    const isDevBranch = !['release', 'master'].includes(curBranch);
    const targetBranch =
      (curBranch === 'master' && data[0] === 'test') || data[0] !== 'prod'
        ? 'release'
        : 'master';
    this.createWorkflow([
      {
        condition: this.options.current,
        action: this.deployCurrent
      },
      {
        condition: remote.includes('github.com'),
        action: this.deployToGithub
      },
      {
        condition: targetBranch === 'release' && isDevBranch, // dev -> release
        action: this.deployToRelease
      },
      {
        condition: targetBranch === curBranch && curBranch === 'release', // release -> release
        action: () => {
          this.helper.sequenceExec(
            [
              'git add .',
              `git commit -m ${this.options.commit || 'update'}`,
              `git pull`,
              `git push`
            ],
            {
              debug: this.options.debug
            }
          );
        }
      },
      {
        condition: curBranch === 'release' && targetBranch === 'master', // release -> master
        action: this.deployTestToProduction
      },
      {
        condition: isDevBranch && targetBranch === 'master', // dev -> master
        action: this.deployDevToProduction
      },
      {
        condition: targetBranch === curBranch && curBranch === 'master', // master -> master
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
      await this.helper.sequenceExec(flow, {
        debug: options.debug
      });
    } catch (error) {
      this.logger.error((error as Error).message);
      notifier.notify({
        title: 'mycli通知',
        message: 'Github项目更新失败！'
      });
      return;
    }
    this.logger.success('部署成功');
  }
  private async deployCurrent() {
    await this.helper.sequenceExec([
      'git add .',
      `git commit -m ${this.options.commit || 'update'}`,
      'git pull',
      'git push'
    ]);
    this.logger.success('部署成功');
  }
  private async deployTestToProduction() {
    const { options } = this;
    const newestTag = options.tag || (await getNewestTag());
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
        'git push',
        'git checkout master',
        'git pull',
        'git merge release',
        'git push',
        `git tag ${newestTag}`,
        `git push origin ${newestTag}`
      ];
      await this.helper.sequenceExec(flow, {
        debug: options.debug
      });
      await this.deploySuccess(newestTag);
    } catch (error) {
      this.logger.error((error as Error).message);
      return;
    }
  }
  private async deployDevToProduction() {
    const { tag } = this.options;
    const { answer } = await this.helper.inquirer.prompt({
      message: '确认更新到正式站？',
      name: 'answer',
      type: 'confirm'
    });
    if (!answer) {
      return;
    }
    const { options } = this;
    const curBranch = await this.git.getCurrentBranch();
    const gitStatus = await this.git.getPushStatus();
    const flow = [];
    if (gitStatus === 1) {
      flow.push('git add .', {
        message: `git commit -m ${options.commit || 'update'}`,
        onError() {}
      });
    }
    flow.push(
      `git checkout master`,
      {
        message: 'git pull',
        onError() {}
      },
      `git merge ${curBranch}`,
      'git push'
    );
    const newestTag = tag || (await getNewestTag());
    if (newestTag) {
      flow.push(`git tag ${newestTag}`, `git push origin ${newestTag}`);
    }
    try {
      await this.helper.sequenceExec(flow, {
        debug: options.debug
      });
      await this.deploySuccess(newestTag);
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
        'git pull',
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
  private async write(projectName: string): Promise<void> {
    const logFile = path.resolve(this.helper.root, 'data/gitDeploy.json');
    const fileJSON = await fs.readJSON(logFile, 'utf-8');
    const match = fileJSON.find((item: GitDeploy) => item.name === projectName);
    if (match) {
      match.publishTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    } else {
      fileJSON.push({
        name: projectName,
        publishTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      });
    }
    await fs.writeJSON(logFile, fileJSON);
    const scheduleConnect = await connectService('schedule');
    scheduleConnect.send({
      sendToMainService: true,
      action: 'notify',
      interval: '1h',
      times: 3,
      params: `请查看监控系统：${projectName}`
    });
  }
  private async deploySuccess(tag: string) {
    if (!tag) {
      this.logger.success('部署成功');
      return;
    }
    const projectConf = await readPkg({
      cwd: process.cwd()
    });
    const jenkins = projectConf.jenkins;
    const copyText = `${jenkins.id.replace(/[\-|_]test$/, '')}，${tag}`;
    this.logger.success(`部署成功，复制填入更新文档：
      ${copyText}`);
    clipboard.writeSync(copyText);
    this.write(jenkins.name);
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
  private async deployToProduction() {
    const { options } = this;
    const flow = [
      'git add .',
      `git commit -m ${options.commit || 'update'}`,
      'git pull',
      'git push'
    ];
    const newestTag = await getNewestTag();
    if (newestTag) {
      flow.push(`git tag ${newestTag}`, `git push origin ${newestTag}`);
    }
    await this.helper.sequenceExec(flow, {
      debug: options.debug
    });
    await this.deploySuccess(newestTag);
  }
  private async openDeployPage() {
    const projectConf = await readPkg({
      cwd: process.cwd()
    });
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
