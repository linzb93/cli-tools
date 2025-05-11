import BaseDeployCommand, { DeployOptions } from './BaseDeployCommand';
import { openDeployPage } from '@/utils/jenkins';

/**
 * 公司项目Git部署命令
 * 处理公司内部项目的部署流程
 */
export default class CompanyDeployCommand extends BaseDeployCommand {
    /**
     * 构造函数
     * @param {DeployOptions} options - 命令选项
     */
    constructor(options: DeployOptions) {
        super(options);
    }

    /**
     * 处理master分支的部署流程
     * @returns {Promise<void>}
     */
    private async handleMasterBranch(): Promise<void> {
        // 如果明确指定了prod或current选项
        if (this.options.prod !== undefined || this.options.current !== undefined) {
            await this.executeBaseCommands(this.options.commit);

            // 如果需要发布项目
            if (this.options.prod) {
                await this.handleTagAndOutput();
            }
        } else {
            // 询问用户是否发布项目
            const { shouldPublish } = await this.inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'shouldPublish',
                    message: '是否发布项目?',
                    default: false,
                },
            ]);

            await this.executeBaseCommands(this.options.commit);

            if (shouldPublish) {
                await this.handleTagAndOutput();
            }
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
            // 发布项目流程
            await this.handleTagAndOutput();
        } else if (!this.options.current) {
            // 合并到release分支
            await this.mergeToBranch('release');

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
        if (this.currentBranch === 'master') {
            await this.handleMasterBranch();
        } else if (this.currentBranch === 'release') {
            await this.handleReleaseBranch();
        } else {
            await this.handleOtherBranch();
        }
    }
}
