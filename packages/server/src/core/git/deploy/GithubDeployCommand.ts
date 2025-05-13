import BaseDeployCommand, { DeployOptions } from './BaseDeployCommand';

/**
 * Github项目Git部署命令
 * 处理Github项目的部署流程
 */
export default class GithubDeployCommand extends BaseDeployCommand {
    /**
     * 构造函数
     * @param {DeployOptions} options - 命令选项
     */
    constructor(options: DeployOptions) {
        super(options);
    }

    /**
     * 处理主分支的部署流程
     * @returns {Promise<void>}
     */
    private async handleMainBranch(): Promise<void> {
        // 在主分支上只需要执行基础命令
        await this.executeBaseCommands(this.options.commit);
    }

    /**
     * 处理非主分支的部署流程
     * @returns {Promise<void>}
     */
    private async handleOtherBranch(): Promise<void> {
        await this.executeBaseCommands(this.options.commit);

        // 如果指定了prod选项，合并到主分支
        if (this.options.prod) {
            await this.mergeToBranch(this.mainBranch, false);
        }
    }

    /**
     * 实现项目部署的抽象方法
     * 根据当前分支执行不同的部署流程
     * @returns {Promise<void>}
     */
    protected async handleProjectDeploy(): Promise<void> {
        if (this.currentBranch === this.mainBranch) {
            await this.handleMainBranch();
        } else {
            await this.handleOtherBranch();
        }
    }
}
