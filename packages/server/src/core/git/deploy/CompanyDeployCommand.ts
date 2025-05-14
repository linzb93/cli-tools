import BaseDeployCommand, { DeployOptions } from './BaseDeployCommand';
import { openDeployPage } from '@/utils/jenkins';
import TagCommand from '../tag';
import { Options as TagOptions } from '../tag';

/**
 * 公司项目Git部署命令
 * 处理公司内部项目的部署流程
 */
export default class CompanyDeployCommand extends BaseDeployCommand {
    private tagCommand: TagCommand;

    /**
     * 构造函数
     * @param {DeployOptions} options - 命令选项
     */
    constructor(options: DeployOptions) {
        super(options);
        this.tagCommand = new TagCommand();
    }

    /**
     * 处理标签和输出信息
     * @returns {Promise<void>}
     */
    protected async handleTagAndOutput(): Promise<void> {
        // 创建tag选项
        const tagOptions: TagOptions = {
            type: this.options.type,
            version: this.options.version,
        };

        await this.tagCommand.addTag(tagOptions);
    }

    /**
     * 处理master分支的部署流程
     * @returns {Promise<void>}
     */
    private async handleMasterBranch(): Promise<void> {
        // 如果明确指定了prod或current选项
        if (this.options.prod !== undefined || this.options.current !== undefined) {
            await this.executeBaseCommands(this.options.commit, false);

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

            await this.executeBaseCommands(this.options.commit, false);

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
        await this.executeBaseCommands(this.options.commit, false);

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
        await this.executeBaseCommands(this.options.commit, false);

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

            // 发布项目流程
            await this.handleTagAndOutput();

            // 合并到主分支
            await this.mergeToBranch(this.mainBranch, true);
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
