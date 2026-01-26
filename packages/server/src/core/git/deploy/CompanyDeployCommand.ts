import BaseDeployCommand, { DeployOptions } from './BaseDeployCommand';
import { openDeployPage } from '../utils/jenkins';
import { TagManager, Options as TagOptions } from '../tag';
import { sleep } from '@linzb93/utils';
import path from 'node:path';
import fs from 'fs-extra';

/**
 * 公司项目Git部署命令
 * 处理公司内部项目的部署流程
 */
export default class CompanyDeployCommand extends BaseDeployCommand {
    private tagCommand: TagManager;

    /**
     * 构造函数
     * @param {DeployOptions} options - 命令选项
     */
    constructor(options: DeployOptions) {
        super(options);
        this.tagCommand = new TagManager();
    }

    /**
     * 处理标签和输出信息
     * @returns {Promise<void>}
     */
    protected async handleTagAndOutput(): Promise<void> {
        let version = this.options.version;

        // 如果没有指定version，尝试从package.json读取
        if (!version) {
            try {
                const pkgPath = path.resolve(process.cwd(), 'package.json');
                if (await fs.pathExists(pkgPath)) {
                    const pkg = await fs.readJson(pkgPath);
                    version = pkg.version;
                }
            } catch (error) {
                // 读取失败则忽略，保持version为undefined
            }
        }

        // 创建tag选项
        const tagOptions: TagOptions = {
            type: this.options.type,
            version: version,
            msg: this.options.commit,
        };

        await this.tagCommand.addTag(tagOptions);
    }

    /**
     * 处理master分支的部署流程
     * @returns {Promise<void>}
     */
    private async handleMasterBranch(): Promise<void> {
        if (!this.options.current) {
            this.logger.warn('当前分支为master，将要发布项目');
            await sleep(1500);
        }
        await this.executeBaseCommands(this.options.commit);
        if (!this.options.current) {
            await this.handleTagAndOutput();
        }
        if (this.options.open) {
            await openDeployPage(this.options.type);
        }
    }

    /**
     * 处理release分支的部署流程
     * @returns {Promise<void>}
     */
    private async handleReleaseBranch(): Promise<void> {
        await this.executeBaseCommands(this.options.commit);

        // 打开Jenkins主页
        if (this.options.open !== false) {
            await openDeployPage(this.options.type);
        }
    }

    /**
     * 处理其他分支的部署流程
     * @returns {Promise<void>}
     */
    private async handleOtherBranch(): Promise<void> {
        await this.executeBaseCommands(this.options.commit);

        if (this.options.prod) {
            // 询问用户是否确认发布
            const { confirmDeploy } = await this.inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmDeploy',
                    message: `确认要发布项目吗？这将合并代码到${this.mainBranch}分支并发布`,
                    default: false,
                },
            ]);

            if (!confirmDeploy) {
                this.logger.info('已取消发布操作');
                return;
            }
            // 合并到主分支
            await this.mergeToBranch(this.mainBranch, false);
            await this.handleTagAndOutput();
        } else if (!this.options.current) {
            // 合并到release分支
            await this.mergeToBranch('release', true);

            // 打开Jenkins主页
            if (this.options.open !== false) {
                await openDeployPage(this.options.type);
            }
        }
    }

    /**
     * 实现项目部署的抽象方法
     * 根据当前分支执行不同的部署流程
     * @returns {Promise<void>}
     */
    protected async handleProjectDeploy(): Promise<void> {
        if (this.currentBranch === this.mainBranch) {
            await this.handleMasterBranch();
        } else if (this.currentBranch === 'release') {
            await this.handleReleaseBranch();
        } else {
            await this.handleOtherBranch();
        }
    }
}
